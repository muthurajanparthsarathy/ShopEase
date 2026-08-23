import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartItem, CartSummary } from '../models';

/**
 * Raw HTTP calls, unlike most repositories — these can reject (422) with a message the server now
 * computes (stock checks, etc.), so CartService adapts them into Result<T> via toResult() rather than
 * this layer swallowing errors itself.
 */
@Injectable()
export abstract class CartRepository {
  abstract getCart(userId: number): Observable<CartItem[]>;
  abstract getSaved(userId: number): Observable<CartItem[]>;
  abstract getSummary(userId: number): Observable<CartSummary>;
  abstract addItem(userId: number, productId: number, quantity: number): Observable<CartItem[]>;
  abstract updateItem(userId: number, productId: number, quantity: number): Observable<CartItem[]>;
  abstract removeItem(userId: number, productId: number): Observable<CartItem[]>;
  abstract clear(userId: number): Observable<void>;
  abstract saveForLater(userId: number, productId: number): Observable<void>;
  abstract moveToCart(userId: number, productId: number): Observable<void>;
  abstract removeSaved(userId: number, productId: number): Observable<void>;
}

const BASE = `${environment.apiUrl}/cart`;

@Injectable()
export class HttpCartRepository extends CartRepository {
  private http = inject(HttpClient);

  // userId params are server-derived from the JWT — kept for interface parity with existing callers.
  override getCart(_userId: number): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(BASE);
  }

  override getSaved(_userId: number): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(`${BASE}/saved`);
  }

  override getSummary(_userId: number): Observable<CartSummary> {
    return this.http.get<CartSummary>(`${BASE}/summary`);
  }

  override addItem(_userId: number, productId: number, quantity: number): Observable<CartItem[]> {
    return this.http.post<CartItem[]>(`${BASE}/items`, { productId, quantity });
  }

  override updateItem(_userId: number, productId: number, quantity: number): Observable<CartItem[]> {
    return this.http.put<CartItem[]>(`${BASE}/items/${productId}`, { quantity });
  }

  override removeItem(_userId: number, productId: number): Observable<CartItem[]> {
    return this.http.delete<CartItem[]>(`${BASE}/items/${productId}`);
  }

  override clear(_userId: number): Observable<void> {
    return this.http.delete<void>(BASE);
  }

  override saveForLater(_userId: number, productId: number): Observable<void> {
    return this.http.post<void>(`${BASE}/items/${productId}/save-for-later`, {});
  }

  override moveToCart(_userId: number, productId: number): Observable<void> {
    return this.http.post<void>(`${BASE}/saved/${productId}/move-to-cart`, {});
  }

  override removeSaved(_userId: number, productId: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/saved/${productId}`);
  }
}
