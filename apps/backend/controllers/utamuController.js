import { queryWithRetry } from '../config/db.js';
import { analytics, bookings, models, reviews, verificationCases } from '../data/utamuSeed.js';

const directory = { models, bookings, reviews, verificationCases, analytics };

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

export async function getDirectory(_req, res) {
  const rows = await tryQuery('select payload from utamu_seed where key = $1', ['directory']);
  res.json({ data: rows?.[0]?.payload || directory });
}

export async function searchModels(req, res) {
  const query = String(req.query.query || '').toLowerCase();
  const data = models
    .filter((model) => !query || [model.name, model.city, model.county, model.category, model.specialties.join(' ')].join(' ').toLowerCase().includes(query))
    .map((model) => ({ ...model, rankingScore: scoreModel(model) }))
    .sort((a, b) => b.rankingScore - a.rankingScore);
  res.json({ data });
}

export async function getModel(req, res) {
  const model = models.find((item) => item.slug === req.params.slug) || models[0];
  res.json({ data: { ...model, rankingScore: scoreModel(model) } });
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
