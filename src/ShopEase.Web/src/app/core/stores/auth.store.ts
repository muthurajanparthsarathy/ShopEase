import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { RegisterInput, Result, RoleId, SessionUser } from '../models';

/** Canonical, app-wide auth state — read by guards, navbar, and every feature that needs "who's logged in". */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private auth = inject(AuthService);

  readonly currentUser = signal<SessionUser | null>(this.auth.getCurrentUser());
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.roleId === RoleId.Admin);
  readonly isCustomer = computed(() => this.currentUser()?.roleId === RoleId.Customer);

  login(email: string, password: string): Observable<Result<SessionUser>> {
    return this.auth.login(email, password).pipe(tap((r) => { if (r.success && r.data) this.currentUser.set(r.data); }));
  }

  register(input: RegisterInput): Observable<Result<SessionUser>> {
    return this.auth.register(input).pipe(tap((r) => { if (r.success && r.data) this.currentUser.set(r.data); }));
  }

  logout(): void {
    this.auth.logout();
    this.currentUser.set(null);
  }

  updateName(name: string): void {
    const user = this.currentUser();
    if (user) this.currentUser.set({ ...user, name });
  }
}
