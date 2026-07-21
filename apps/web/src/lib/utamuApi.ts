import { analytics } from '../data/utamu';
import { logResolvedBackendUrl, resolveBackendUrl } from './backendUrl';

const API_BASE = resolveBackendUrl(process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL);

logResolvedBackendUrl('utamu-api', API_BASE);

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }
  return (payload.data ?? payload) as T;
}

async function getJson<T>(path: string, fallback: T): Promise<T> {
  if (!API_BASE) return fallback;
  try {
    const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    return await parseResponse<T>(response);
  } catch {
    return fallback;
  }
}

async function postJson<T>(path: string, body: unknown, fallback: T, token?: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return await parseResponse<T>(response);
}

async function putJson<T>(path: string, body: unknown, fallback: T, token?: string): Promise<T> {
  if (!API_BASE || !token) return fallback;
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return await parseResponse<T>(response);
}

async function uploadFiles<T>(path: string, files: File[], fallback: T, token?: string): Promise<T> {
  if (!API_BASE || !token) return fallback;
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: formData,
  });
  return await parseResponse<T>(response);
}

async function deleteJson<T>(path: string, fallback: T, token?: string): Promise<T> {
  if (!API_BASE || !token) return fallback;
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  return await parseResponse<T>(response);
}

async function getJsonAuth<T>(path: string, token: string | undefined, fallback: T): Promise<T> {
  if (!API_BASE || !token) return fallback;
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return await parseResponse<T>(response);
  } catch {
    return fallback;
  }
}

export const utamuApi = {
  getDirectory: () => getJson('/api/utamu/directory', { models: [], bookings: [], reviews: [], verificationCases: [], analytics }),
  getModels: (query = '') => getJson(`/api/utamu/models?query=${encodeURIComponent(query)}`, []),
  getModel: (slug: string) => getJson(`/api/utamu/models/${slug}`, null),
  getReviews: () => getJson('/api/utamu/reviews', []),
  registerAccount: (body: unknown) => postJson('/api/utamu/register', body, { registrationComplete: true, validationToken: 'local-token', confirmationUrl: '/register/confirm-email?token=local-token' }),
  confirmEmail: (token: string) => postJson('/api/utamu/confirm-email', { token }, { token: 'local-session-token', user: null }),
  resendValidation: (email: string) => postJson('/api/utamu/resend-validation', { email }, { sent: true }),
  loginAccount: (body: unknown) => postJson('/api/utamu/login', body, { token: '', user: null }),
  getMe: (token?: string) => getJsonAuth('/api/utamu/me', token, { user: null, model: null, images: [], unreadMessages: 0 }),
  updateProfile: (body: unknown, token?: string) => putJson('/api/utamu/account/profile', body, { user: null, model: null }, token),
  addProfileImage: (body: unknown, token?: string) => postJson('/api/utamu/account/images', body, { id: 'local-image', ...(body as object) }, token),
  uploadProfileImages: (files: File[], token?: string) => uploadFiles('/api/utamu/account/images/upload', files, [], token),
  deleteProfileImage: (id: string, token?: string) => deleteJson(`/api/utamu/account/images/${encodeURIComponent(id)}`, { deleted: true, id }, token),
  changePassword: (body: unknown, token?: string) => postJson('/api/utamu/account/change-password', body, { changed: true }, token),
  getMessages: (token?: string) => getJsonAuth('/api/utamu/messages', token, []),
  sendMessage: (body: unknown, token?: string) => postJson('/api/utamu/messages', body, { id: 'local-message', sent: true }, token),
  getNotifications: (token?: string) => getJsonAuth('/api/utamu/notifications', token, { unreadMessages: 0 }),
  submitVerification: (body: unknown) => postJson('/api/utamu/verification', body, { id: 'v-local', status: 'pending' }),
  submitReview: (body: unknown) => postJson('/api/utamu/reviews', body, { id: 'r-local', status: 'pending' }),
  createMpesaPayment: (body: unknown) => postJson('/api/utamu/payments/mpesa', body, { reference: 'UTAMU-LOCAL', status: 'stk_sent' }),
  createPaystackPayment: (body: unknown) => postJson('/api/utamu/payments/paystack', body, { reference: 'UTAMU-LOCAL', authorizationUrl: '' }),
  verifyPaystackPayment: (reference: string) => postJson('/api/utamu/payments/paystack/verify', { reference }, { reference, status: 'pending' }),
  getMonetization: (token?: string) => getJsonAuth('/api/utamu/monetization', token, { products: [], wallet: null, subscriptions: [], assistant: null, clientPortal: null, leads: [], transactions: [], payments: [], messageTokenCost: 5, tipCommissionRate: 0.15 }),
  createMonetizationCheckout: (body: unknown, token?: string) => postJson('/api/utamu/monetization/checkout', body, { reference: 'SN-LOCAL', status: 'pending' }, token),
  configureAiAssistant: (body: unknown, token?: string) => postJson('/api/utamu/ai-assistant', body, { enabled: false }, token),
  sendTip: (body: unknown, token?: string) => postJson('/api/utamu/tips', body, { sent: true }, token),
  createBookingLead: (body: unknown, token?: string) => postJson('/api/utamu/booking-leads', body, { id: 'lead-local', status: 'new' }, token),
  getClientPortal: (token?: string) => getJsonAuth('/api/utamu/client-portal', token, { subscription: null, profiles: [] }),
};
