import { Product } from './product';
import { Customer } from './customer';

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customer?: Customer;
  items: OrderItem[];
  shippingName?: string;
  shippingEmail?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discountAmount?: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface CreateOrderPayload {
  customerId: number;
  items: Array<{ productId: number; quantity: number }>;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingAddress: string;
  notes?: string;
}
