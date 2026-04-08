export interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'rectangle' | 'circle';
  seats: number;
  status: 'libre' | 'ocupada' | 'cuenta_pedida';
  active: number;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  active: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  category_name: string;
  name: string;
  description?: string;
  price: number;
  available: number;
  sort_order: number;
}

export interface Order {
  id: string;
  table_id: string;
  table_name: string;
  table_number: number;
  status: 'abierta' | 'cobrada' | 'cancelada';
  waiter_id?: string;
  waiter_name: string;
  total: number;
  payment_method?: string;
  notes?: string;
  opened_at: string;
  closed_at?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  sent_to_kitchen: number;
  created_at: string;
}

export interface Shift {
  id: string;
  date: string;
  user_id?: string;
  user_name: string;
  opened_at: string;
  closed_at?: string;
  total_cash: number;
  total_card: number;
  grand_total: number;
  total_orders: number;
  active: number;
}
