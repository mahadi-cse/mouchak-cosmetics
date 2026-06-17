export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ValidateCouponRequest {
  code: string;
  subtotal: number;
}

export interface ValidateCouponResponse {
  coupon: {
    id: number;
    code: string;
    type: 'FIXED' | 'PERCENTAGE';
    value: number;
    minOrderAmount: number | null;
    maxDiscountAmount: number | null;
  };
  discountAmount: number;
}
