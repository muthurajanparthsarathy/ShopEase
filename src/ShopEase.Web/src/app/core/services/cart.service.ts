import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CartRepository } from '../repositories/cart.repository';
import { toResult, toVoidResult } from '../utils/http-result.utils';
import { CartItem, CartSummary, Result } from '../models';

/**
 * Thin now — stock checks, tax/shipping/coupon math, and save-for-later orchestration all moved
 * server-side (see ShopEase.Api's CartController/CartService). This class just adapts the API's raw
 * responses into the Result<T> shape every cart/checkout component already expects.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private repo = inject(CartRepository);

  getCart(userId: number): Observable<CartItem[]> {
    return this.repo.getCart(userId);
  }

  addToCart(userId: number, productId: number, quantity = 1): Observable<Result<CartItem[]>> {
    return toResult(this.repo.addItem(userId, productId, quantity), 'Added to cart.');
  }

  updateQuantity(userId: number, productId: number, quantity: number): Observable<Result<CartItem[]>> {
    if (quantity <= 0) return this.removeItem(userId, productId);
    return toResult(this.repo.updateItem(userId, productId, quantity), 'Cart updated.');
  }

  removeItem(userId: number, productId: number): Observable<Result<CartItem[]>> {
    return toResult(this.repo.removeItem(userId, productId), 'Item removed.');
  }

  clearCart(userId: number): Observable<Result> {
    return toVoidResult(this.repo.clear(userId), 'Cart cleared.');
  }

  getItemCount(userId: number): Observable<number> {
    return this.getCart(userId).pipe(map((cart) => cart.reduce((sum, i) => sum + i.quantity, 0)));
  }

  getCartSummary(userId: number): Observable<CartSummary> {
    return this.repo.getSummary(userId);
  }

  // ── Save for later ──
  getSaved(userId: number): Observable<CartItem[]> {
    return this.repo.getSaved(userId);
  }

  saveForLater(userId: number, productId: number): Observable<Result> {
    return toVoidResult(this.repo.saveForLater(userId, productId), 'Saved for later.');
  }

  moveToCart(userId: number, productId: number): Observable<Result> {
    return toVoidResult(this.repo.moveToCart(userId, productId), 'Moved to cart.');
  }

  removeSaved(userId: number, productId: number): Observable<Result> {
    return toVoidResult(this.repo.removeSaved(userId, productId), 'Removed.');
  }
}
