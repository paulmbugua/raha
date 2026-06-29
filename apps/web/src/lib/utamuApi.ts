import { analytics, bookings, models, reviews, verificationCases } from '../data/utamu';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');

async function getJson<T>(path: string, fallback: T): Promise<T> {
  if (!API_BASE) return fallback;
  try {
    const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) return fallback;
    const payload = await response.json();
    return (payload.data ?? payload) as T;
  } catch {
    return fallback;
  }
}

async function postJson<T>(path: string, body: unknown, fallback: T): Promise<T> {
  if (!API_BASE) return fallback;
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) return fallback;
    const payload = await response.json();
    return (payload.data ?? payload) as T;
  } catch {
    return fallback;
  }
}

export const utamuApi = {
  getDirectory: () => getJson('/api/utamu/directory', { models, bookings, reviews, verificationCases, analytics }),
  getModels: (query = '') => getJson(`/api/utamu/models?query=${encodeURIComponent(query)}`, models),
  getModel: (slug: string) => getJson(`/api/utamu/models/${slug}`, models.find((model) => model.slug === slug) ?? models[0]),
  submitVerification: (body: unknown) => postJson('/api/utamu/verification', body, { id: 'v-local', status: 'pending' }),
  submitReview: (body: unknown) => postJson('/api/utamu/reviews', body, { id: 'r-local', status: 'pending' }),
  createMpesaPayment: (body: unknown) => postJson('/api/utamu/payments/mpesa', body, { reference: 'UTAMU-LOCAL', status: 'stk_sent' }),
};
