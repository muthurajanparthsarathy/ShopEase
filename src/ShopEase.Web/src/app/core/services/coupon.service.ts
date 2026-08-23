import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { CouponRepository } from '../repositories/coupon.repository';
import { extractErrorMessage } from '../utils/http-result.utils';
import { Coupon, CouponValidationResult } from '../models';

// Static display hints for the cart's "try these codes" UI — matches the coupons seeded server-side
// (see DbSeeder). There's no admin UI for managing coupons in this app (same as the original), so a
// static list is fine here; actual validation always goes through the server regardless.
const COUPON_HINTS: Coupon[] = [
  { code: 'SAVE10', type: 'percent', value: 10, maxDiscount: 500, minOrder: 0, label: '10% off your order (up to ₹500)' },
  { code: 'WELCOME50', type: 'flat', value: 50, minOrder: 200, label: '₹50 off orders above ₹200' },
  { code: 'FLAT100', type: 'flat', value: 100, minOrder: 500, label: '₹100 off orders above ₹500' },
  { code: 'FREESHIP', type: 'freeship', value: 0, minOrder: 0, label: 'Free shipping on your order' },
];

@Injectable({ providedIn: 'root' })
export class CouponService {
  private repo = inject(CouponRepository);

  list(): Coupon[] {
    return COUPON_HINTS;
  }

  getApplied(_userId: number): Observable<string | null> {
    return this.repo.getApplied();
  }

  // subtotal is accepted for interface parity with existing callers, but the server computes it from
  // the caller's own cart — a client-supplied amount is never trusted for the minimum-order check.
  apply(_userId: number, code: string, _subtotal: number): Observable<CouponValidationResult> {
    return this.repo.apply(code).pipe(
      catchError((err: unknown) => of({ valid: false, message: extractErrorMessage(err) } as CouponValidationResult)),
    );
  }

  remove(_userId: number): Observable<void> {
    return this.repo.removeApplied();
  }
}
