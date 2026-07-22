import axios from 'axios';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { queryWithRetry } from '../config/db.js';
import { analytics } from '../data/utamuSeed.js';
import { getImageObject, putImageObject } from '../services/r2.js';
import { getAccessToken, getMpesaConfigHealth, MPESA_BASE, mpesaPassword, mpesaTimestamp, resolveStkCallbackUrl, shortcode } from '../utils/mpesa.js';

const directory = { models: [], bookings: [], reviews: [], verificationCases: [], analytics };
const JWT_SECRET = process.env.JWT_SECRET || process.env.UTAMU_JWT_SECRET || 'utamu-local-dev-secret';
const APP_URL = (process.env.WEB_APP_URL || process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const BACKEND_PUBLIC_URL = (process.env.WEB_BACKEND_URL || process.env.BACKEND_PUBLIC_URL || process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4008}`).replace(/\/$/, '');
const LOCAL_R2_IMAGE_PROXY = process.env.UTAMU_PROXY_R2_IMAGES === 'true' || (process.env.UTAMU_PROXY_R2_IMAGES !== 'false' && process.env.NODE_ENV !== 'production');
const MAIL_FROM_ADDRESS = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_FROM || 'noreply@secretnairobi.co.ke';
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'Secret Nairobi';
const MAIL_FROM = process.env.MAIL_FROM || `${MAIL_FROM_NAME} <${MAIL_FROM_ADDRESS}>`;
const MAIL_REPLY_TO = process.env.MAIL_REPLY_TO || MAIL_FROM_ADDRESS;
const VALIDATION_RESEND_COOLDOWN_MS = Number(process.env.UTAMU_VALIDATION_RESEND_COOLDOWN_MS || 60_000);
const VIP_VISIBILITY_PRICE_KES = 5;
const MESSAGE_TOKEN_COST = Number(process.env.UTAMU_MESSAGE_TOKEN_COST || 5);
const TIP_COMMISSION_RATE = Number(process.env.UTAMU_TIP_COMMISSION_RATE || 0.15);
const MONETIZATION_PRODUCTS = [
  { id: 'verification-trusted', category: 'verification', name: 'Trusted verification badge', description: 'Paid ID/document review with a Trusted badge after approval.', amountKes: 1, tokenAmount: 0, durationDays: 365, sortOrder: 10 },
  { id: 'tier-bronze', category: 'listing', name: 'Bronze featured listing', description: 'Monthly profile bumping, 12 photo slots, and stronger ranking.', amountKes: 1, tokenAmount: 0, durationDays: 30, sortOrder: 20 },
  { id: 'tier-silver', category: 'listing', name: 'Silver featured listing', description: 'Faster bumping, 20 photo slots, and search priority.', amountKes: 2, tokenAmount: 0, durationDays: 30, sortOrder: 30 },
  { id: 'tier-gold', category: 'listing', name: 'Gold featured listing', description: 'Top ranking, 30 photo slots, and sidebar ad eligibility.', amountKes: 3, tokenAmount: 0, durationDays: 30, sortOrder: 40 },
  { id: 'tier-vip', category: 'listing', name: 'VIP featured listing', description: 'VIP homepage priority, 40 photo slots, sidebar ad spot, and strongest bumping.', amountKes: 5, tokenAmount: 0, durationDays: 30, sortOrder: 50 },
  { id: 'tokens-100', category: 'wallet', name: '100 message tokens', description: 'Credits for paid messages, private unlocks, and tips.', amountKes: 1, tokenAmount: 100, durationDays: null, sortOrder: 60 },
  { id: 'tokens-300', category: 'wallet', name: '300 message tokens', description: 'Best-value client credits for active messaging and tips.', amountKes: 3, tokenAmount: 300, durationDays: null, sortOrder: 70 },
  { id: 'ai-assistant-monthly', category: 'ai', name: 'AI assistant monthly add-on', description: '24/7 assistant that handles common questions and filters weak leads.', amountKes: 4, tokenAmount: 0, durationDays: 30, sortOrder: 80 },
  { id: 'client-portal-monthly', category: 'client_portal', name: 'Vetted client portal', description: 'Monthly access to vetted-client-only discovery and matchmaking.', amountKes: 5, tokenAmount: 0, durationDays: 30, sortOrder: 90 },
];
const LISTING_TIER_SETTINGS = {
  bronze: { galleryLimit: 12, bumpIntervalHours: 168, sidebarAd: false, elite: false },
  silver: { galleryLimit: 20, bumpIntervalHours: 72, sidebarAd: false, elite: false },
  gold: { galleryLimit: 30, bumpIntervalHours: 24, sidebarAd: true, elite: true },
  vip: { galleryLimit: 40, bumpIntervalHours: 8, sidebarAd: true, elite: true },
};
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET || '';


let utamuTransactionalSchemaReady = false;
let utamuMonetizationSchemaReady = false;
async function ensureUtamuTransactionalSchema() {
  if (utamuTransactionalSchemaReady) return;
  await queryWithRetry("alter table utamu_payments add column if not exists provider_reference text");
  await queryWithRetry("alter table utamu_payments add column if not exists authorization_url text");
  await queryWithRetry("alter table utamu_payments add column if not exists purpose text");
  await queryWithRetry("alter table utamu_payments add column if not exists paid_at timestamptz");
  await queryWithRetry("alter table utamu_payments add column if not exists entitlement_activated_at timestamptz");
  await queryWithRetry("alter table utamu_reviews add column if not exists model_name text");
  await queryWithRetry("alter table utamu_reviews add column if not exists model_image text");
  await queryWithRetry("alter table utamu_reviews add column if not exists author_name text");
  utamuTransactionalSchemaReady = true;
}
async function ensureUtamuMonetizationSchema() {
  if (utamuMonetizationSchemaReady) return;
  await ensureUtamuTransactionalSchema();
  const statements = [
    "alter table utamu_models add column if not exists trusted_badge boolean not null default false",
    "alter table utamu_models add column if not exists verification_tier text not null default 'none'",
    "alter table utamu_models add column if not exists listing_tier text not null default 'free'",
    "alter table utamu_models add column if not exists listing_tier_expires_at timestamptz",
    "alter table utamu_models add column if not exists gallery_limit integer not null default 8",
    "alter table utamu_models add column if not exists sidebar_ad boolean not null default false",
    "alter table utamu_payments add column if not exists metadata jsonb not null default '{}'::jsonb",
    "create table if not exists utamu_monetization_products (id text primary key, category text not null, name text not null, description text not null, amount_kes integer not null, token_amount integer not null default 0, duration_days integer, sort_order integer not null default 0, active boolean not null default true, created_at timestamptz not null default now())",
    "create table if not exists utamu_listing_subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid references utamu_users(id) on delete cascade, model_id uuid references utamu_models(id) on delete cascade, tier text not null, amount_kes integer not null default 0, status text not null default 'active', gallery_limit integer not null default 8, bump_interval_hours integer not null default 168, sidebar_ad boolean not null default false, starts_at timestamptz not null default now(), expires_at timestamptz, payment_id uuid references utamu_payments(id) on delete set null, created_at timestamptz not null default now())",
    "create table if not exists utamu_wallets (user_id uuid primary key references utamu_users(id) on delete cascade, balance_tokens integer not null default 0, lifetime_purchased_tokens integer not null default 0, updated_at timestamptz not null default now())",
    "create table if not exists utamu_wallet_transactions (id uuid primary key default gen_random_uuid(), user_id uuid not null references utamu_users(id) on delete cascade, counterparty_user_id uuid references utamu_users(id) on delete set null, model_id uuid references utamu_models(id) on delete set null, type text not null, amount_tokens integer not null, balance_after integer not null, commission_tokens integer not null default 0, description text, payment_id uuid references utamu_payments(id) on delete set null, created_at timestamptz not null default now())",
    "create table if not exists utamu_ai_assistants (user_id uuid primary key references utamu_users(id) on delete cascade, model_id uuid references utamu_models(id) on delete cascade, enabled boolean not null default false, plan text not null default 'off', monthly_price_kes integer not null default 0, tone text not null default 'polite', instructions text, auto_reply_enabled boolean not null default true, expires_at timestamptz, payment_id uuid references utamu_payments(id) on delete set null, updated_at timestamptz not null default now())",
    "create table if not exists utamu_client_portal_subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid not null references utamu_users(id) on delete cascade, status text not null default 'active', plan text not null default 'vetted-client', amount_kes integer not null default 0, starts_at timestamptz not null default now(), expires_at timestamptz, payment_id uuid references utamu_payments(id) on delete set null, created_at timestamptz not null default now())",
    "create table if not exists utamu_booking_leads (id uuid primary key default gen_random_uuid(), client_user_id uuid references utamu_users(id) on delete set null, provider_user_id uuid references utamu_users(id) on delete set null, model_id uuid references utamu_models(id) on delete set null, model_slug text, model_name text, requested_date timestamptz, location text, budget_kes integer, message text not null, status text not null default 'new', lead_fee_kes integer not null default 0, created_at timestamptz not null default now())",
    "create table if not exists utamu_tips (id uuid primary key default gen_random_uuid(), sender_user_id uuid references utamu_users(id) on delete set null, recipient_user_id uuid references utamu_users(id) on delete set null, model_id uuid references utamu_models(id) on delete set null, amount_tokens integer not null, commission_tokens integer not null, message text, created_at timestamptz not null default now())",
    "create index if not exists utamu_listing_subscriptions_model_idx on utamu_listing_subscriptions (model_id, status, expires_at desc)",
    "create index if not exists utamu_wallet_transactions_user_idx on utamu_wallet_transactions (user_id, created_at desc)",
    "create index if not exists utamu_booking_leads_provider_idx on utamu_booking_leads (provider_user_id, created_at desc)",
    "create index if not exists utamu_booking_leads_client_idx on utamu_booking_leads (client_user_id, created_at desc)",
  ];
  for (const statement of statements) await queryWithRetry(statement);
  for (const product of MONETIZATION_PRODUCTS) {
    await queryWithRetry(
      "insert into utamu_monetization_products (id, category, name, description, amount_kes, token_amount, duration_days, sort_order) values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (id) do update set category = excluded.category, name = excluded.name, description = excluded.description, amount_kes = excluded.amount_kes, token_amount = excluded.token_amount, duration_days = excluded.duration_days, sort_order = excluded.sort_order, active = true",
      [product.id, product.category, product.name, product.description, product.amountKes, product.tokenAmount, product.durationDays, product.sortOrder]
    );
  }
  utamuMonetizationSchemaReady = true;
}

function productById(id) {
  return MONETIZATION_PRODUCTS.find((product) => product.id === id);
}

function paymentDescriptionFor(product) {
  return `Secret Nairobi - ${product?.name || 'premium upgrade'}`;
}

function isFutureDate(value) {
  if (!value) return true;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > Date.now();
}

function isAssistantEntitlementActive(assistant) {
  return Boolean(assistant && assistant.plan === 'assistant' && isFutureDate(assistant.expires_at));
}

function mpesaCallbackDetails(callback) {
  const items = callback?.CallbackMetadata?.Item || [];
  const valueFor = (name) => items.find((item) => item.Name === name)?.Value ?? null;
  return {
    checkoutRequestId: callback?.CheckoutRequestID || null,
    merchantRequestId: callback?.MerchantRequestID || null,
    resultCode: callback?.ResultCode ?? null,
    resultDesc: callback?.ResultDesc || null,
    amount: valueFor('Amount'),
    receiptNumber: valueFor('MpesaReceiptNumber'),
    transactionDate: valueFor('TransactionDate'),
    phoneNumber: valueFor('PhoneNumber'),
  };
}

function assistantReplyFor(assistant, model, inboundMessage) {
  const tone = String(assistant?.tone || 'polite').toLowerCase();
  const instructions = String(assistant?.instructions || '').trim();
  const intro = tone === 'direct'
    ? 'Thanks. Your enquiry has been received.'
    : tone === 'premium'
      ? 'Thank you for reaching out. Your enquiry has been received and will be handled discreetly.'
      : tone === 'warm'
        ? 'Thanks for reaching out. I have received your message.'
        : 'Thank you. Your enquiry has been received.';
  const guidance = instructions
    ? `Profile guidance: ${instructions}`
    : 'Please include your preferred time, Nairobi area, and any screening details so availability can be reviewed.';
  const context = inboundMessage ? `Message noted: ${String(inboundMessage).slice(0, 180)}` : '';
  return [intro, `This is ${model?.display_name || 'the profile'} assistant.`, guidance, context].filter(Boolean).join('\n\n');
}

function expiresSql(days) {
  return days ? `now() + interval '${Number(days)} days'` : 'null';
}

async function modelForUser(user) {
  if (!user?.id) return null;
  const rows = await tryQuery('select * from utamu_models where user_id = $1 order by created_at desc limit 1', [user.id]);
  return rows?.[0] || null;
}

async function walletFor(userId) {
  const row = await queryWithRetry('insert into utamu_wallets (user_id) values ($1) on conflict (user_id) do update set updated_at = utamu_wallets.updated_at returning *', [userId]);
  return row.rows[0];
}

async function creditWallet(userId, tokens, description, paymentId = null, counterpartyUserId = null, modelId = null, type = 'credit') {
  await walletFor(userId);
  const updated = await queryWithRetry('update utamu_wallets set balance_tokens = balance_tokens + $2, lifetime_purchased_tokens = lifetime_purchased_tokens + greatest($2, 0), updated_at = now() where user_id = $1 returning *', [userId, tokens]);
  const wallet = updated.rows[0];
  await queryWithRetry('insert into utamu_wallet_transactions (user_id, counterparty_user_id, model_id, type, amount_tokens, balance_after, description, payment_id) values ($1,$2,$3,$4,$5,$6,$7,$8)', [userId, counterpartyUserId, modelId, type, tokens, wallet.balance_tokens, description, paymentId]);
  return wallet;
}

async function debitWallet(userId, tokens, description, counterpartyUserId = null, modelId = null, type = 'debit') {
  await walletFor(userId);
  const updated = await queryWithRetry('update utamu_wallets set balance_tokens = balance_tokens - $2, updated_at = now() where user_id = $1 and balance_tokens >= $2 returning *', [userId, tokens]);
  const wallet = updated.rows[0];
  if (!wallet) return null;
  await queryWithRetry('insert into utamu_wallet_transactions (user_id, counterparty_user_id, model_id, type, amount_tokens, balance_after, description) values ($1,$2,$3,$4,$5,$6,$7)', [userId, counterpartyUserId, modelId, type, -tokens, wallet.balance_tokens, description]);
  return wallet;
}

async function activatePaidEntitlement(reference) {
  await ensureUtamuMonetizationSchema();
  const claimed = await queryWithRetry(
    "update utamu_payments set entitlement_activated_at = now() where (reference = $1 or provider_reference = $1) and status = 'paid' and entitlement_activated_at is null returning *",
    [reference]
  );
  const payment = claimed.rows[0];
  if (!payment) {
    const rows = await tryQuery('select * from utamu_payments where reference = $1 or provider_reference = $1 limit 1', [reference]);
    return rows?.[0] || null;
  }
  try {
    const metadata = payment.metadata || {};
    const product = productById(metadata.productId) || MONETIZATION_PRODUCTS.find((item) => item.id === metadata.purpose);
    const model = await resolvePaymentModel({ modelId: metadata.modelId, modelSlug: metadata.modelSlug }, payment.user_id ? { id: payment.user_id } : null);
    if (payment.purpose === 'vip_visibility' || metadata.purpose === 'vip_visibility') {
      await activateVipVisibility(reference);
      return payment;
    }
    if (!product) return payment;
    if (product.category === 'wallet') {
      await creditWallet(payment.user_id, product.tokenAmount, product.name, payment.id, null, model?.id || null, 'purchase');
    }
    if (product.category === 'verification' && model?.id) {
      await queryWithRetry("update utamu_models set verified = true, trusted_badge = true, verification_tier = 'trusted' where id = $1", [model.id]);
      await queryWithRetry("insert into utamu_verifications (model_id, status, risk, notes) values ($1,'approved','low','Paid Trusted badge activated after checkout')", [model.id]);
    }
    if (product.category === 'listing' && model?.id) {
      const tier = product.id.replace('tier-', '');
      const settings = LISTING_TIER_SETTINGS[tier] || LISTING_TIER_SETTINGS.bronze;
      await queryWithRetry(`insert into utamu_listing_subscriptions (user_id, model_id, tier, amount_kes, gallery_limit, bump_interval_hours, sidebar_ad, expires_at, payment_id) values ($1,$2,$3,$4,$5,$6,$7,${expiresSql(product.durationDays)},$8)`, [payment.user_id, model.id, tier, product.amountKes, settings.galleryLimit, settings.bumpIntervalHours, settings.sidebarAd, payment.id]);
      await queryWithRetry(`update utamu_models set listing_tier = $2, gallery_limit = $3, sidebar_ad = $4, elite = case when $5 then true else elite end, listing_tier_expires_at = ${expiresSql(product.durationDays)} where id = $1`, [model.id, tier, settings.galleryLimit, settings.sidebarAd, settings.elite]);
    }
    if (product.category === 'ai' && model?.id) {
      await queryWithRetry(`insert into utamu_ai_assistants (user_id, model_id, enabled, plan, monthly_price_kes, expires_at, payment_id) values ($1,$2,true,'assistant',$3,${expiresSql(product.durationDays)},$4) on conflict (user_id) do update set model_id = excluded.model_id, enabled = true, plan = excluded.plan, monthly_price_kes = excluded.monthly_price_kes, expires_at = excluded.expires_at, payment_id = excluded.payment_id, updated_at = now()`, [payment.user_id, model.id, product.amountKes, payment.id]);
    }
    if (product.category === 'client_portal') {
      await queryWithRetry(`insert into utamu_client_portal_subscriptions (user_id, status, plan, amount_kes, expires_at, payment_id) values ($1,'active','vetted-client',$2,${expiresSql(product.durationDays)},$3)`, [payment.user_id, product.amountKes, payment.id]);
    }
    return payment;
  } catch (error) {
    await queryWithRetry('update utamu_payments set entitlement_activated_at = null where id = $1', [payment.id]).catch(() => {});
    throw error;
  }
}

function isUuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '')); }
function normalizeKenyanMsisdn(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return '254' + digits.slice(1);
  if (digits.length === 9) return '254' + digits;
  return digits;
}
async function resolvePaymentModel(body, user) {
  if (isUuid(body?.modelId)) {
    const rows = await tryQuery('select * from utamu_models where id = $1 limit 1', [body.modelId]);
    if (rows?.[0]) return rows[0];
  }
  if (body?.modelSlug) {
    const rows = await tryQuery('select * from utamu_models where slug = $1 limit 1', [body.modelSlug]);
    if (rows?.[0]) return rows[0];
  }
  if (user?.id) {
    const rows = await tryQuery('select * from utamu_models where user_id = $1 order by created_at desc limit 1', [user.id]);
    if (rows?.[0]) return rows[0];
  }
  return null;
}
async function activateVipVisibility(reference) {
  const rows = await tryQuery('select model_id from utamu_payments where reference = $1 or provider_reference = $1 limit 1', [reference]);
  const modelId = rows?.[0]?.model_id;
  if (!modelId) return null;
  const updated = await queryWithRetry('update utamu_models set elite = true, status = case when status = $2 then $3 else status end where id = $1 returning *', [modelId, 'pending', 'active']);
  return updated.rows[0] || null;
}
function publicPayment(row, extra = {}) {
  return { id: row?.id, reference: row?.reference || extra.reference, providerReference: row?.provider_reference || extra.providerReference || null, status: row?.status || extra.status || 'pending', amount: Number(row?.amount_kes || extra.amount || VIP_VISIBILITY_PRICE_KES), method: row?.method || extra.method, authorizationUrl: row?.authorization_url || extra.authorizationUrl || null, instructions: extra.instructions };
}
function mapReviewRow(row) {
  return { id: row.id, modelName: row.model_name || row.display_name || 'Secret Nairobi escort', modelImage: normalizeProfileImageUrl(row.model_image || row.image_url) || '', author: row.anonymous ? 'Anonymous member' : row.author_name || row.full_name || 'Normal user', rating: Number(row.rating || 5), body: row.body || '', createdAt: row.created_at };
}

function profileFromRow(row) {
  if (!row?.profile) return {};
  if (typeof row.profile === 'object') return row.profile;
  try { return JSON.parse(row.profile); } catch { return {}; }
}

function publicModelFromRow(row) {
  const profile = profileFromRow(row);
  const images = (row.images || []).map(normalizeProfileImageUrl).filter(Boolean);
  const services = Array.isArray(profile.services) ? profile.services.filter(Boolean) : [];
  const rates = Array.isArray(profile.rates) ? profile.rates : [];
  return {
    id: row.id,
    userId: row.user_id,
    name: row.display_name,
    slug: row.slug,
    city: row.city || profile.city || 'Nairobi',
    county: row.county || profile.country || 'Kenya',
    category: row.category || 'Independent Escort',
    gender: row.gender || profile.gender || 'Female',
    phone: profile.phone || row.phone || null,
    age: row.age || Number(profile.age || 0) || 24,
    height: row.height || profile.height || '165 cm',
    rating: Number(row.rating || 0),
    reviews: Number(row.review_count || 0),
    priceFrom: Number(row.price_from_kes || profile.priceFrom || 0),
    online: Boolean(row.online),
    verified: Boolean(row.verified),
    elite: Boolean(row.elite),
    responseTime: row.response_time || 'New account',
    trustedBadge: Boolean(row.trusted_badge),
    listingTier: row.listing_tier || 'free',
    galleryLimit: Number(row.gallery_limit || 8),
    sidebarAd: Boolean(row.sidebar_ad),
    image: images[0] || '',
    gallery: images,
    bio: row.bio || profile.about || '',
    specialties: services.length ? services : [row.category || 'Independent Escort'],
    profile,
    stats: { bookings: 0, profileViews: 0, completion: images.length ? 70 : 40, earnings: 0 },
    rates,
    createdAt: row.created_at,
  };
}
async function tryQuery(sql, params = []) {
  try {
    const result = await queryWithRetry(sql, params, { retries: 0 });
    return result.rows;
  } catch {
    return null;
  }
}

function listingTierWeight(model) {
  const tier = String(model.listingTier || model.listing_tier || '').toLowerCase();
  return tier === 'vip' ? 80 : tier === 'gold' ? 60 : tier === 'silver' ? 40 : tier === 'bronze' ? 20 : 0;
}

function scoreModel(model) {
  return Math.round(model.rating * 20 + model.reviews * 0.25 + Number(model.elite) * 25 + Number(model.verified) * 18 + Number(model.trustedBadge || model.trusted_badge) * 30 + listingTierWeight(model) + Number(model.online) * 8);
}

function slugify(value) {
  const base = String(value || 'nairobi-escort').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return base || 'nairobi-escort';
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

function allowsUnverifiedLoginInDevelopment() {
  return process.env.NODE_ENV !== 'production' && process.env.UTAMU_DISABLE_DEV_UNVERIFIED_LOGIN !== 'true';
}

function loginFlowLog(event, details = {}, level = 'log') {
  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  logger('[utamu:login]', {
    event,
    at: new Date().toISOString(),
    ...details,
  });
}

function displayAccountType(accountType) {
  if (accountType === 'independent-model') return 'independent escort';
  if (accountType === 'member') return 'normal user';
  return accountType || 'account';
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
  const accountTypeDisplay = displayAccountType(user.account_type);
  const baseLog = { userId: user.id, accountType: user.account_type, to: maskEmail(user.email) };
  emailFlowLog('validation_email_prepare', { ...baseLog, accountTypeDisplay, ...smtpDiagnostics() });
  const html = '<p>Hello ' + user.full_name + '</p>' +
    '<p>Before you can use the site you will need to validate your email address.</p>' +
    '<p>If you do not validate your email in the next 3 days your account will be deleted.</p>' +
    '<p>Please validate your email address by clicking the link below:<br><a href="' + confirmationUrl + '">' + confirmationUrl + '</a></p>' +
    '<p>Account information:<br>type: <strong>' + accountTypeDisplay + '</strong><br>username: <strong>' + (user.username || user.email) + '</strong><br>password: <strong>' + (passwordWasProvided ? '(hidden)' : '(set during registration)') + '</strong></p>' +
    '<p>You can view your account here:<br><a href="' + APP_URL + '/escort/dashboard">' + APP_URL + '/escort/dashboard</a></p><p>Secret Nairobi - Escorts in Nairobi</p>';

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
        `Account information: type: ${accountTypeDisplay}; username: ${user.username || user.email}; password: (hidden)`,
        'Secret Nairobi - Escorts in Nairobi',
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
  const category = user.account_type === 'agency' ? 'Agency Managed Escorts' : 'Independent Escort';
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
  const dbRows = await tryQuery(`select m.*, u.profile, u.profile->>'gender' as gender, u.phone, coalesce(i.images, '{}') as images
    from utamu_models m
    left join utamu_users u on u.id = m.user_id
    left join lateral (
      select array_agg(url order by sort_order, created_at) filter (where url is not null) as images
      from utamu_profile_images
      where model_id = m.id
    ) i on true
    where m.status <> 'deleted'
    order by m.elite desc, m.rating desc, m.created_at desc limit 100`);
  const dbModels = (dbRows || []).map(publicModelFromRow);
  const reviewRows = await getReviewRows();
  const nextAnalytics = { ...analytics, activeModels: dbModels.length };
  res.json({ data: { ...directory, models: dbModels.sort((a, b) => scoreModel(b) - scoreModel(a)), reviews: reviewRows, analytics: nextAnalytics } });
}


export async function searchModels(req, res) {
  const query = String(req.query.query || '').toLowerCase();
  const city = String(req.query.city || 'All');
  const gender = String(req.query.gender || 'All');
  const listing = String(req.query.listing || 'All');
  const service = String(req.query.service || 'All');
  const minPrice = Number(req.query.minPrice || 0);
  const maxPrice = Number(req.query.maxPrice || 0);
  const verified = String(req.query.verified || '') === 'true';
  const vip = String(req.query.vip || '') === 'true';
  const dbRows = await tryQuery(`select m.*, u.profile, u.profile->>'gender' as gender, u.phone, coalesce(i.images, '{}') as images
    from utamu_models m
    left join utamu_users u on u.id = m.user_id
    left join lateral (
      select array_agg(url order by sort_order, created_at) filter (where url is not null) as images
      from utamu_profile_images
      where model_id = m.id
    ) i on true
    where m.status <> 'deleted'
    order by m.created_at desc limit 100`);
  const dbModels = (dbRows || []).map(publicModelFromRow);
  const data = dbModels
    .filter((model) => !query || [model.name, model.city, model.county, model.category, model.specialties.join(' '), model.gender, model.listingTier].join(' ').toLowerCase().includes(query))
    .filter((model) => city === 'All' || model.county === city || model.city === city)
    .filter((model) => gender === 'All' || String(model.gender || 'Female').toLowerCase() === gender.toLowerCase())
    .filter((model) => service === 'All' || model.specialties.some((item) => item.toLowerCase().includes(service.toLowerCase())) || model.category.toLowerCase().includes(service.toLowerCase()))
    .filter((model) => !minPrice || Number(model.priceFrom || 0) >= minPrice)
    .filter((model) => !maxPrice || Number(model.priceFrom || 0) <= maxPrice)
    .filter((model) => {
      if (listing === 'VIP') return model.elite || model.listingTier === 'vip';
      if (listing === 'Independent') return [model.category, model.specialties.join(' '), model.listingTier].join(' ').toLowerCase().includes('independent');
      if (listing === 'Trusted') return model.verified || Boolean(model.trustedBadge);
      return true;
    })
    .filter((model) => !verified || model.verified)
    .filter((model) => !vip || model.elite)
    .map((model) => ({ ...model, rankingScore: scoreModel(model) }))
    .sort((a, b) => b.rankingScore - a.rankingScore);
  res.json({ data });
}

export async function getModel(req, res) {
  const dbRows = await tryQuery(`select m.*, u.profile, u.profile->>'gender' as gender, u.phone, coalesce(i.images, '{}') as images
    from utamu_models m
    left join utamu_users u on u.id = m.user_id
    left join lateral (
      select array_agg(url order by sort_order, created_at) filter (where url is not null) as images
      from utamu_profile_images
      where model_id = m.id
    ) i on true
    where m.status <> 'deleted'
    and m.slug = $1
    limit 1`, [req.params.slug]);
  if (!dbRows?.[0]) return res.status(404).json({ message: 'Profile not found.' });
  const model = publicModelFromRow(dbRows[0]);
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
  const login = String(req.body?.login || req.body?.email || req.body?.username || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const requestId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(8).toString('hex');
  loginFlowLog('login_started', { requestId, login: maskEmail(login), hasPassword: Boolean(password), passwordLength: password.length });
  if (!login || !password) {
    loginFlowLog('login_missing_fields', { requestId, login: maskEmail(login), hasPassword: Boolean(password) }, 'warn');
    return res.status(400).json({ message: 'Email/username and password are required.' });
  }
  const rows = await tryQuery('select * from utamu_users where lower(email) = $1 or lower(username) = $1 limit 1', [login]);
  const user = rows?.[0];
  loginFlowLog('login_lookup_result', {
    requestId,
    login: maskEmail(login),
    found: Boolean(user),
    userId: user?.id || null,
    accountType: user?.account_type || null,
    status: user?.status || null,
    emailVerified: user?.email_verified ?? null,
    hasPasswordHash: Boolean(user?.password_hash),
  }, user ? 'log' : 'warn');
  if (!user) return res.status(401).json({ message: 'No account exists for that email or username.' });
  if (!user.password_hash) {
    loginFlowLog('login_missing_password_hash', { requestId, userId: user.id, login: maskEmail(login) }, 'error');
    return res.status(401).json({ message: 'This account has no password set. Please reset your password or register again.' });
  }
  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  loginFlowLog('login_password_checked', { requestId, userId: user.id, passwordMatches }, passwordMatches ? 'log' : 'warn');
  if (!passwordMatches) return res.status(401).json({ message: 'Password is incorrect.' });
  const pendingEmailVerification = !user.email_verified || user.status === 'pending_email';
  const devBypassEmailVerification = pendingEmailVerification && allowsUnverifiedLoginInDevelopment();
  if (pendingEmailVerification && !devBypassEmailVerification) {
    loginFlowLog('login_blocked_pending_email', { requestId, userId: user.id, status: user.status, emailVerified: user.email_verified, nodeEnv: process.env.NODE_ENV || 'development' }, 'warn');
    return res.status(403).json({ message: 'Please confirm your email before logging in.' });
  }
  if (devBypassEmailVerification) {
    loginFlowLog('login_dev_email_confirmation_bypassed', { requestId, userId: user.id, status: user.status, emailVerified: user.email_verified, nodeEnv: process.env.NODE_ENV || 'development' }, 'warn');
  }
  await queryWithRetry('update utamu_users set last_login_at = now() where id = $1', [user.id]);
  loginFlowLog('login_success', { requestId, userId: user.id, accountType: user.account_type, devBypassEmailVerification });
  res.json({ data: { token: signUser(user), user: publicUser(user), devBypassEmailVerification } });
}


export async function getMe(req, res) {
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const modelRows = await tryQuery('select * from utamu_models where user_id = $1 order by created_at desc limit 1', [user.id]);
  const imageRows = await tryQuery('select * from utamu_profile_images where user_id = $1 order by sort_order, created_at', [user.id]);
  const unread = await tryQuery('select count(*)::int as count from utamu_messages where recipient_user_id = $1 and read_at is null', [user.id]);
  res.json({ data: { user: publicUser(user), model: modelRows?.[0] || null, images: normalizeProfileImageRows(imageRows), unreadMessages: unread?.[0]?.count || 0 } });
}

function imagePublicBase() {
  const raw = String(process.env.R2_PUBLIC_BASE_URL_IMAGES || 'https://images.secretnairobi.co.ke').trim().replace(/\/+$/, '');
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, '')}`;
}

function profileImageKeyFromUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  const publicBase = imagePublicBase();
  const baseHost = publicBase ? new URL(publicBase).hostname : '';
  const normalized = /^\/\//.test(url) ? `https:${url}` : /^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(url) ? `https://${url}` : url;
  try {
    const parsed = new URL(normalized);
    if (baseHost && parsed.hostname === baseHost) return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    return '';
  } catch {
    if (/^profiles\//i.test(url)) return url.replace(/^\/+/, '');
    return '';
  }
}

function profileImageProxyUrl(key) {
  return `${BACKEND_PUBLIC_URL}/api/utamu/images/proxy/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
}

function normalizeProfileImageUrl(value) {
  const url = String(value || '').trim();
  const publicBase = imagePublicBase();
  if (!url) return '';
  const key = profileImageKeyFromUrl(url);
  if (LOCAL_R2_IMAGE_PROXY && key) return profileImageProxyUrl(key);
  if (/^\/\//.test(url)) return `https:${url}`;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(url)) return `https://${url.replace(/^\/+/, '')}`;
  if (!publicBase) return url;
  return `${publicBase}/${encodeURIComponent(url).replace(/%2F/g, '/')}`;
}

function normalizeProfileImageRow(row) {
  return row ? { ...row, url: normalizeProfileImageUrl(row.url) } : row;
}

