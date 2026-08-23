import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Review, ReviewStats } from '../models';

@Injectable()
export abstract class ReviewRepository {
  abstract getForProduct(productId: number): Observable<Review[]>;
  abstract getStats(productId: number): Observable<ReviewStats>;
  abstract getStatsForAll(): Observable<Record<number, ReviewStats>>;
  abstract hasReviewed(userId: number, productId: number): Observable<boolean>;
  abstract add(review: Omit<Review, 'id'>): Observable<Review>;
}

const BASE = `${environment.apiUrl}/reviews`;

@Injectable()
export class HttpReviewRepository extends ReviewRepository {
  private http = inject(HttpClient);

  override getForProduct(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${BASE}/product/${productId}`);
  }

  override getStats(productId: number): Observable<ReviewStats> {
    return this.http.get<ReviewStats>(`${BASE}/stats/product/${productId}`);
  }

  override getStatsForAll(): Observable<Record<number, ReviewStats>> {
    return this.http.get<Record<number, ReviewStats>>(`${BASE}/stats`);
  }

  override hasReviewed(_userId: number, productId: number): Observable<boolean> {
    // userId comes from the JWT server-side, not the query string — kept as a param for interface
    // parity with the original (localStorage-era) contract, which had no concept of "current user".
    return this.http.get<boolean>(`${BASE}/has-reviewed`, { params: { productId } });
  }

  override add(review: Omit<Review, 'id'>): Observable<Review> {
    return this.http.post<Review>(BASE, { productId: review.productId, rating: review.rating, comment: review.comment });
  }
}
