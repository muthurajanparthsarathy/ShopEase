import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { CartStore } from '../../core/stores/cart.store';
import { CouponService } from '../../core/services/coupon.service';
import { AuthStore } from '../../core/stores/auth.store';
import { ToastService } from '../../core/services/toast.service';
import { CartItem, Coupon } from '../../core/models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cart.component.html',
})
export class CartComponent implements OnInit {
  private cartSvc = inject(CartService);
  cartStore = inject(CartStore);
  private couponSvc = inject(CouponService);
  private auth = inject(AuthStore);
  private toast = inject(ToastService);

  saved = signal<CartItem[]>([]);
  couponCode = signal('');
  couponHints: Coupon[] = this.couponSvc.list();

  private get userId() { return this.auth.currentUser()!.id; }

  ngOnInit(): void {
    this.reload();
  }

  private reload(): void {
    this.cartStore.refresh(this.userId).subscribe();
    this.cartSvc.getSaved(this.userId).subscribe((items) => this.saved.set(items));
  }

  changeQty(item: CartItem, delta: number): void {
    const qty = Math.max(1, item.quantity + delta);
    this.setQty(item, qty);
  }

  setQty(item: CartItem, qty: number): void {
    if (qty < 1) qty = 1;
    this.cartSvc.updateQuantity(this.userId, item.productId, qty).subscribe((result) => {
      if (!result.success) this.toast.show(result.message, 'error');
      this.reload();
    });
  }

  async removeItem(item: CartItem): Promise<void> {
    const ok = await this.toast.confirm('Remove this item from your cart?', 'danger');
    if (!ok) return;
    this.cartSvc.removeItem(this.userId, item.productId).subscribe((result) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      this.reload();
    });
  }

  saveForLater(item: CartItem): void {
    this.cartSvc.saveForLater(this.userId, item.productId).subscribe((result) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      this.reload();
    });
  }

  async clearCart(): Promise<void> {
    const ok = await this.toast.confirm('Clear all items from your cart?', 'danger');
    if (!ok) return;
    this.cartSvc.clearCart(this.userId).subscribe(() => {
      this.toast.show('Cart cleared.', 'success');
      this.reload();
    });
  }

  moveToCart(item: CartItem): void {
    this.cartSvc.moveToCart(this.userId, item.productId).subscribe((result) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      this.reload();
    });
  }

  removeSaved(item: CartItem): void {
    this.cartSvc.removeSaved(this.userId, item.productId).subscribe((result) => {
      this.toast.show(result.message, 'info');
      this.reload();
    });
  }

  useHint(code: string): void {
    this.couponCode.set(code);
  }

  applyCoupon(): void {
    const code = this.couponCode().trim();
    if (!code) { this.toast.show('Enter a coupon code.', 'error'); return; }
    const subtotal = this.cartStore.summary().subtotal;
    this.couponSvc.apply(this.userId, code, subtotal).subscribe((result) => {
      this.toast.show(result.message ?? '', result.valid ? 'success' : 'error');
      if (result.valid) { this.couponCode.set(''); this.reload(); }
    });
  }

  removeCoupon(): void {
    this.couponSvc.remove(this.userId).subscribe(() => {
      this.toast.show('Coupon removed.', 'info');
      this.reload();
    });
  }
}
