import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { CartService } from '../services/cart.service';
import { CartSummary } from '../models';

const EMPTY_SUMMARY: CartSummary = { items: [], itemCount: 0, subtotal: 0, discount: 0, coupon: null, tax: 0, shipping: 0, total: 0 };

/** Canonical cart state — refreshed after every cart mutation so the navbar badge and cart page stay in sync. */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private cart = inject(CartService);

  readonly summary = signal<CartSummary>(EMPTY_SUMMARY);
  readonly itemCount = computed(() => this.summary().itemCount);

  refresh(userId: number): Observable<CartSummary> {
    return this.cart.getCartSummary(userId).pipe(tap((s) => this.summary.set(s)));
  }

  clear(): void {
    this.summary.set(EMPTY_SUMMARY);
  }
}