function normalizeProfileImageRows(rows) {
  return (rows || []).map(normalizeProfileImageRow);
}

function safeUploadName(name = 'profile-image') {
  return String(name).toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'profile-image';
}

function imageExtension(mime = '') {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}

export async function updateAccountProfile(req, res) {
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const body = req.body || {};
  const incomingProfile = body.profile && typeof body.profile === 'object' ? body.profile : body;
  const currentProfile = user.profile || {};
  const services = Array.isArray(body.services) ? body.services : Array.isArray(incomingProfile.services) ? incomingProfile.services : [];
  const availability = Array.isArray(body.availability) ? body.availability : Array.isArray(incomingProfile.availability) ? incomingProfile.availability : [];
  const languages = Array.isArray(incomingProfile.languages) ? incomingProfile.languages : [];
  const fullName = String(body.name || incomingProfile.name || user.full_name || '').trim() || user.full_name;
  const phone = String(body.phone || incomingProfile.phone || user.phone || '').trim() || null;
  const city = String(body.city || incomingProfile.city || currentProfile.city || '').trim() || null;
  const country = String(body.country || incomingProfile.country || currentProfile.country || '').trim() || null;
  const nextProfile = {
    ...currentProfile,
    ...incomingProfile,
    name: fullName,
    phone,
    city,
    country,
    services,
    availability,
    languages,
  };

  try {
    const updated = await queryWithRetry(
      'update utamu_users set full_name = $2, phone = $3, profile = $4::jsonb where id = $1 returning *',
      [user.id, fullName, phone, JSON.stringify(nextProfile)]
    );
    const modelRows = await tryQuery('select * from utamu_models where user_id = $1 order by created_at desc limit 1', [user.id]);
    let model = modelRows?.[0] || null;
    if (model) {
      const changed = await queryWithRetry(
        'update utamu_models set display_name = $2, city = coalesce($3, city), height = coalesce($4, height), bio = coalesce($5, bio) where id = $1 returning *',
        [model.id, fullName, city, nextProfile.height || null, nextProfile.about || null]
      );
      model = changed.rows[0] || model;
    }
    res.json({ data: { user: publicUser(updated.rows[0]), model } });
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ message: 'That phone number is already registered. Please use a different phone number.' });
    }
    console.error('[utamu:account-profile] update_failed', { userId: user.id, code: error?.code || null, message: error?.message || 'Unknown profile update error' });
    res.status(500).json({ message: 'Profile changes could not be saved. Please try again.' });
  }
}

