/**
 * Shared API base URL resolver.
 * Handles both 'https://host.onrender.com' and 'https://host.onrender.com/api'
 * (with or without trailing slash).
 */
export const getApiBase = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  const cleanUrl = envUrl.trim().replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

export const BASE = getApiBase();
export const STORAGE_KEY = 'rathoremart_user';
