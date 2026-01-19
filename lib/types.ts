export interface CartItem {
  id: string;
  type: 'food' | 'drink';
  name: string;
  price: number;
  quantity: number;
}

export interface PaymentData {
  method: 'card' | 'cash' | 'pix';
  changeFor?: number;
  name: string;
  address: string;
  phone: string;
  observation?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  createdAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerSettings {
  saveData: boolean;
  rememberMe: boolean;
}

export interface Order {
  id: string;
  customer_id?: string;
  order_number: string;
  items: CartItem[];
  total: number;
  payment_method: string;
  change_for?: number;
  address: string;
  observation?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  type: 'food' | 'drink';
  available: boolean;
  category?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  role: 'admin';
}

export interface ComandaItem {
  id: string;
  comanda_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  status: 'pending' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface Comanda {
  id: string;
  table_number: number;
  customer_name?: string;
  status: 'open' | 'closed' | 'paid';
  total: number;
  created_at: string;
  closed_at?: string;
  items?: ComandaItem[];
  waiter_id?: string;
  closing_requested?: boolean;
}


