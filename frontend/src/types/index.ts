export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviewCount: number;
  images: string[];
  description: string;
  sizes: string[];
  colors: ProductColor[];
  tags: string[];
  isNew: boolean;
  isBestseller: boolean;
  inStock: boolean;
  stockCount: number;
  specifications: Record<string, string>;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface WishlistItem {
  product: Product;
  addedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  addresses: Address[];
  token?: string; // stored temporarily during session hydration
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  status: 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  shippingAddress: Address;
  createdAt: string;
  trackingId?: string;
}

export interface FilterState {
  categories: string[];
  brands: string[];
  minPrice: number;
  maxPrice: number;
  sizes: string[];
  colors: string[];
  ratings: number[];
  inStockOnly: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}
