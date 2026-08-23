import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CouponValidationResult } from '../models';

/** Coupon *definitions* + validation now live entirely server-side (see B3) — this repository just
 * tracks which code (if any) the current user has applied. */
@Injectable()
export abstract class CouponRepository {
  abstract getApplied(): Observable<string | null>;
  abstract apply(code: string): Observable<CouponValidationResult>;
  abstract removeApplied(): Observable<void>;
}

const BASE = `${environment.apiUrl}/coupons`;

@Injectable()
export class HttpCouponRepository extends CouponRepository {
  private http = inject(HttpClient);

  override getApplied(): Observable<string | null> {
    return this.http.get<string | null>(`${BASE}/applied`);
  }

  override apply(code: string): Observable<CouponValidationResult> {
    return this.http.post<CouponValidationResult>(`${BASE}/apply`, { code });
  }

  override removeApplied(): Observable<void> {
    return this.http.delete<void>(`${BASE}/applied`);
  }
}
