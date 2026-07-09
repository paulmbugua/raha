import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { queryWithRetry } from '../config/db.js';
import { analytics, bookings, models, reviews, verificationCases } from '../data/utamuSeed.js';

const directory = { models, bookings, reviews, verificationCases, analytics };
const JWT_SECRET = process.env.JWT_SECRET || process.env.UTAMU_JWT_SECRET || 'utamu-local-dev-secret';
const APP_URL = (process.env.WEB_APP_URL || process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const MAIL_FROM_ADDRESS = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_FROM || 'noreply@secretnairobi.co.ke';
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'Secret Nairobi';
const MAIL_FROM = process.env.MAIL_FROM || `${MAIL_FROM_NAME} <${MAIL_FROM_ADDRESS}>`;
const MAIL_REPLY_TO = process.env.MAIL_REPLY_TO || MAIL_FROM_ADDRESS;
const VALIDATION_RESEND_COOLDOWN_MS = Number(process.env.UTAMU_VALIDATION_RESEND_COOLDOWN_MS || 60_000);

async function tryQuery(sql, params = []) {
  try {
    const result = await queryWithRetry(sql, params, { retries: 0 });
    return result.rows;
  } catch {
    return null;
  }
}

function scoreModel(model) {
  return Math.round(model.rating * 20 + model.reviews * 0.25 + Number(model.elite) * 25 + Number(model.verified) * 18 + Number(model.online) * 8);
}

function slugify(value) {
  const base = String(value || 'nairobi-model').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return base || 'nairobi-model';
}

function signUser(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role, accountType: user.account_type }, JWT_SECRET, { expiresIn: '14d' });
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    accountType: row.account_type,
    emailVerified: row.email_verified,
    profile: row.profile || {},
    status: row.status,
  };
}

async function authUser(req) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const rows = await tryQuery('select * from utamu_users where id = $1', [payload.sub]);
    return rows?.[0] || null;
  } catch {
    return null;
  }
}

function maskEmail(value) {
  const email = String(value || '').trim();
  const [local, domain] = email.split('@');
  if (!local || !domain) return email ? '[invalid-email]' : '';
  const visible = local.length <= 2 ? `${local[0] || ''}*` : `${local.slice(0, 2)}***${local.slice(-1)}`;
  return `${visible}@${domain}`;
}

function emailFlowLog(event, details = {}, level = 'log') {
  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  logger('[utamu:registration-email]', {
    event,
    at: new Date().toISOString(),
    ...details,
  });
}

function smtpDiagnostics() {
  return {
    hasSmtpHost: Boolean(process.env.SMTP_HOST),
    smtpHost: process.env.SMTP_HOST || null,
    smtpPort: Number(process.env.SMTP_PORT || 587),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    hasSmtpUser: Boolean(process.env.SMTP_USER),
    hasSmtpPass: Boolean(process.env.SMTP_PASS),
    smtpProvider: String(process.env.SMTP_HOST || '').toLowerCase().includes('zoho') ? 'zoho' : 'custom',
    from: MAIL_FROM,
    envelopeFrom: MAIL_FROM_ADDRESS,
    replyTo: MAIL_REPLY_TO,
    appUrl: APP_URL,
  };
}

