export const API_BASE_URL = 'https://ubuntu-ideapad-3-15iil05.tail50cad3.ts.net';

const TOKEN_KEY = 'sut_auth_token';
const USER_KEY = 'sut_auth_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
export function setStoredUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && auth && unauthorizedHandler) unauthorizedHandler();
    throw new Error(data.error || `Sunucu hatasi (${res.status})`);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  changePassword: (current_password, new_password) =>
    request('/auth/password', { method: 'PATCH', body: { current_password, new_password } }),
  getProducerContact: () => request('/auth/producer-contact', { auth: false }),
  getCustomers: () => request('/auth/customers'),
  resetCustomerPassword: (user_id, new_password) =>
    request('/auth/reset-password', { method: 'PATCH', body: { user_id, new_password } }),
  getVapidPublicKey: () => request('/auth/vapid-public-key', { auth: false }),
  saveWebPushSubscription: (subscription) =>
    request('/auth/web-push-subscribe', { method: 'POST', body: { subscription } }),

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
