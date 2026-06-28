import { queryWithRetry } from '../config/db.js';
import { adminStats, bookings, providers, reviews, subscriptionPlans } from '../data/rahaSeed.js';

const fallback = { providers, bookings, reviews, subscriptionPlans };

function providerScore(provider) {
  const tier = provider.premium ? 20 : 5;
  const badges = Number(provider.verified) * 12 + Number(provider.topRated) * 8 + Number(provider.mostBooked) * 8;
  return Math.round(provider.rating * 10 + provider.reviewCount * 0.12 + tier + badges);
}

async function tryQuery(sql, params = []) {
  try {
    const result = await queryWithRetry(sql, params, { retries: 0 });
    return result.rows;
  } catch {
    return null;
  }
}

export async function getMarketplace(_req, res) {
  const rows = await tryQuery('select payload from raha_marketplace_seed where key = $1', ['marketplace']);
  const data = rows?.[0]?.payload || fallback;
  res.json({ data });
}

export async function searchProviders(req, res) {
  const query = String(req.query.query || '').toLowerCase();
  const rows = await tryQuery('select payload from raha_marketplace_seed where key = $1', ['providers']);
  const source = rows?.[0]?.payload || providers;
  const data = source
    .filter((provider) => !query || [provider.name, provider.location, provider.specialty].join(' ').toLowerCase().includes(query))
    .map((provider) => ({ ...provider, rankingScore: providerScore(provider) }))
    .sort((a, b) => b.rankingScore - a.rankingScore);
  res.json({ data });
}

export async function getProvider(req, res) {
  const provider = providers.find((item) => item.slug === req.params.slug);
  if (!provider) return res.status(404).json({ message: 'Provider not found' });
  res.json({ data: { ...provider, rankingScore: providerScore(provider) } });
}

export async function createBooking(req, res) {
  const reference = `RAHA-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const booking = {
    id: `b-${Date.now()}`,
    providerId: req.body.providerId || 'p-001',
    providerName: req.body.providerName || 'Amani Spa Collective',
    service: req.body.service || 'Signature Deep Tissue',
    date: req.body.date || new Date().toISOString().slice(0, 10),
    time: req.body.time || '2:00 PM',
    status: 'upcoming',
    amount: Number(req.body.amount || 6500),
    reference,
  };
  res.status(201).json({ data: booking, whatsappUnlocked: true, paymentStatus: 'requires_payment' });
}

export async function getBookings(_req, res) {
  res.json({ data: bookings });
}

export async function createReview(req, res) {
  const review = {
    id: `r-${Date.now()}`,
    providerId: req.body.providerId || 'p-001',
    author: req.body.author || 'Anonymous',
    rating: Number(req.body.rating || 5),
    body: req.body.body || '',
    createdAt: new Date().toISOString().slice(0, 10),
    status: 'pending',
  };
  res.status(201).json({ data: review });
}

export async function getAdmin(_req, res) {
  res.json({
    data: {
      stats: adminStats,
      pendingProviders: providers.filter((provider) => provider.verified),
      reportedReviews: reviews.filter((review) => review.status === 'reported'),
      plans: subscriptionPlans,
      rankingFactors: ['Average rating', 'Review count', 'Booking completion', 'Response speed', 'Subscription tier', 'Profile completeness', 'Recent activity'],
    },
  });
}