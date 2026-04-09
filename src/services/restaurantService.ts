import type {
  RestaurantTable,
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  Shift,
} from '../types/restaurant';

const api = () => (window as any).electronAPI;

export const restaurantService = {
  // Tables
  async getTables(): Promise<RestaurantTable[]> {
    return await api().query('tables:getAll');
  },
  async createTable(data: {
    number: number; name: string; x: number; y: number;
    width: number; height: number; shape: 'rectangle' | 'circle'; seats: number;
  }): Promise<RestaurantTable> {
    return await api().query('tables:create', data);
  },
  async updateTablePosition(id: string, x: number, y: number): Promise<void> {
    await api().query('tables:updatePosition', { id, x, y });
  },
  async updateTableStatus(id: string, status: RestaurantTable['status']): Promise<void> {
    await api().query('tables:updateStatus', { id, status });
  },
  async updateTable(data: {
    id: string; number: number; name: string; seats: number; shape: 'rectangle' | 'circle';
  }): Promise<RestaurantTable> {
    return await api().query('tables:update', data);
  },
  async deleteTable(id: string): Promise<void> {
    await api().query('tables:delete', id);
  },

  // Menu
  async getCategories(): Promise<MenuCategory[]> {
    return await api().query('menu:getCategories');
  },
  async createCategory(data: { name: string; color: string; sort_order: number }): Promise<MenuCategory> {
    return await api().query('menu:createCategory', data);
  },
  async deleteCategory(id: string): Promise<void> {
    await api().query('menu:deleteCategory', id);
  },
  async getMenuItems(): Promise<MenuItem[]> {
    return await api().query('menu:getItems');
  },
  async getAllMenuItems(): Promise<MenuItem[]> {
    return await api().query('menu:getAllItems');
  },
  async createMenuItem(data: {
    category_id: string; name: string; description?: string; price: number; sort_order: number;
  }): Promise<MenuItem> {
    return await api().query('menu:createItem', data);
  },
  async updateMenuItem(data: {
    id: string; name: string; description?: string; price: number; available: boolean;
  }): Promise<MenuItem> {
    return await api().query('menu:updateItem', data);
  },
  async deleteMenuItem(id: string): Promise<void> {
    await api().query('menu:deleteItem', id);
  },

  // Orders
  async getActiveOrders(): Promise<Order[]> {
    return await api().query('orders:getActive');
  },
  async getOrderByTable(tableId: string): Promise<Order | null> {
    return (await api().query('orders:getByTable', tableId)) ?? null;
  },
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await api().query('orders:getItems', orderId);
  },
  async createOrder(data: {
    table_id: string; table_name: string; waiter_id: string; waiter_name: string;
  }): Promise<Order> {
    return await api().query('orders:create', data);
  },
  async addOrderItem(data: {
    order_id: string; menu_item_id: string; menu_item_name: string;
    unit_price: number; quantity: number; notes?: string;
  }): Promise<OrderItem> {
    return await api().query('orders:addItem', data);
  },
  async removeOrderItem(data: {
    item_id: string; order_id: string; quantity: number; unit_price: number;
  }): Promise<void> {
    await api().query('orders:removeItem', data);
  },
  async sendToKitchen(orderId: string): Promise<OrderItem[]> {
    return await api().query('orders:sendToKitchen', orderId);
  },
  async requestBill(tableId: string): Promise<void> {
    await api().query('orders:requestBill', { table_id: tableId });
  },
  async closeOrder(data: {
    order_id: string; table_id: string; payment_method: string;
  }): Promise<Order> {
    return await api().query('orders:close', data);
  },
  async cancelOrder(data: { order_id: string; table_id: string }): Promise<void> {
    await api().query('orders:cancel', data);
  },

  // Shifts
  async getActiveShift(): Promise<Shift | null> {
    return (await api().query('shifts:getActive')) ?? null;
  },
  async openShift(data: { date: string; user_id: string; user_name: string }): Promise<Shift> {
    return await api().query('shifts:open', data);
  },
  async closeShift(data: {
    id: string; total_cash: number; total_card: number; total_orders: number;
  }): Promise<Shift> {
    return await api().query('shifts:close', data);
  },
  async getShiftHistory(): Promise<Shift[]> {
    return await api().query('shifts:getHistory');
  },
  async getOrdersByDate(date: string): Promise<Order[]> {
    return await api().query('shifts:getOrdersByDate', date);
  },

  // Printing
  async printKitchenTicket(data: {
    tableNumber: number;
    tableName: string;
    waiterName: string;
    orderId: string;
    items: Array<{ name: string; quantity: number; notes?: string }>;
  }): Promise<{ success: boolean; error?: string }> {
    return await api().printKitchenTicket(data);
  },
};