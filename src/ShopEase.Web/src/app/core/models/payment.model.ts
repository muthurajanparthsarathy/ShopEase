export type PaymentMethodName = 'Credit Card' | 'UPI' | 'Cash on Delivery';
export type PaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Refunded';

export interface PaymentMethod {
  id: number;
  name: PaymentMethodName;
}

export interface PaymentDetailsInput {
  cardNumber?: string;
  cardHolder?: string;
  expiry?: string;
  cvv?: string;
  upiId?: string;
}

export interface Payment {
  id: number;
  orderId: number;
  userId: number;
  method: PaymentMethodName;
  amount: number;
  status: PaymentStatus;
  transactionId: string | null;
  details: { cardLast4?: string; cardHolder?: string; upiId?: string };
  createdAt: string;
}

export interface PaymentFilters {
  method?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number | string;
  maxAmount?: number | string;
}