export async function addProfileImage(req, res) {
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const url = normalizeProfileImageUrl(req.body?.url);
  if (!url) return res.status(400).json({ message: 'Image URL is required.' });
  const modelRows = await tryQuery('select id from utamu_models where user_id = $1 order by created_at desc limit 1', [user.id]);
  const inserted = await queryWithRetry('insert into utamu_profile_images (user_id, model_id, url, alt, sort_order) values ($1,$2,$3,$4,$5) returning *', [user.id, modelRows?.[0]?.id || null, url, req.body?.alt || user.full_name, Number(req.body?.sortOrder || 0)]);
  res.status(201).json({ data: normalizeProfileImageRow(inserted.rows[0]) });
}

export async function uploadProfileImages(req, res) {
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) return res.status(400).json({ message: 'Please select at least one image.' });
  const modelRows = await tryQuery('select id from utamu_models where user_id = $1 order by created_at desc limit 1', [user.id]);
  const modelId = modelRows?.[0]?.id || null;
  const inserted = [];

  for (const [index, file] of files.entries()) {
    const ext = imageExtension(file.mimetype);
    const unique = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(12).toString('hex');
    const key = ['profiles', user.id, unique + '-' + safeUploadName(file.originalname) + '.' + ext].join('/');
    const uploaded = await putImageObject({ key, body: file.buffer, contentType: file.mimetype });
    const row = await queryWithRetry('insert into utamu_profile_images (user_id, model_id, url, alt, sort_order) values ($1,$2,$3,$4,$5) returning *', [user.id, modelId, uploaded.url, file.originalname || user.full_name, Number(req.body?.sortOrder || 0) + index]);
    inserted.push(normalizeProfileImageRow(row.rows[0]));
  }

  res.status(201).json({ data: inserted });
}

