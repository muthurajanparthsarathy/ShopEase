import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { WishlistService } from '../services/wishlist.service';

@Injectable({ providedIn: 'root' })
export class WishlistStore {
  private wishlist = inject(WishlistService);

  readonly ids = signal<number[]>([]);
  readonly count = computed(() => this.ids().length);

  refresh(userId: number): Observable<number[]> {
    return this.wishlist.getIds(userId).pipe(tap((ids) => this.ids.set(ids)));
  }

  has(productId: number): boolean {
    return this.ids().includes(productId);
  }

  toggle(userId: number, productId: number): void {
    this.wishlist.toggle(userId, productId).subscribe(() => this.refresh(userId).subscribe());
  }

  clear(): void {
    this.ids.set([]);
  }
}
