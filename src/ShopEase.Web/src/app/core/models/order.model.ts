import { Address } from './address.model';

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';

export interface OrderItem {
  productId: number;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  address: Address;
  paymentMethodId: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  custom?: Record<string, unknown>;
}

export interface OrderFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number | string;
  maxAmount?: number | string;
  customerId?: number;
}
