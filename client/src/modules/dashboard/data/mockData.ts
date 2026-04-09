export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  sold: number;
  manualSold: number;
  status: 'active' | 'low' | 'out';
}

export interface SellLog {
  id: string;
  product: string;
  qty: number;
  amount: number;
  note: string;
  date: string;
  by: string;
}

export interface Order {
  id: string;
  customer: string;
  amount: number;
  status: 'delivered' | 'processing' | 'shipped' | 'pending';
  items: number;
  time: string;
}

export interface Branch {
  id: number;
  name: string;
  city: string;
  address: string;
  phone: string;
  manager: string;
  email: string;
  active: boolean;
  hq: boolean;
  orders: number;
  stock: number;
  revenue: number;
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Rose Glow Serum 30ml',
    sku: 'SKU-001',
    category: 'Skincare',
    price: 300,
    stock: 48,
    sold: 312,
    manualSold: 0,
    status: 'active',
  },
  {
    id: 2,
    name: 'Velvet Matte Lip #07',
    sku: 'SKU-002',
    category: 'Lipstick',
    price: 200,
    stock: 12,
    sold: 287,
    manualSold: 34,
    status: 'low',
  },
  {
    id: 3,
    name: 'Hydra-Silk Foundation',
    sku: 'SKU-003',
    category: 'Foundation',
    price: 400,
    stock: 67,
    sold: 244,
    manualSold: 12,
    status: 'active',
  },
  {
    id: 4,
    name: 'Midnight Eye Palette',
    sku: 'SKU-004',
    category: 'Eyewear',
    price: 400,
    stock: 0,
    sold: 198,
    manualSold: 0,
    status: 'out',
  },
  {
    id: 5,
    name: 'Pearl Essence Cream',
    sku: 'SKU-005',
    category: 'Skincare',
    price: 400,
    stock: 134,
    sold: 176,
    manualSold: 8,
    status: 'active',
  },
  {
    id: 6,
    name: 'Brow Definer Pencil',
    sku: 'SKU-009',
    category: 'Eyewear',
    price: 150,
    stock: 8,
    sold: 89,
    manualSold: 22,
    status: 'low',
  },
  {
    id: 7,
    name: 'Micellar Water 200ml',
    sku: 'SKU-014',
    category: 'Skincare',
    price: 220,
    stock: 5,
    sold: 134,
    manualSold: 5,
    status: 'low',
  },
  {
    id: 8,
    name: 'Setting Spray Fine Mist',
    sku: 'SKU-018',
    category: 'Skincare',
    price: 280,
    stock: 3,
    sold: 67,
    manualSold: 3,
    status: 'low',
  },
];

export const INITIAL_LOG: SellLog[] = [
  {
    id: 'MS-001',
    product: 'Velvet Matte Lip #07',
    qty: 3,
    amount: 600,
    note: 'Walk-in customer',
    date: 'Today, 10:22 AM',
    by: 'Cashier',
  },
  {
    id: 'MS-002',
    product: 'Brow Definer Pencil',
    qty: 2,
    amount: 300,
    note: 'Counter sale',
    date: 'Today, 09:14 AM',
    by: 'Manager',
  },
  {
    id: 'MS-003',
    product: 'Rose Glow Serum 30ml',
    qty: 1,
    amount: 300,
    note: 'Repeat customer',
    date: 'Yesterday',
    by: 'Cashier',
  },
];

export const ORDERS: Order[] = [
  {
    id: '#ORD-4821',
    customer: 'Nadia Akter',
    amount: 2850,
    status: 'delivered',
    items: 3,
    time: '2h ago',
  },
  {
    id: '#ORD-4820',
    customer: 'Sadia Islam',
    amount: 1200,
    status: 'processing',
    items: 1,
    time: '4h ago',
  },
  {
    id: '#ORD-4819',
    customer: 'Rupa Begum',
    amount: 4600,
    status: 'shipped',
    items: 5,
    time: '6h ago',
  },
  {
    id: '#ORD-4818',
    customer: 'Mitu Chowdhury',
    amount: 750,
    status: 'pending',
    items: 1,
    time: '8h ago',
  },
  {
    id: '#ORD-4817',
    customer: 'Tania Rahman',
    amount: 3100,
    status: 'delivered',
    items: 4,
    time: '12h ago',
  },
];

export const revenueData = [
  { month: 'Oct', revenue: 182000, orders: 134 },
  { month: 'Nov', revenue: 215000, orders: 167 },
  { month: 'Dec', revenue: 289000, orders: 221 },
  { month: 'Jan', revenue: 198000, orders: 154 },
  { month: 'Feb', revenue: 234000, orders: 178 },
  { month: 'Mar', revenue: 312000, orders: 243 },
];

export const dailySales = [
  { day: 'Mon', online: 32000, manual: 18000 },
  { day: 'Tue', online: 28000, manual: 22000 },
  { day: 'Wed', online: 41000, manual: 31000 },
  { day: 'Thu', online: 35000, manual: 27000 },
  { day: 'Fri', online: 54000, manual: 38000 },
  { day: 'Sat', online: 61000, manual: 52000 },
  { day: 'Sun', online: 47000, manual: 41000 },
];

export const categoryData = [
  { name: 'Skincare', value: 38, color: '#f01172' },
  { name: 'Lipstick', value: 24, color: '#c20d5e' },
  { name: 'Foundation', value: 18, color: '#f59e0b' },
  { name: 'Eyewear', value: 12, color: '#8b5cf6' },
  { name: 'Fragrance', value: 8, color: '#757575' },
];

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 1,
    name: 'Dhaka Main',
    city: 'Dhaka',
    address: 'House 12, Road 4, Dhanmondi',
    phone: '01711-234567',
    manager: 'Karim Hossain',
    email: 'dhaka@mouchak.com',
    active: true,
    hq: true,
    orders: 245,
    stock: 1248,
    revenue: 198000,
  },
  {
    id: 2,
    name: 'Chittagong',
    city: 'Chittagong',
    address: 'Agrabad C/A, Block A, 3rd Floor',
    phone: '01812-345678',
    manager: 'Fatima Khanam',
    email: 'ctg@mouchak.com',
    active: true,
    hq: false,
    orders: 128,
    stock: 890,
    revenue: 97400,
  },
  {
    id: 3,
    name: 'Sylhet Outlet',
    city: 'Sylhet',
    address: 'Zindabazar, Main Road',
    phone: '01913-456789',
    manager: 'Raihan Ahmed',
    email: 'sylhet@mouchak.com',
    active: false,
    hq: false,
    orders: 67,
    stock: 430,
    revenue: 48200,
  },
];
