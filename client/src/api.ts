// Tiny API client. Every call goes through `request`, which:
//   - adds the login token to the Authorization header
//   - turns errors into thrown exceptions with a readable message
//   - logs the user out automatically if the token is rejected (401)
import type { Area, City, Deal, DealInput } from './types';

const TOKEN_KEY = 'pl_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Called when the session is no longer valid, so the app can react.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    onUnauthorized?.();
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(message);
  }

  // Some endpoints (DELETE) may return an empty/ok body.
  return res.json() as Promise<T>;
}

export const api = {
  // --- Auth ---
  login: (password: string) =>
    request<{ token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  // --- Cities ---
  listCities: () => request<City[]>('/cities'),
  createCity: (name: string) =>
    request<City>('/cities', { method: 'POST', body: JSON.stringify({ name }) }),
  updateCity: (id: number, name: string) =>
    request<City>(`/cities/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteCity: (id: number) => request<{ ok: true }>(`/cities/${id}`, { method: 'DELETE' }),

  // --- Areas ---
  listAreas: (cityId: number) => request<Area[]>(`/cities/${cityId}/areas`),
  getArea: (id: number) => request<Area>(`/areas/${id}`),
  createArea: (cityId: number, name: string) =>
    request<Area>(`/cities/${cityId}/areas`, { method: 'POST', body: JSON.stringify({ name }) }),
  updateArea: (id: number, name: string) =>
    request<Area>(`/areas/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteArea: (id: number) => request<{ ok: true }>(`/areas/${id}`, { method: 'DELETE' }),

  // --- Deals ---
  listDeals: (areaId: number, status?: string) =>
    request<Deal[]>(`/areas/${areaId}/deals${status ? `?status=${status}` : ''}`),
  createDeal: (areaId: number, data: DealInput) =>
    request<Deal>(`/areas/${areaId}/deals`, { method: 'POST', body: JSON.stringify(data) }),
  updateDeal: (id: number, data: DealInput) =>
    request<Deal>(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDeal: (id: number) => request<{ ok: true }>(`/deals/${id}`, { method: 'DELETE' }),

  // --- Search ---
  search: (q: string) => request<Deal[]>(`/search?q=${encodeURIComponent(q)}`),
};
