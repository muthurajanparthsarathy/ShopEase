export interface CartItem {
  productId: number;
  name: string;
  brand: string;
  price: number;
  quantity: number;
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  coupon: string | null;
  tax: number;
  shipping: number;
  total: number;
}
