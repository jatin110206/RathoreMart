import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import { BASE, STORAGE_KEY } from '../services/config';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; needsOTP?: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; needsOTP?: boolean; error?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Safely POST and parse response */
const post = async (path: string, body: object) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any = {};
  if (text) {
    try { data = JSON.parse(text); }
    catch { throw new Error(`Server error (${res.status})`); }
  }
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
};

const buildUserData = (data: any) => ({
  id:        data._id,
  name:      data.name,
  email:     data.email,
  role:      data.role as 'user' | 'admin',
  addresses: [],
  token:     data.token,
});

const saveToStorage = (data: any) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

/** True only if token is a real JWT (starts with eyJ) */
const isRealToken = (token: string | undefined) =>
  typeof token === 'string' && token.startsWith('eyJ');

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      const p = JSON.parse(saved);
      // Clear stale "mock" tokens — they won't authenticate against the backend
      if (!isRealToken(p.token)) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      const { token: _t, ...rest } = p;
      return rest as User;
    } catch { return null; }
  });

  const applyUser = (data: any) => {
    const userData = buildUserData(data);
    saveToStorage(userData);
    const { token: _t, ...userOnly } = userData;
    setUser(userOnly as User);
  };

  // ── LOGIN ────────────────────────────────────────────────────────────────────
  // Backend returns 403 with 'verified' in message when user hasn't verified OTP
  const login = async (email: string, password: string) => {
    try {
      const data = await post('/auth/login', { email, password });
      if (data.needsOTP) {
        return { success: true, needsOTP: true };
      }
      applyUser(data);
      return { success: true };
    } catch (err: any) {
      // If backend says email not verified, redirect to OTP screen
      if (err.message?.toLowerCase().includes('verif')) {
        return { success: false, needsOTP: true, error: err.message };
      }
      return { success: false, error: err.message };
    }
  };

  // ── REGISTER ─────────────────────────────────────────────────────────────────
  const register = async (name: string, email: string, password: string) => {
    try {
      const data = await post('/auth/register', { name, email, password });
      // Backend returns { needsOTP: true, email } — no token yet
      if (data.needsOTP) {
        return { success: true, needsOTP: true };
      }
      // Fallback: if backend auto-verified, log in immediately
      applyUser(data);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // ── VERIFY OTP ───────────────────────────────────────────────────────────────
  const verifyOTP = async (email: string, otp: string) => {
    try {
      const data = await post('/auth/verify-otp', { email, otp });
      applyUser(data);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
