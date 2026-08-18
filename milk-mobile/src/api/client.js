import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = 'https://ubuntu-ideapad-3-15iil05.tail50cad3.ts.net';

const TOKEN_KEY = 'sut_auth_token';
const USER_KEY = 'sut_auth_user';

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token) {
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export async function getStoredUser() {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function setStoredUser(user) {
  if (user) {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } else {
    await SecureStore.deleteItemAsync(USER_KEY);
  }
}

let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && auth && unauthorizedHandler) {
      unauthorizedHandler();
    }
    throw new Error(data.error || `Sunucu hatasi (${res.status})`);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  saveFcmToken: (fcm_token) => request('/auth/fcm-token', { method: 'POST', body: { fcm_token } }),
  changePassword: (current_password, new_password) =>
    request('/auth/password', { method: 'PATCH', body: { current_password, new_password } }),
  getProducerContact: () => request('/auth/producer-contact', { auth: false }),
  getCustomers: () => request('/auth/customers'),
  resetCustomerPassword: (user_id, new_password) =>
    request('/auth/reset-password', { method: 'PATCH', body: { user_id, new_password } }),

  createOrUpdateOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
  getOrders: (date, session) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (session) params.set('session', session);
    const qs = params.toString();
    return request(`/orders${qs ? `?${qs}` : ''}`);
  },
  getOrderSummary: (date, session) => {
    const params = new URLSearchParams({ date });
    if (session) params.set('session', session);
    return request(`/orders/summary?${params.toString()}`);
  },
  updateOrder: (id, quantity_lt) => request(`/orders/${id}`, { method: 'PATCH', body: { quantity_lt } }),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: 'PATCH' }),
  confirmOrder: (id) => request(`/orders/${id}/confirm`, { method: 'PATCH' }),
  completeOrder: (id) => request(`/orders/${id}/complete`, { method: 'PATCH' }),

  createSubscription: (payload) => request('/subscriptions', { method: 'POST', body: payload }),
  getSubscriptions: () => request('/subscriptions'),
  deactivateSubscription: (id) => request(`/subscriptions/${id}/deactivate`, { method: 'PATCH' }),

  getSettings: () => request('/settings'),
  updateSettings: (payload) => request('/settings', { method: 'PUT', body: payload }),

  getProducerReport: (days) => request(`/reports/producer-summary?days=${days}`),
  getCustomerSuggestion: () => request('/reports/customer-suggestion'),
};
