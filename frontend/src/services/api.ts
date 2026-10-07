import { BASE, STORAGE_KEY } from './config';

/** Read the JWT stored after login */
export const getToken = (): string | null => {
  try {
    const u = localStorage.getItem(STORAGE_KEY);
    if (!u) return null;
    const parsed = JSON.parse(u);
    const token = parsed.token;
    // Only return real JWTs (not mock tokens)
    return typeof token === 'string' && token.startsWith('eyJ') ? token : null;
  } catch { return null; }
};

const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  // If 401 — token is expired/invalid, clear stored user
  if (res.status === 401) {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  // Safely parse response body
  const text = await res.text();
  let data: any = {};
  if (text) {
    try { data = JSON.parse(text); }
    catch { throw new Error(`Server returned invalid response (${res.status})`); }
  }

  if (!res.ok) throw new Error(data.detail || data.message || `Request failed (${res.status})`);
  return data;
};

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login:     (email: string, password: string) =>
    request('POST', '/auth/login',      { email, password }),
  register:  (name: string, email: string, password: string) =>
    request('POST', '/auth/register',   { name, email, password }),
  verifyOTP: (email: string, otp: string) =>
    request('POST', '/auth/verify-otp', { email, otp }),
  resendOTP: (email: string) =>
    request('POST', '/auth/resend-otp', { email }),

  // ── Products ─────────────────────────────────────────────────────────────
  getProducts: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request('GET', `/products${q}`);
  },

  // ── Orders ───────────────────────────────────────────────────────────────
  createOrder: (payload: unknown) => request('POST', '/orders',          payload),
  getMyOrders: ()                 => request('GET',  '/orders/my-orders'),
  getOrder:    (id: string)       => request('GET',  `/orders/${id}`),

  // ── Admin: Analytics ─────────────────────────────────────────────────────
  getDashboardStats:     ()                    => request('GET', '/analytics/dashboard'),
  getRevenueChart:       (months = 6)          => request('GET', `/analytics/revenue-chart?months=${months}`),
  getOrderStatusBreakdown: ()                  => request('GET', '/analytics/order-status'),
  getTopProducts:        (limit = 5)           => request('GET', `/analytics/top-products?limit=${limit}`),
  getTopCategories:      ()                    => request('GET', '/analytics/top-categories'),
  getUserGrowth:         (months = 6)          => request('GET', `/analytics/user-growth?months=${months}`),
  getLowStock:           (threshold = 5)       => request('GET', `/analytics/low-stock?threshold=${threshold}`),
  getRecentOrders:       (limit = 10)          => request('GET', `/analytics/recent-orders?limit=${limit}`),

  // ── Admin: Orders ─────────────────────────────────────────────────────────
  getAllOrders:     (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request('GET', `/orders${q}`);
  },
  updateOrderStatus: (id: string, status: string) =>
    request('PUT', `/orders/${id}/status`, { status }),

  // ── Admin: Products ───────────────────────────────────────────────────────
  deleteProduct: (id: string) => request('DELETE', `/products/${id}`),
};