export async function proxyProfileImage(req, res) {
  const key = decodeURIComponent(String(req.params?.[0] || '')).replace(/^\/+/, '');
  if (!key || key.includes('..')) return res.status(400).json({ message: 'Invalid image key.' });
  try {
    const object = await getImageObject(key);
    const requestOrigin = req.get('origin');
    if (requestOrigin) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Vary', 'Origin');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Timing-Allow-Origin', '*');
    res.setHeader('Content-Type', object.ContentType || 'application/octet-stream');
    if (object.ContentLength) res.setHeader('Content-Length', String(object.ContentLength));
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (object.Body?.pipe) return object.Body.pipe(res);
    const chunks = [];
    for await (const chunk of object.Body) chunks.push(Buffer.from(chunk));
    return res.end(Buffer.concat(chunks));
  } catch (error) {
    console.error('[utamu:image-proxy] fetch_failed', { key, name: error?.name || null, code: error?.Code || error?.code || null, message: error?.message || 'Unknown R2 image proxy error' });
    return res.status(error?.$metadata?.httpStatusCode === 404 || error?.name === 'NoSuchKey' ? 404 : 502).json({ message: 'Image could not be loaded.' });
  }
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
  await ensureUtamuMonetizationSchema();
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'You need to register or login to send messages.' });
  const body = String(req.body?.message || req.body?.body || '').trim();
  if (!body) return res.status(400).json({ message: 'Message is required.' });
  const modelRows = await tryQuery('select * from utamu_models where slug = $1 limit 1', [req.body?.modelSlug]);
  const model = modelRows?.[0] || null;
  let wallet = null;
  if (user.role === 'client') {
    wallet = await debitWallet(user.id, MESSAGE_TOKEN_COST, `Paid message to ${model?.display_name || req.body?.modelName || 'profile'}`, model?.user_id || null, model?.id || null, 'message');
    if (!wallet) return res.status(402).json({ message: `Buy message tokens to send private messages. This action costs ${MESSAGE_TOKEN_COST} tokens.` });
  }
  const inserted = await queryWithRetry(
    `insert into utamu_messages (sender_user_id, recipient_user_id, model_id, model_slug, model_name, sender_name, sender_email, subject, body)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
    [user.id, model?.user_id || null, model?.id || null, req.body?.modelSlug || null, req.body?.modelName || model?.display_name || 'Seed escort', user.full_name, user.email, req.body?.subject || 'Profile enquiry', body]
  );
  const assistantRows = model?.user_id ? await tryQuery('select * from utamu_ai_assistants where user_id = $1 and enabled = true and auto_reply_enabled = true and plan = $2 and (expires_at is null or expires_at > now()) limit 1', [model.user_id, 'assistant']) : null;
  if (assistantRows?.[0]) {
    const reply = assistantReplyFor(assistantRows[0], model, body);
    await queryWithRetry(
      `insert into utamu_messages (sender_user_id, recipient_user_id, model_id, model_slug, model_name, sender_name, sender_email, subject, body)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [model.user_id, user.id, model.id, req.body?.modelSlug || null, model.display_name, `${model.display_name} assistant`, 'assistant@secretnairobi.local', 'Automated availability response', reply]
    );
  }
  res.status(201).json({ data: { ...inserted.rows[0], wallet } });
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
  await ensureUtamuMonetizationSchema();
  const user = await authUser(req);
  const phone = normalizeKenyanMsisdn(req.body?.phone);
  if (!/^254(7|1)\d{8}$/.test(phone)) return res.status(400).json({ message: 'Enter a valid Kenyan M-Pesa phone number.' });
  const amount = Math.max(1, Math.round(Number(req.body?.amount || VIP_VISIBILITY_PRICE_KES)));
  const callbackUrl = resolveStkCallbackUrl({ product: 'Utamu' });
  const health = getMpesaConfigHealth();
  const missing = [...health.missing, !callbackUrl ? 'MPESA_Utamu_CALLBACK_URL' : null].filter(Boolean);
  if (missing.length) return res.status(503).json({ message: 'M-Pesa is not fully configured.', missing });
  const model = await resolvePaymentModel(req.body || {}, user);
  const timestamp = mpesaTimestamp();
  const payload = { BusinessShortCode: shortcode, Password: mpesaPassword(timestamp), Timestamp: timestamp, TransactionType: 'CustomerPayBillOnline', Amount: amount, PartyA: phone, PartyB: shortcode, PhoneNumber: phone, CallBackURL: callbackUrl, AccountReference: 'SecretNairobiVIP', TransactionDesc: req.body?.description || 'Secret Nairobi VIP visibility' };
  try {
    const accessToken = await getAccessToken();
    const response = await axios.post(MPESA_BASE + '/mpesa/stkpush/v1/processrequest', payload, { headers: { Authorization: 'Bearer ' + accessToken } });
    const provider = response.data || {};
    const reference = provider.CheckoutRequestID || provider.MerchantRequestID || 'SNMPESA-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const inserted = await queryWithRetry("insert into utamu_payments (model_id, user_id, amount_kes, method, status, reference, provider_reference, purpose) values ($1,$2,$3,'mpesa','pending',$4,$5,$6) returning *", [model?.id || null, user?.id || null, amount, reference, provider.MerchantRequestID || null, req.body?.purpose || 'vip_visibility']);
    res.status(201).json({ data: publicPayment(inserted.rows[0], { status: 'stk_sent', method: 'mpesa', instructions: 'STK push sent. Enter your PIN on your phone and keep this page open.' }) });
  } catch (error) {
    console.error('[utamu:mpesa] stk_failed', error?.response?.data || error?.message || error);
    res.status(502).json({ message: 'M-Pesa STK push could not be started.' });
  }
}
export async function applyUtamuMpesaCallback(body) {
  await ensureUtamuMonetizationSchema();
  const callback = body?.Body?.stkCallback || {};
  const details = mpesaCallbackDetails(callback);
  const checkoutReference = details.checkoutRequestId;
  const merchantReference = details.merchantRequestId;
  const lookupReference = checkoutReference || merchantReference;
  const paid = Number(details.resultCode) === 0;
  if (!lookupReference) return { handled: false, paid, details, payment: null };
  const status = paid ? 'paid' : 'failed';
  const metadataPatch = JSON.stringify({ mpesa: details });
  const updated = await queryWithRetry(
    `update utamu_payments
     set status = $3,
         paid_at = case when $3 = 'paid' then coalesce(paid_at, now()) else paid_at end,
         provider_reference = coalesce(provider_reference, $2),
         metadata = coalesce(metadata, '{}'::jsonb) || $4::jsonb
     where reference = $1 or provider_reference = $1 or ($2::text is not null and (reference = $2::text or provider_reference = $2::text))
     returning *`,
    [checkoutReference, merchantReference, status, metadataPatch]
  );
  const payment = updated.rows[0] || null;
  if (!payment) {
    console.warn('[utamu:mpesa] callback_unmatched_payment', details);
    return { handled: false, paid, details, payment: null };
  }
  if (paid) await activatePaidEntitlement(payment.reference);
  console.log('[utamu:mpesa] callback_processed', { paymentId: payment.id, reference: payment.reference, purpose: payment.purpose, paid });
  return { handled: true, paid, details, payment };
}

