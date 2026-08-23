import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaymentMethod, Role } from '../models';

/** Read-only seeded lookup tables: roles, order statuses, payment statuses, payment methods. */
@Injectable()
export abstract class LookupRepository {
  abstract getRoles(): Observable<Role[]>;
  abstract getOrderStatuses(): Observable<{ id: number; name: string }[]>;
  abstract getPaymentStatuses(): Observable<{ id: number; name: string }[]>;
  abstract getPaymentMethods(): Observable<PaymentMethod[]>;
}

const BASE = environment.apiUrl;

// Roles and payment statuses are small, fixed sets with no backend admin-CRUD (the original app let
// admins freely add arbitrary status strings via localStorage; this backend treats them as stable
// reference data — a disclosed simplification, see the README's "Known simplifications").
const ROLES: Role[] = [
  { id: 1, name: 'Admin' },
  { id: 2, name: 'Customer' },
];
const PAYMENT_STATUSES = [
  { id: 1, name: 'Pending' },
  { id: 2, name: 'Completed' },
  { id: 3, name: 'Failed' },
  { id: 4, name: 'Refunded' },
];

@Injectable()
export class HttpLookupRepository extends LookupRepository {
  private http = inject(HttpClient);

  override getRoles(): Observable<Role[]> {
    return of(ROLES);
  }

  override getOrderStatuses(): Observable<{ id: number; name: string }[]> {
    return this.http.get<string[]>(`${BASE}/orders/statuses`).pipe(map((names) => names.map((name, i) => ({ id: i + 1, name }))));
  }

  override getPaymentStatuses(): Observable<{ id: number; name: string }[]> {
    return of(PAYMENT_STATUSES);
  }

  override getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${BASE}/payments/methods`);
  }
}
