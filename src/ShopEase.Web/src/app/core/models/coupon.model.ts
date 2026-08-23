export type CouponType = 'percent' | 'flat' | 'freeship';

export interface Coupon {
  code: string;
  type: CouponType;
  value: number;
  maxDiscount?: number;
  minOrder: number;
  label: string;
}

export interface CouponValidationResult {
  valid: boolean;
  message?: string;
  coupon?: Coupon;
  code?: string;
}
