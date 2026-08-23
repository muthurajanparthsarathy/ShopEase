import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionStore } from './session-store.service';
import { toResult, toVoidResult } from '../utils/http-result.utils';
import { Address, AddressInput, RegisterInput, Result, RoleId, SessionUser, User } from '../models';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private session = inject(SessionStore);

  login(email: string, password: string): Observable<Result<SessionUser>> {
    return toResult(
      this.http.post<AuthResponse>(`${BASE}/auth/login`, { email, password }).pipe(
        tap((res) => this.session.setSession(res.accessToken, res.refreshToken, res.user)),
        map((res) => res.user),
      ),
      'Welcome back!',
    );
  }

  register(input: RegisterInput): Observable<Result<SessionUser>> {
    return toResult(
      this.http.post<AuthResponse>(`${BASE}/auth/register`, input).pipe(
        tap((res) => this.session.setSession(res.accessToken, res.refreshToken, res.user)),
        map((res) => res.user),
      ),
      'Account created!',
    );
  }

  logout(): void {
    const refreshToken = this.session.getRefreshToken();
    this.session.clear();
    if (refreshToken) this.http.post(`${BASE}/auth/logout`, { refreshToken }).subscribe({ error: () => void 0 });
  }

  /** Revokes every session for the current user (all devices/tabs), not just this one. */
  logoutAllDevices(): Observable<Result> {
    return toVoidResult(this.http.post(`${BASE}/auth/logout-all`, {}), 'Logged out of all devices.');
  }

  getCurrentUser(): SessionUser | null {
    return this.session.getUser();
  }

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.roleId === RoleId.Admin;
  }

  /**
   * Non-admins may only call /users/me (self); every non-admin call site in this app passes the
   * logged-in user's own id anyway (checkout, profile, orders). Admins viewing another customer's
   * record (admin/customers) go through /users/{id}, which now embeds addresses directly.
   */
  getUserById(id: number): Observable<User | null> {
    const current = this.getCurrentUser();
    const isSelf = current !== null && current.id === id;
    const path = isSelf ? `${BASE}/users/me` : `${BASE}/users/${id}`;

    return this.http.get<Omit<User, 'password'>>(path).pipe(map((user) => (user ? { ...user, password: '' } : null)));
  }

  getAllCustomers(): Observable<User[]> {
    return this.http.get<User[]>(`${BASE}/users`).pipe(map((all) => all.filter((u) => u.roleId === RoleId.Customer)));
  }

  updateProfile(userId: number, patch: { name: string; phone: string }): Observable<Result> {
    return toVoidResult(this.http.put(`${BASE}/users/me`, patch), 'Profile updated successfully.').pipe(
      tap((r) => {
        if (!r.success) return;
        const current = this.getCurrentUser();
        if (current && current.id === userId) this.session.setUser({ ...current, name: patch.name });
      }),
    );
  }

  toggleUserStatus(userId: number): Observable<Result> {
    return toVoidResult(this.http.patch(`${BASE}/users/${userId}/toggle-active`, {}));
  }

  // ── Addresses (own account only — matches the backend's /users/me/addresses scope) ──
  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${BASE}/users/me/addresses`);
  }

  addAddress(_userId: number, address: AddressInput): Observable<Result<Address>> {
    return toResult(this.http.post<Address>(`${BASE}/users/me/addresses`, address), 'Address added successfully.');
  }

  updateAddress(_userId: number, addressId: number, patch: Partial<AddressInput>): Observable<Result> {
    return toVoidResult(this.http.put(`${BASE}/users/me/addresses/${addressId}`, patch), 'Address updated successfully.');
  }

  deleteAddress(_userId: number, addressId: number): Observable<Result> {
    return toVoidResult(this.http.delete(`${BASE}/users/me/addresses/${addressId}`), 'Address deleted successfully.');
  }

  setDefaultAddress(_userId: number, addressId: number): Observable<Result> {
    return toVoidResult(this.http.patch(`${BASE}/users/me/addresses/${addressId}/set-default`, {}), 'Default address updated.');
  }
}