async function sendValidationEmail(user, confirmationUrl, passwordWasProvided) {
  const baseLog = { userId: user.id, accountType: user.account_type, to: maskEmail(user.email) };
  emailFlowLog('validation_email_prepare', { ...baseLog, ...smtpDiagnostics() });
  const html = '<p>Hello ' + user.full_name + '</p>' +
    '<p>Before you can use the site you will need to validate your email address.</p>' +
    '<p>If you do not validate your email in the next 3 days your account will be deleted.</p>' +
    '<p>Please validate your email address by clicking the link below:<br><a href="' + confirmationUrl + '">' + confirmationUrl + '</a></p>' +
    '<p>Account information:<br>type: <strong>' + user.account_type + '</strong><br>username: <strong>' + (user.username || user.email) + '</strong><br>password: <strong>' + (passwordWasProvided ? '(hidden)' : '(set during registration)') + '</strong></p>' +
    '<p>You can view your account here:<br><a href="' + APP_URL + '/model/dashboard">' + APP_URL + '/model/dashboard</a></p><p>Secret Nairobi - Models in Nairobi</p>';

  if (!process.env.SMTP_HOST) {
    emailFlowLog('validation_email_preview_only', { ...baseLog, reason: 'SMTP_HOST is not configured. Email was not sent to the recipient; validation link is only in backend logs.', confirmationUrl }, 'warn');
    return { delivered: false, html, confirmationUrl };
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const missing = [
      !process.env.SMTP_USER ? 'SMTP_USER' : null,
      !process.env.SMTP_PASS ? 'SMTP_PASS' : null,
    ].filter(Boolean);
    const failure = {
      name: 'SmtpConfigurationError',
      message: `Missing SMTP credentials: ${missing.join(', ')}. Zoho SMTP must authenticate with support@grogonsacco.co.ke credentials or an app-specific password. noreply@secretnairobi.co.ke is used as the sender alias.`,
      code: 'SMTP_CREDENTIALS_MISSING',
      command: null,
      responseCode: null,
      response: null,
    };
    emailFlowLog('validation_email_missing_credentials', { ...baseLog, missing, smtpHost: process.env.SMTP_HOST, smtpProvider: 'zoho', ...failure }, 'error');
    return { delivered: false, html, confirmationUrl, error: failure };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  try {
    emailFlowLog('validation_email_send_attempt', baseLog);
    const info = await transporter.sendMail({
      from: MAIL_FROM,
      replyTo: MAIL_REPLY_TO,
      envelope: { from: MAIL_FROM_ADDRESS, to: user.email },
      to: user.email,
      subject: 'Validate your Secret Nairobi account',
      html,
      text: [
        `Hello ${user.full_name}`,
        'Before you can use the site you will need to validate your email address.',
        `Please validate your email address by opening this link: ${confirmationUrl}`,
        `Account information: type: ${user.account_type}; username: ${user.username || user.email}; password: (hidden)`,
        'Secret Nairobi - Models in Nairobi',
      ].join('\n\n'),
    });
    const result = {
      messageId: info.messageId || null,
      accepted: (info.accepted || []).map(maskEmail),
      rejected: (info.rejected || []).map(maskEmail),
      pending: (info.pending || []).map(maskEmail),
      response: info.response || null,
    };
    emailFlowLog('validation_email_sent', { ...baseLog, ...result });
    return { delivered: true, html, confirmationUrl, provider: result };
  } catch (error) {
    const failure = {
      name: error?.name || 'Error',
      message: error?.message || 'Unknown email delivery error',
      code: error?.code || null,
      command: error?.command || null,
      responseCode: error?.responseCode || null,
      response: error?.response || null,
    };
    emailFlowLog('validation_email_failed', { ...baseLog, ...failure }, 'error');
    return { delivered: false, html, confirmationUrl, error: failure };
  }
}

function validationRetryAfterSeconds(user) {
  if (!user?.validation_sent_at || VALIDATION_RESEND_COOLDOWN_MS <= 0) return 0;
  const lastSentAt = new Date(user.validation_sent_at).getTime();
  if (!Number.isFinite(lastSentAt)) return 0;
  const retryAfterMs = VALIDATION_RESEND_COOLDOWN_MS - (Date.now() - lastSentAt);
  return retryAfterMs > 0 ? Math.ceil(retryAfterMs / 1000) : 0;
}

function validationConfirmationUrl(token) {
  return APP_URL + '/register/confirm-email?token=' + encodeURIComponent(token);
}

async function ensureModelForUser(user, body, profile) {
  if (!['independent-model', 'agency'].includes(user.account_type)) return null;
  const displayName = body.name || body.fullName || body.agencyName || user.full_name;
  const baseSlug = slugify(displayName);
  const slug = baseSlug + '-' + String(user.id).slice(0, 6);
  const city = body.city || profile.city || 'Nairobi';
  const category = user.account_type === 'agency' ? 'Agency Managed Models' : 'Independent Model';
  const rows = await queryWithRetry(
    `insert into utamu_models (user_id, display_name, slug, city, county, category, age, height, bio, status, verified, elite, online, response_time)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',false,false,true,'New account')
     on conflict (slug) do update set display_name = excluded.display_name
     returning *`,
    [user.id, displayName, slug, city, 'Nairobi', category, Number(profile.age || 0) || null, profile.height || null, profile.about || body.about || '',]
  );
  return rows.rows[0];
}

export async function getDirectory(_req, res) {
  const rows = await tryQuery('select payload from utamu_seed where key = $1', ['directory']);
  res.json({ data: rows?.[0]?.payload || directory });
}

export async function searchModels(req, res) {
  const query = String(req.query.query || '').toLowerCase();
  const dbRows = await tryQuery(`select m.*, coalesce(array_agg(i.url) filter (where i.url is not null), '{}') as images
    from utamu_models m
    left join utamu_profile_images i on i.model_id = m.id
    where m.status <> 'deleted'
    group by m.id
    order by m.created_at desc limit 100`);
  const dbModels = (dbRows || []).map((row) => ({
    id: row.id,
    name: row.display_name,
    slug: row.slug,
    city: row.city,
    county: row.county,
    category: row.category,
    age: row.age || 24,
    height: row.height || '165 cm',
    rating: Number(row.rating || 0),
    reviews: Number(row.review_count || 0),
    priceFrom: Number(row.price_from_kes || 0),
    online: row.online,
    verified: row.verified,
    elite: row.elite,
    responseTime: row.response_time || 'New account',
    image: row.images?.[0] || models[0].image,
    gallery: row.images || [],
    bio: row.bio || '',
    specialties: [row.category],
    stats: { bookings: 0, profileViews: 0, completion: 30, earnings: 0 },
    rates: [],
  }));
  const data = [...dbModels, ...models]
    .filter((model) => !query || [model.name, model.city, model.county, model.category, model.specialties.join(' ')].join(' ').toLowerCase().includes(query))
    .map((model) => ({ ...model, rankingScore: scoreModel(model) }))
    .sort((a, b) => b.rankingScore - a.rankingScore);
  res.json({ data });
}

export async function getModel(req, res) {
  const dbRows = await tryQuery('select * from utamu_models where slug = $1 limit 1', [req.params.slug]);
  if (dbRows?.[0]) {
    const imageRows = await tryQuery('select url from utamu_profile_images where model_id = $1 order by sort_order, created_at', [dbRows[0].id]);
    return res.json({ data: { ...dbRows[0], name: dbRows[0].display_name, slug: dbRows[0].slug, image: imageRows?.[0]?.url || models[0].image, gallery: imageRows?.map((i) => i.url) || [], rankingScore: 0 } });
  }
  const model = models.find((item) => item.slug === req.params.slug) || models[0];
  res.json({ data: { ...model, rankingScore: scoreModel(model) } });
}

export async function registerAccount(req, res) {
  const body = req.body || {};
  const accountType = body.accountType || 'member';
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const phone = String(body.phone || '').trim();
  const fullName = body.name || body.fullName || body.agencyName || body.username || 'Secret Nairobi Member';
  const registrationId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(8).toString('hex');
  emailFlowLog('registration_started', {
    registrationId,
    accountType,
    email: maskEmail(email),
    username: body.username || null,
    availabilityCount: Array.isArray(body.availability) ? body.availability.length : 0,
    serviceCount: Array.isArray(body.services) ? body.services.length : 0,
    hasPhone: Boolean(phone),
  });
  if (!email || !password || !body.username) return res.status(400).json({ message: 'Username, email and password are required.' });
  if (!body.availability?.length && accountType === 'independent-model') return res.status(400).json({ message: 'Please select at least one availability option.' });

  const existing = await tryQuery(
    `select * from utamu_users
     where lower(email) = lower($1)
        or lower(username) = lower($2)
        ${phone ? 'or phone = $3' : ''}
     limit 1`,
    phone ? [email, body.username, phone] : [email, body.username]
  );
  if (existing?.[0]) {
    const existingUser = existing[0];
    const sameEmail = String(existingUser.email || '').toLowerCase() === email;
    const samePhone = phone && String(existingUser.phone || '').trim() === phone;
    const pendingEmail = sameEmail && (!existingUser.email_verified || existingUser.status === 'pending_email');
    if (pendingEmail) {
      const validationToken = existingUser.validation_token || crypto.randomBytes(24).toString('hex');
      const retryAfterSeconds = validationRetryAfterSeconds(existingUser);
      const confirmationUrl = validationConfirmationUrl(validationToken);
      if (retryAfterSeconds > 0) {
        emailFlowLog('registration_duplicate_pending_resend_throttled', { registrationId, userId: existingUser.id, email: maskEmail(email), retryAfterSeconds }, 'warn');
        return res.status(200).json({ data: { registrationComplete: true, resentValidation: false, recentlySent: true, retryAfterSeconds, user: publicUser(existingUser), validationToken, confirmationUrl } });
      }
      const updated = await queryWithRetry('update utamu_users set validation_token = $2, validation_sent_at = now() where id = $1 returning *', [existingUser.id, validationToken]);
      const emailPreview = await sendValidationEmail(updated.rows[0], confirmationUrl, false);
      emailFlowLog('registration_duplicate_pending_resend', { registrationId, userId: existingUser.id, email: maskEmail(email), username: body.username, delivered: Boolean(emailPreview?.delivered), errorCode: emailPreview?.error?.code || null, errorMessage: emailPreview?.error?.message || null }, 'warn');
      return res.status(200).json({ data: { registrationComplete: true, resentValidation: true, user: publicUser(updated.rows[0]), validationToken, confirmationUrl, emailPreview } });
    }
    const duplicateField = samePhone ? 'phone' : 'email_or_username';
    emailFlowLog('registration_duplicate', { registrationId, email: maskEmail(email), username: body.username, duplicateField, existingStatus: existingUser.status, existingEmailVerified: existingUser.email_verified }, 'warn');
    return res.status(409).json({
      message: samePhone
        ? 'That phone number is already registered. Please login or use a different phone number.'
        : 'An account already exists with that email or username. Please login or use password recovery.',
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const validationToken = crypto.randomBytes(24).toString('hex');
  const role = accountType === 'member' ? 'client' : 'model';
  const profile = { ...body.profile, city: body.city, country: body.country, services: body.services || [], availability: body.availability || [], preferences: body.preferences || [] };
  let insert;
  try {
    insert = await queryWithRetry(
      `insert into utamu_users (role, full_name, email, phone, status, username, password_hash, email_verified, validation_token, validation_sent_at, account_type, profile)
       values ($1,$2,$3,$4,'pending_email',$5,$6,false,$7,now(),$8,$9::jsonb) returning *`,
      [role, fullName, email, phone || null, body.username, passwordHash, validationToken, accountType, JSON.stringify(profile)]
    );
  } catch (error) {
    if (error?.code === '23505') {
      const constraint = String(error.constraint || '');
      const message =
        constraint === 'utamu_users_phone_key'
          ? 'That phone number is already registered. Please login or use a different phone number.'
          : constraint === 'utamu_users_email_key'
            ? 'That email is already registered. Please login or use password recovery.'
            : constraint === 'utamu_users_username_key'
              ? 'That username is already registered. Please choose another username.'
              : 'An account already exists with those details. Please login or use different details.';
      emailFlowLog('registration_unique_violation', { registrationId, email: maskEmail(email), username: body.username, constraint, code: error.code }, 'warn');
      return res.status(409).json({ message });
    }
    emailFlowLog('registration_insert_failed', { registrationId, email: maskEmail(email), username: body.username, code: error?.code || null, message: error?.message || 'Unknown registration insert error' }, 'error');
    return res.status(500).json({ message: 'Registration could not be completed. Please try again.' });
  }
  const user = insert.rows[0];
  const model = await ensureModelForUser(user, body, profile);
  emailFlowLog('registration_account_created', { registrationId, userId: user.id, modelId: model?.id || null, status: user.status, email: maskEmail(user.email) });
  const confirmationUrl = validationConfirmationUrl(validationToken);
  const emailPreview = await sendValidationEmail(user, confirmationUrl, true);
  emailFlowLog('registration_email_result', { registrationId, userId: user.id, delivered: Boolean(emailPreview?.delivered), errorCode: emailPreview?.error?.code || null, errorMessage: emailPreview?.error?.message || null });
  res.status(201).json({ data: { registrationComplete: true, user: publicUser(user), model, validationToken, confirmationUrl, emailPreview } });
}

export async function confirmEmail(req, res) {
  const token = String(req.body?.token || req.query?.token || '');
  if (!token) return res.status(400).json({ message: 'Validation token is required.' });
  const rows = await tryQuery('select * from utamu_users where validation_token = $1 limit 1', [token]);
  const user = rows?.[0];
  if (!user) return res.status(404).json({ message: 'Validation link is invalid or already used.' });
  const updated = await queryWithRetry('update utamu_users set email_verified = true, status = $2, validation_token = null, last_login_at = now() where id = $1 returning *', [user.id, 'active']);
  const nextUser = updated.rows[0];
  res.json({ data: { token: signUser(nextUser), user: publicUser(nextUser) } });
}

export async function resendValidation(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const resendId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(8).toString('hex');
  emailFlowLog('validation_resend_requested', { resendId, email: maskEmail(email) });
  const rows = await tryQuery('select * from utamu_users where email = $1 limit 1', [email]);
  const user = rows?.[0];
  if (!user) { emailFlowLog('validation_resend_missing_account', { resendId, email: maskEmail(email) }, 'warn'); return res.status(404).json({ message: 'Account not found.' }); }
  const validationToken = user.validation_token || crypto.randomBytes(24).toString('hex');
  const retryAfterSeconds = validationRetryAfterSeconds(user);
  const confirmationUrl = validationConfirmationUrl(validationToken);
  if (retryAfterSeconds > 0) {
    emailFlowLog('validation_resend_throttled', { resendId, userId: user.id, email: maskEmail(email), retryAfterSeconds }, 'warn');
    return res.json({ data: { sent: false, recentlySent: true, retryAfterSeconds, confirmationUrl } });
  }
  const updated = await queryWithRetry('update utamu_users set validation_token = $2, validation_sent_at = now() where id = $1 returning *', [user.id, validationToken]);
  const emailPreview = await sendValidationEmail(updated.rows[0], confirmationUrl, false);
  emailFlowLog('validation_resend_result', { resendId, userId: user.id, delivered: Boolean(emailPreview?.delivered), errorCode: emailPreview?.error?.code || null, errorMessage: emailPreview?.error?.message || null });
  res.json({ data: { sent: true, confirmationUrl, emailPreview } });
}

export async function loginAccount(req, res) {
  const login = String(req.body?.login || req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const rows = await tryQuery('select * from utamu_users where lower(email) = $1 or lower(username) = $1 limit 1', [login]);
  const user = rows?.[0];
  if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ message: 'Invalid login details.' });
  await queryWithRetry('update utamu_users set last_login_at = now() where id = $1', [user.id]);
  res.json({ data: { token: signUser(user), user: publicUser(user) } });
}

export async function getMe(req, res) {
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const modelRows = await tryQuery('select * from utamu_models where user_id = $1 order by created_at desc limit 1', [user.id]);
  const imageRows = await tryQuery('select * from utamu_profile_images where user_id = $1 order by sort_order, created_at', [user.id]);
  const unread = await tryQuery('select count(*)::int as count from utamu_messages where recipient_user_id = $1 and read_at is null', [user.id]);
  res.json({ data: { user: publicUser(user), model: modelRows?.[0] || null, images: imageRows || [], unreadMessages: unread?.[0]?.count || 0 } });
}

function normalizeProfileImageUrl(value) {
  const url = String(value || '').trim();
  const publicBase = (process.env.R2_PUBLIC_BASE_URL_IMAGES || '').replace(/\/$/, '');
  if (!url || /^https?:\/\//i.test(url) || !publicBase) return url;
  return `${publicBase}/${encodeURIComponent(url).replace(/%2F/g, '/')}`;
}

export async function addProfileImage(req, res) {
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const url = normalizeProfileImageUrl(req.body?.url);
  if (!url) return res.status(400).json({ message: 'Image URL is required.' });
  const modelRows = await tryQuery('select id from utamu_models where user_id = $1 order by created_at desc limit 1', [user.id]);
  const inserted = await queryWithRetry('insert into utamu_profile_images (user_id, model_id, url, alt, sort_order) values ($1,$2,$3,$4,$5) returning *', [user.id, modelRows?.[0]?.id || null, url, req.body?.alt || user.full_name, Number(req.body?.sortOrder || 0)]);
  res.status(201).json({ data: inserted.rows[0] });
}

export async function deleteProfileImage(req, res) {
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const id = String(req.params?.id || '').trim();
  if (!id) return res.status(400).json({ message: 'Image id is required.' });
  const deleted = await queryWithRetry('delete from utamu_profile_images where id = $1 and user_id = $2 returning id', [id, user.id]);
  if (!deleted.rows[0]) return res.status(404).json({ message: 'Image not found.' });
  res.json({ data: { deleted: true, id } });
}

export async function sendMessage(req, res) {
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'You need to register or login to send messages.' });
  const body = String(req.body?.message || req.body?.body || '').trim();
  if (!body) return res.status(400).json({ message: 'Message is required.' });
  const modelRows = await tryQuery('select * from utamu_models where slug = $1 limit 1', [req.body?.modelSlug]);
  const model = modelRows?.[0] || null;
  const inserted = await queryWithRetry(
    `insert into utamu_messages (sender_user_id, recipient_user_id, model_id, model_slug, model_name, sender_name, sender_email, subject, body)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
    [user.id, model?.user_id || null, model?.id || null, req.body?.modelSlug || null, req.body?.modelName || model?.display_name || 'Seed model', user.full_name, user.email, req.body?.subject || 'Profile enquiry', body]
  );
  res.status(201).json({ data: inserted.rows[0] });
}

export async function getMessages(req, res) {
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const rows = await tryQuery('select * from utamu_messages where recipient_user_id = $1 or sender_user_id = $1 order by created_at desc limit 100', [user.id]);
  res.json({ data: rows || [] });
}

export async function getNotifications(req, res) {
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const unread = await tryQuery('select count(*)::int as count from utamu_messages where recipient_user_id = $1 and read_at is null', [user.id]);
  res.json({ data: { unreadMessages: unread?.[0]?.count || 0 } });
}

export async function changePassword(req, res) {
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const next = String(req.body?.password || '');
  if (next.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  const hash = await bcrypt.hash(next, 10);
  await queryWithRetry('update utamu_users set password_hash = $2 where id = $1', [user.id, hash]);
  res.json({ data: { changed: true } });
}

export async function createMpesaPayment(req, res) {
  const reference = 'UTAMU-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  res.status(201).json({ data: { reference, status: 'stk_sent', amount: Number(req.body.amount || 500), phone: req.body.phone || null, instructions: 'Check your phone and enter M-Pesa PIN.' } });
}

export async function submitVerification(req, res) {
  res.status(201).json({ data: { id: 'v-' + Date.now(), status: 'pending', submittedAt: new Date().toISOString(), ...req.body } });
}

export async function submitReview(req, res) {
  res.status(201).json({ data: { id: 'r-' + Date.now(), status: 'pending', createdAt: new Date().toISOString(), ...req.body } });
}

export async function getAdmin(_req, res) {
  res.json({ data: { verificationCases, analytics, pending: verificationCases.filter((item) => item.status === 'pending') } });
}
