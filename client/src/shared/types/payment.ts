export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  MOBILE_WALLET = 'mobile_wallet',
  BANK_TRANSFER = 'bank_transfer',
  COD = 'cod', // Cash on Delivery
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SSLCOMMERZ = 'sslcommerz',
  MANUAL = 'manual',
}

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider: PaymentProvider;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInitiate {
  orderId: number;
  amount: number;
  method: PaymentMethod;
  provider: PaymentProvider;
  redirectUrl: string;
}

export interface SSLCommerzPayload {
  orderId: number;
  amount: number;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
}
