import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ReviewRepository } from '../../core/repositories/review.repository';
import { Review, ReviewInput, ReviewStats } from '../../core/models';

// Only consumed by the Catalog feature (product cards + product-detail reviews tab).
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private repo = inject(ReviewRepository);

  getForProduct(productId: number): Observable<Review[]> {
    return this.repo.getForProduct(productId);
  }

  getStats(productId: number): Observable<ReviewStats> {
    return this.repo.getStats(productId);
  }

  getStatsForAll(): Observable<Record<number, ReviewStats>> {
    return this.repo.getStatsForAll();
  }

  hasReviewed(userId: number, productId: number): Observable<boolean> {
    return this.repo.hasReviewed(userId, productId);
  }

  add(input: ReviewInput): Observable<Review> {
    return this.repo.add({ ...input, comment: input.comment || '', createdAt: new Date().toISOString() });
  }

  // Reviews are front-loaded server-side now (see the backend's DemoDataSeeder) — nothing to seed
  // lazily on the client anymore. Kept as a no-op so catalog.component's existing call site is unchanged.
  ensureSeeded(): Observable<void> {
    return of(undefined);
  }
}
