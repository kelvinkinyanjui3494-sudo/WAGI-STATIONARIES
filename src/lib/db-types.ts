export type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: number;
  product_id: number;
  path: string | null;
  url: string | null;
  is_primary: boolean;
  alt: string | null;
  meta?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  barcode: string | null;
  brand: string | null;
  category_id: number | null;
  subcategory: string | null;
  description: string | null;
  specifications: string | null;

  price: number | string;
  discount_price: number | string | null;

  // Laravel database field
  stock_qty: number;

// Optional API/frontend compatibility fields
stock_quantity?: number;
  low_stock_threshold?: number;
  image_url?: string | null;
  review_count?: number;
  sold_count?: number;

  availability: string;
  rating: number | string;

  is_featured?: boolean | number;
  is_new_arrival?: boolean | number;
  is_flash_sale?: boolean | number;

  created_at: string;
  updated_at: string;

  images?: ProductImage[];
};

export type CartItemRow = {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  saved_for_later: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Order = {
  id: number;
  order_number: string;
  user_id: number;

  status: string;
  payment_status: string;
  payment_method: string | null;

  subtotal: number | string;
  delivery_fee: number | string;
  tax: number | string;
  discount: number | string;
  total: number | string;

  delivery_address?: string | null;

  // Optional API response fields used by the storefront
  customer_name?: string;
  phone?: string | null;
  house_number?: string | null;
  building?: string | null;
  street?: string | null;
  estate?: string | null;
  town?: string | null;
  county?: string | null;
  landmark?: string | null;

  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number | null;

  product_name: string;
  sku: string | null;

  quantity: number;
  unit_price: number | string;
  total_price: number | string;

  created_at?: string;
};

export type OrderStatusHistory = {
  id: number;
  order_id: number;
  status: string;
  created_at: string;
  updated_at?: string;
};

export type Payment = {
  id: number;
  order_id: number;
  transaction_id?: string | null;
  amount: number | string;
  status: string;
  method: string | null;
  meta?: Record<string, unknown> | null;
  created_at: string;
  updated_at?: string;
};

export type Profile = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  alt_phone?: string | null;
};

export type Review = {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  title: string | null;
  body: string | null;
  comment?: string | null;
  author_name?: string;
  created_at: string;
  updated_at?: string;
};

export type Coupon = {
  id: number;
  code: string;
  type: string;
  value: number | string;
  expires_at: string | null;
  usage_limit: number | null;

  // Optional compatibility fields
  discount_type?: string;
  discount_value?: number | string;
  min_order_amount?: number | string;
  discount?: number | string;

  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: number;
  user_id: number | null;
  type: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export type Address = {
  id: number;
  user_id: number;
  county: string | null;
  town: string | null;
  estate: string | null;
  street: string | null;
  building: string | null;
  house_number: string | null;
  nearest_landmark: string | null;
  instructions: string | null;
  created_at: string;
};

export type StoreSettings = {
  id: number;
  key: string;
  value: string | null;
  created_at: string;
  updated_at: string;

  // Optional storefront configuration fields
  free_delivery_threshold?: number | string;
  delivery_fee?: number | string;
  tax_rate?: number | string;
  mpesa_phone?: string | null;
};

export type OrderStatus = string;
export type PaymentStatus = string;
export type PaymentMethod = string;

export type ProductWithCategory = Product & {
  categories: Pick<Category, "name" | "slug"> | null;
};

export type CartLine = {
  productId: string;
  quantity: number;
  savedForLater: boolean;
  product: Product;
};