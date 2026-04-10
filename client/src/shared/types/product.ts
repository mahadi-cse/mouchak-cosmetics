export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  categoryId: number;
  category?: Category;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  tags: string[];
  weight?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListProductsParams {
  category?: string;
  search?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}
