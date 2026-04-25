export type DashboardOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CustomerDashboardSummary {
  customerId: number;
  customerName: string;
  totalOrders: number;
  activeOrders: number;
  trackableOrders: number;
  wishlistCount: number;
  loyaltyPoints: number;
  totalSpent: number;
  segment: string;
  latestOrder: {
    id: number;
    orderNumber: string;
    total: number;
    status: DashboardOrderStatus;
    createdAt: string;
  } | null;
}

export interface CustomerDashboardProfile {
  id: number;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  defaultAddress: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  lastOrderAt: string | null;
  segment: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardOrderItemProduct {
  id: number;
  name: string;
  slug: string;
  images: string[];
}

export interface DashboardOrderItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: DashboardOrderItemProduct;
}

export interface DashboardOrderPayment {
  method: string;
  status: string;
  amount: number;
  paidAt: string | null;
}

export interface CustomerDashboardOrder {
  id: number;
  orderNumber: string;
  status: DashboardOrderStatus;
  total: number;
  subtotal: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostal: string | null;
  shippingCountry: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: DashboardOrderItem[];
  payment: DashboardOrderPayment | null;
  trackingEvents: Array<{
    id: number;
    status: DashboardOrderStatus;
    title: string;
    description: string | null;
    createdAt: string;
  }>;
}

export interface CustomerDashboardOrdersResult {
  orders: CustomerDashboardOrder[];
  meta: PaginationMeta;
}

export interface OrderTrackingEvent {
  id: number;
  status: DashboardOrderStatus;
  title: string;
  description: string | null;
  createdAt: string;
}

export interface CustomerOrderTracking {
  id: number;
  orderNumber: string;
  status: DashboardOrderStatus;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  trackingEvents: OrderTrackingEvent[];
}

export interface WishlistProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  isActive: boolean;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  inventories: Array<{
    id: number;
    quantity: number;
    reservedQty: number;
  }>;
}

export interface WishlistItem {
  id: number;
  customerId: number;
  productId: number;
  createdAt: string;
  product: WishlistProduct;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  defaultAddress?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface ListMyOrdersParams {
  page?: number;
  limit?: number;
  status?: DashboardOrderStatus;
  search?: string;
}

export interface AddWishlistPayload {
  productId: number;
}
