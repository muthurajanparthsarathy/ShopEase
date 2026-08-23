export interface Product {
  id: number;
  name: string;
  brand: string;
  sku: string;
  price: number;
  stock: number;
  categoryId: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  custom?: Record<string, unknown>;
}

export type ProductInput = Omit<Product, 'id' | 'isActive' | 'createdAt'>;

export interface ProductFilters {
  categoryId?: number | string;
  minPrice?: number | string;
  maxPrice?: number | string;
  inStock?: boolean;
  brand?: string;
  sortBy?: 'price-asc' | 'price-desc' | 'name-asc' | 'newest' | '';
}
