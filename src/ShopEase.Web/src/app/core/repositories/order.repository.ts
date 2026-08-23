import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, OrderStatus } from '../models';

@Injectable()
export abstract class OrderRepository {
  abstract getAll(): Observable<Order[]>;
  abstract getMine(): Observable<Order[]>;
  abstract getById(id: number): Observable<Order | null>;
  abstract getStatuses(): Observable<string[]>;
  abstract place(addressId: number, paymentMethodId: number): Observable<Order>;
  abstract updateStatus(id: number, status: OrderStatus): Observable<{ message: string }>;
  abstract cancel(id: number): Observable<{ message: string }>;
  abstract returnOrder(id: number): Observable<{ message: string }>;
  abstract setCustomFields(id: number, custom: Record<string, unknown>): Observable<{ message: string }>;
}

const BASE = `${environment.apiUrl}/orders`;

@Injectable()
export class HttpOrderRepository extends OrderRepository {
  private http = inject(HttpClient);

  override getAll(): Observable<Order[]> {
    return this.http.get<Order[]>(BASE);
  }

  override getMine(): Observable<Order[]> {
    return this.http.get<Order[]>(`${BASE}/mine`);
  }

  override getById(id: number): Observable<Order | null> {
    return this.http.get<Order>(`${BASE}/${id}`);
  }

  override getStatuses(): Observable<string[]> {
    return this.http.get<string[]>(`${BASE}/statuses`);
  }

  override place(addressId: number, paymentMethodId: number): Observable<Order> {
    return this.http.post<Order>(BASE, { addressId, paymentMethodId });
  }

  override updateStatus(id: number, status: OrderStatus): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${BASE}/${id}/status`, { status });
  }

  override cancel(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${BASE}/${id}/cancel`, {});
  }

  override returnOrder(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${BASE}/${id}/return`, {});
  }

  override setCustomFields(id: number, custom: Record<string, unknown>): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${BASE}/${id}/custom-fields`, { custom });
  }
}
