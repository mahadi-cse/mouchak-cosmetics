export interface PromotionCategory {
  id: number;
  name: string;
  slug: string;
}

export interface Promotion {
  id: number;
  label: string;
  banner: string;
  pct: number;
  endsAt: string | null;
  isActive: boolean;
  applyTo: 'ALL' | 'PRODUCT' | 'CATEGORY';
  productIds: number[];
  categoryId: number | null;
  category?: PromotionCategory | null;
  createdAt: string;
  updatedAt: string;
}
