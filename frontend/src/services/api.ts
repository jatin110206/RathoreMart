// Handles both 'https://host.onrender.com' and 'https://host.onrender.com/api' (with or without trailing slash)
const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  const cleanUrl = envUrl.trim().replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const BASE = getApiBase();

const STORAGE_KEY = 'rathoremart_user';

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

  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
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
};
