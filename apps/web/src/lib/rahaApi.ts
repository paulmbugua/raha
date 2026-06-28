import { bookings, providers, reviews, subscriptionPlans } from '../data/raha';

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

export const rahaApi = {
  getMarketplace: () =>
    getJson('/api/raha/marketplace', {
      providers,
      bookings,
      reviews,
      subscriptionPlans,
    }),
  searchProviders: (query = '') =>
    getJson(`/api/raha/providers?query=${encodeURIComponent(query)}`, providers),
  getProvider: (slug: string) =>
    getJson(`/api/raha/providers/${slug}`, providers.find((provider) => provider.slug === slug) ?? providers[0]),
  getBookings: () => getJson('/api/raha/bookings', bookings),
  getAdmin: () => getJson('/api/raha/admin', null),
};
