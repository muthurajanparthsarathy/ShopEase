import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export abstract class WishlistRepository {
  abstract getIds(userId: number): Observable<number[]>;
  abstract toggle(userId: number, productId: number): Observable<boolean>;
  abstract remove(userId: number, productId: number): Observable<void>;
}

const BASE = `${environment.apiUrl}/wishlist`;

@Injectable()
export class HttpWishlistRepository extends WishlistRepository {
  private http = inject(HttpClient);

  // userId is server-derived from the JWT — kept as a param only for interface parity with callers.
  override getIds(_userId: number): Observable<number[]> {
    return this.http.get<number[]>(BASE);
  }

  override toggle(_userId: number, productId: number): Observable<boolean> {
    return this.http.post<boolean>(`${BASE}/${productId}/toggle`, {});
  }

  override remove(_userId: number, productId: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${productId}`);
  }
}
