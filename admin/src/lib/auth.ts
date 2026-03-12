import { setAuthToken, clearAuthToken, getAuthToken } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Token lives in memory only (XSS-safe). Lost on tab close — user must re-login.
// User display info (name, role) is non-sensitive and stays in localStorage.
export function getToken(): string | null {
  return getAuthToken();
}

export function setToken(token: string): void {
  setAuthToken(token);
}

export function removeToken(): void {
  clearAuthToken();
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function setUser(user: AuthUser): void {
  localStorage.setItem('user', JSON.stringify(user));
}

export function logout(): void {
  removeToken();
  localStorage.removeItem('user');
  window.location.href = '/login';
}
