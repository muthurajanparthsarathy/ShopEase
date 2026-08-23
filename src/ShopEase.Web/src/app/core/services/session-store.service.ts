import { Injectable } from '@angular/core';
import { SessionUser } from '../models';

const ACCESS_KEY = 'se_access_token';
const REFRESH_KEY = 'se_refresh_token';
const USER_KEY = 'se_session_user';

/**
 * Owns the JWT access/refresh tokens and the logged-in SessionUser — the one source of truth for
 * "who's logged in and how do we prove it" (replaces the old plain-User sessionStorage pattern).
 * sessionStorage (not localStorage) is intentional: it's per-tab by spec, matching the original app's
 * session model, so two tabs can hold two different logged-in users.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_KEY);
  }

  getUser(): SessionUser | null {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  }

  setSession(accessToken: string, refreshToken: string, user: SessionUser): void {
    sessionStorage.setItem(ACCESS_KEY, accessToken);
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  setTokens(accessToken: string, refreshToken: string): void {
    sessionStorage.setItem(ACCESS_KEY, accessToken);
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
  }

  setUser(user: SessionUser): void {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clear(): void {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}
