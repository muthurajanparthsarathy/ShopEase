import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { WishlistRepository } from '../repositories/wishlist.repository';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private repo = inject(WishlistRepository);

  getIds(userId: number): Observable<number[]> {
    return this.repo.getIds(userId);
  }

  has(userId: number, productId: number): Observable<boolean> {
    return this.getIds(userId).pipe(map((ids) => ids.includes(productId)));
  }

  toggle(userId: number, productId: number): Observable<boolean> {
    return this.repo.toggle(userId, productId);
  }

  remove(userId: number, productId: number): Observable<void> {
    return this.repo.remove(userId, productId);
  }

  count(userId: number): Observable<number> {
    return this.getIds(userId).pipe(map((ids) => ids.length));
  }
}