export async function mpesaPaymentCallback(req, res) {
  await applyUtamuMpesaCallback(req.body);
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
export async function createPaystackPayment(req, res) {
  await ensureUtamuTransactionalSchema();
  if (!PAYSTACK_SECRET_KEY) return res.status(503).json({ message: 'Paystack is not configured. Set PAYSTACK_SECRET_KEY.' });
  const user = await authUser(req);
  const email = String(req.body?.email || user?.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ message: 'Email address is required for Paystack checkout.' });
  const amount = Math.max(1, Math.round(Number(req.body?.amount || VIP_VISIBILITY_PRICE_KES)));
  const model = await resolvePaymentModel(req.body || {}, user);
  const reference = 'SNPAY-' + crypto.randomBytes(8).toString('hex').toUpperCase();
  try {
    const response = await axios.post('https://api.paystack.co/transaction/initialize', { email, amount: amount * 100, currency: 'KES', reference, callback_url: APP_URL + '/paystack/callback', metadata: { purpose: req.body?.purpose || 'vip_visibility', modelId: model?.id || null } }, { headers: { Authorization: 'Bearer ' + PAYSTACK_SECRET_KEY, 'Content-Type': 'application/json' } });
    const data = response.data?.data || {};
    const inserted = await queryWithRetry("insert into utamu_payments (model_id, user_id, amount_kes, method, status, reference, provider_reference, authorization_url, purpose) values ($1,$2,$3,'paystack','pending',$4,$5,$6,$7) returning *", [model?.id || null, user?.id || null, amount, reference, data.reference || reference, data.authorization_url || null, req.body?.purpose || 'vip_visibility']);
    res.status(201).json({ data: publicPayment(inserted.rows[0], { method: 'paystack', authorizationUrl: data.authorization_url }) });
  } catch (error) {
    console.error('[utamu:paystack] initialize_failed', error?.response?.data || error?.message || error);
    res.status(502).json({ message: 'Paystack checkout could not be started.' });
  }
}
export async function verifyPaystackPayment(req, res) {
  await ensureUtamuTransactionalSchema();
  if (!PAYSTACK_SECRET_KEY) return res.status(503).json({ message: 'Paystack is not configured. Set PAYSTACK_SECRET_KEY.' });
  const reference = String(req.body?.reference || req.query?.reference || '').trim();
  if (!reference) return res.status(400).json({ message: 'Payment reference is required.' });
  try {
    const response = await axios.get('https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference), { headers: { Authorization: 'Bearer ' + PAYSTACK_SECRET_KEY } });
    const status = response.data?.data?.status === 'success' ? 'paid' : 'pending';
    const updated = await queryWithRetry('update utamu_payments set status = $2, paid_at = case when $2 = $3 then now() else paid_at end where reference = $1 or provider_reference = $1 returning *', [reference, status, 'paid']);
    if (status === 'paid') await activatePaidEntitlement(reference);
    res.json({ data: publicPayment(updated.rows[0], { reference, status, method: 'paystack' }) });
  } catch (error) {
    console.error('[utamu:paystack] verify_failed', error?.response?.data || error?.message || error);
    res.status(502).json({ message: 'Paystack payment could not be verified.' });
  }
}
export async function submitVerification(req, res) {
  res.status(201).json({ data: { id: 'v-' + Date.now(), status: 'pending', submittedAt: new Date().toISOString(), ...req.body } });
}

async function getReviewRows() {
  try {
    await ensureUtamuTransactionalSchema();
    const rows = await tryQuery("select r.*, m.display_name, coalesce(pi.url, r.model_image) as image_url, u.full_name from utamu_reviews r left join utamu_models m on m.id = r.model_id left join lateral (select url from utamu_profile_images where model_id = m.id order by sort_order, created_at limit 1) pi on true left join utamu_users u on u.id = r.user_id where r.status in ('approved','pending') order by r.created_at desc limit 100");
    return (rows || []).map(mapReviewRow);
  } catch (error) {
    console.warn('[utamu:reviews] list_failed', error?.message || error);
    return [];
  }
}
export async function getReviews(_req, res) {
  const rows = await getReviewRows();
  res.json({ data: rows });
}

export async function submitReview(req, res) {
  await ensureUtamuTransactionalSchema();
  const user = await authUser(req);
  const rating = Math.max(1, Math.min(5, Number(req.body?.rating || 5)));
  const body = String(req.body?.body || '').trim();
  if (!body) return res.status(400).json({ message: 'Review text is required.' });
  const model = await resolvePaymentModel({ modelId: req.body?.modelId, modelSlug: req.body?.modelSlug }, null);
  const modelName = req.body?.modelName || model?.display_name || 'Secret Nairobi escort';
  const modelImage = req.body?.modelImage || '';
  const authorName = req.body?.author || user?.full_name || 'Normal user';
  const inserted = await queryWithRetry("insert into utamu_reviews (model_id, user_id, rating, body, anonymous, status, model_name, model_image, author_name) values ($1,$2,$3,$4,$5,'approved',$6,$7,$8) returning *", [model?.id || null, user?.id || null, rating, body, Boolean(req.body?.anonymous), modelName, modelImage, authorName]);
  res.status(201).json({ data: mapReviewRow(inserted.rows[0]) });
}



export async function getMonetizationOverview(req, res) {
  await ensureUtamuMonetizationSchema();
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const model = await modelForUser(user);
  const wallet = await walletFor(user.id);
  const subscriptions = model?.id ? await tryQuery('select * from utamu_listing_subscriptions where model_id = $1 order by created_at desc limit 20', [model.id]) : [];
  const assistant = await tryQuery('select * from utamu_ai_assistants where user_id = $1 limit 1', [user.id]);
  const portal = await tryQuery("select * from utamu_client_portal_subscriptions where user_id = $1 and status = 'active' and (expires_at is null or expires_at > now()) order by created_at desc limit 1", [user.id]);
  const leads = await tryQuery('select * from utamu_booking_leads where provider_user_id = $1 or client_user_id = $1 order by created_at desc limit 50', [user.id]);
  const transactions = await tryQuery('select * from utamu_wallet_transactions where user_id = $1 order by created_at desc limit 20', [user.id]);
  const payments = await tryQuery('select * from utamu_payments where user_id = $1 order by created_at desc limit 20', [user.id]);
  res.json({ data: { products: MONETIZATION_PRODUCTS, messageTokenCost: MESSAGE_TOKEN_COST, tipCommissionRate: TIP_COMMISSION_RATE, wallet, model, subscriptions: subscriptions || [], assistant: assistant?.[0] || null, clientPortal: portal?.[0] || null, leads: leads || [], transactions: transactions || [], payments: payments || [] } });
}

export async function createMonetizationCheckout(req, res) {
  await ensureUtamuMonetizationSchema();
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const product = productById(req.body?.productId);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  const method = String(req.body?.method || 'mpesa').toLowerCase();
  const model = await resolvePaymentModel(req.body || {}, user);
  const metadata = { productId: product.id, purpose: product.category, modelId: model?.id || null, modelSlug: model?.slug || req.body?.modelSlug || null, tokenAmount: product.tokenAmount };
  const referencePrefix = method === 'paystack' ? 'SNPAY-' : 'SNMPESA-';
  if (method === 'paystack') {
    if (!PAYSTACK_SECRET_KEY) return res.status(503).json({ message: 'Paystack is not configured. Set PAYSTACK_SECRET_KEY.' });
    const email = String(req.body?.email || user.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email address is required for Paystack checkout.' });
    const reference = referencePrefix + crypto.randomBytes(8).toString('hex').toUpperCase();
    const response = await axios.post('https://api.paystack.co/transaction/initialize', { email, amount: product.amountKes * 100, currency: 'KES', reference, callback_url: APP_URL + '/paystack/callback', metadata }, { headers: { Authorization: 'Bearer ' + PAYSTACK_SECRET_KEY, 'Content-Type': 'application/json' } });
    const data = response.data?.data || {};
    const inserted = await queryWithRetry("insert into utamu_payments (model_id, user_id, amount_kes, method, status, reference, provider_reference, authorization_url, purpose, metadata) values ($1,$2,$3,'paystack','pending',$4,$5,$6,$7,$8) returning *", [model?.id || null, user.id, product.amountKes, reference, data.reference || reference, data.authorization_url || null, product.category, metadata]);
    return res.status(201).json({ data: { ...publicPayment(inserted.rows[0], { method: 'paystack', authorizationUrl: data.authorization_url }), product } });
  }
  const phone = normalizeKenyanMsisdn(req.body?.phone || user.phone);
  if (!/^254(7|1)\d{8}$/.test(phone)) return res.status(400).json({ message: 'Enter a valid Kenyan M-Pesa phone number.' });
  const callbackUrl = resolveStkCallbackUrl({ product: 'Utamu' });
  const health = getMpesaConfigHealth();
  const missing = [...health.missing, !callbackUrl ? 'MPESA_Utamu_CALLBACK_URL' : null].filter(Boolean);
  if (missing.length) return res.status(503).json({ message: 'M-Pesa is not fully configured.', missing });
  const timestamp = mpesaTimestamp();
  const payload = { BusinessShortCode: shortcode, Password: mpesaPassword(timestamp), Timestamp: timestamp, TransactionType: 'CustomerPayBillOnline', Amount: product.amountKes, PartyA: phone, PartyB: shortcode, PhoneNumber: phone, CallBackURL: callbackUrl, AccountReference: 'SecretNairobi', TransactionDesc: paymentDescriptionFor(product) };
  const accessToken = await getAccessToken();
  const response = await axios.post(MPESA_BASE + '/mpesa/stkpush/v1/processrequest', payload, { headers: { Authorization: 'Bearer ' + accessToken } });
  const provider = response.data || {};
  const reference = provider.CheckoutRequestID || provider.MerchantRequestID || referencePrefix + crypto.randomBytes(6).toString('hex').toUpperCase();
  const inserted = await queryWithRetry("insert into utamu_payments (model_id, user_id, amount_kes, method, status, reference, provider_reference, purpose, metadata) values ($1,$2,$3,'mpesa','pending',$4,$5,$6,$7) returning *", [model?.id || null, user.id, product.amountKes, reference, provider.MerchantRequestID || null, product.category, metadata]);
  res.status(201).json({ data: { ...publicPayment(inserted.rows[0], { status: 'stk_sent', method: 'mpesa', instructions: 'STK push sent. Enter your PIN to activate ' + product.name + '.' }), product } });
}

export async function configureAiAssistant(req, res) {
  await ensureUtamuMonetizationSchema();
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const model = await modelForUser(user);
  if (!model) return res.status(400).json({ message: 'Create a profile before enabling the AI assistant.' });
  const existingRows = await tryQuery('select * from utamu_ai_assistants where user_id = $1 limit 1', [user.id]);
  const existing = existingRows?.[0] || null;
  const enabled = Boolean(req.body?.enabled);
  if (enabled && !isAssistantEntitlementActive(existing)) {
    return res.status(402).json({ message: 'Activate the AI assistant monthly add-on before enabling automatic replies.', product: productById('ai-assistant-monthly') });
  }
  const row = await queryWithRetry(
    `insert into utamu_ai_assistants (user_id, model_id, enabled, plan, monthly_price_kes, tone, instructions, auto_reply_enabled, expires_at, payment_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (user_id) do update set model_id = excluded.model_id, enabled = excluded.enabled, plan = excluded.plan, monthly_price_kes = excluded.monthly_price_kes, tone = excluded.tone, instructions = excluded.instructions, auto_reply_enabled = excluded.auto_reply_enabled, expires_at = excluded.expires_at, payment_id = excluded.payment_id, updated_at = now()
     returning *`,
    [user.id, model.id, enabled, existing?.plan || 'off', existing?.monthly_price_kes || 0, req.body?.tone || existing?.tone || 'polite', req.body?.instructions || null, req.body?.autoReplyEnabled !== false, existing?.expires_at || null, existing?.payment_id || null]
  );
  res.json({ data: { ...row.rows[0], activeEntitlement: isAssistantEntitlementActive(row.rows[0]) } });
}

export async function sendTip(req, res) {
  await ensureUtamuMonetizationSchema();
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const amount = Math.max(1, Math.round(Number(req.body?.amountTokens || 0)));
  const model = await resolvePaymentModel(req.body || {}, null);
  if (!model?.user_id) return res.status(404).json({ message: 'Profile not found.' });
  const wallet = await debitWallet(user.id, amount, `Tip to ${model.display_name}`, model.user_id, model.id, 'tip');
  if (!wallet) return res.status(402).json({ message: 'Buy tokens before sending a tip.' });
  const commission = Math.floor(amount * TIP_COMMISSION_RATE);
  const net = amount - commission;
  await creditWallet(model.user_id, net, `Tip received from ${user.full_name}`, null, user.id, model.id, 'tip_received');
  const inserted = await queryWithRetry('insert into utamu_tips (sender_user_id, recipient_user_id, model_id, amount_tokens, commission_tokens, message) values ($1,$2,$3,$4,$5,$6) returning *', [user.id, model.user_id, model.id, amount, commission, req.body?.message || null]);
  res.status(201).json({ data: { tip: inserted.rows[0], wallet } });
}

export async function createBookingLead(req, res) {
  await ensureUtamuMonetizationSchema();
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const message = String(req.body?.message || '').trim();
  if (!message) return res.status(400).json({ message: 'Booking details are required.' });
  const model = await resolvePaymentModel(req.body || {}, null);
  if (!model) return res.status(404).json({ message: 'Profile not found.' });
  const tier = model.listing_tier || 'free';
  const leadFee = tier === 'free' ? 0 : tier === 'bronze' ? 100 : tier === 'silver' ? 200 : tier === 'gold' ? 350 : 500;
  const inserted = await queryWithRetry('insert into utamu_booking_leads (client_user_id, provider_user_id, model_id, model_slug, model_name, requested_date, location, budget_kes, message, lead_fee_kes) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *', [user.id, model.user_id || null, model.id, model.slug, model.display_name, req.body?.requestedDate || null, req.body?.location || null, req.body?.budgetKes ? Number(req.body.budgetKes) : null, message, leadFee]);
  res.status(201).json({ data: inserted.rows[0] });
}

export async function getClientPortal(req, res) {
  await ensureUtamuMonetizationSchema();
  const user = await authUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const portal = await tryQuery("select * from utamu_client_portal_subscriptions where user_id = $1 and status = 'active' and (expires_at is null or expires_at > now()) order by created_at desc limit 1", [user.id]);
  if (!portal?.[0]) return res.status(402).json({ message: 'Upgrade to the vetted client portal to access this section.', products: MONETIZATION_PRODUCTS.filter((item) => item.category === 'client_portal') });
  const rows = await tryQuery("select m.*, coalesce(pi.url, '') as image_url from utamu_models m left join lateral (select url from utamu_profile_images where model_id = m.id order by sort_order, created_at limit 1) pi on true where (m.verified = true or m.trusted_badge = true or m.elite = true) and m.status <> 'deleted' order by m.trusted_badge desc, m.elite desc, m.rating desc limit 50");
  res.json({ data: { subscription: portal[0], profiles: (rows || []).map((row) => ({ ...row, image_url: normalizeProfileImageUrl(row.image_url) })) } });
}

export async function getAdmin(_req, res) {
  res.json({ data: { verificationCases: [], analytics, pending: [] } });
}
