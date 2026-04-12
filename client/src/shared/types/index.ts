// Product types
export type { Category, Product, ListProductsParams } from './product';

// Order types
export type { Order, OrderItem, CreateOrderPayload } from './order';
export { OrderStatus, PaymentStatus } from './order';

// Customer types
export type { User, Customer, CustomerMetrics, UpdateCustomerPayload } from './customer';
export { UserRole, CustomerSegment } from './customer';

// Payment types
export type { Payment, PaymentInitiate, SSLCommerzPayload } from './payment';
export { PaymentMethod, PaymentProvider } from './payment';

// Inventory types
export type { Inventory, InventoryTransaction, LowStockAlert, InventoryStats } from './inventory';
export { InventoryTransactionType } from './inventory';

// Common types
export type {
  PaginatedResponse,
  ApiResponse,
  ApiError,
  PaginationParams,
  LoadingState,
  PaginationState,
} from './common';
export { HTTP_STATUS } from './common';
