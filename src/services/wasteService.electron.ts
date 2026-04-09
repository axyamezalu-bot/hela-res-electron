export interface InventoryItem {
  id: string;
  name: string;
  unit: 'unidad' | 'kg' | 'g' | 'l' | 'ml';
  stock: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
}

export interface WasteRecord {
  id: string;
  item_id: string;
  item_name: string;
  unit?: string;
  quantity: number;
  reason: string;
  user_id: string;
  user_name: string;
  date: string;
}

const api = () => (window as any).electronAPI;

export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    return await api().query('inventory:getAll');
  },
  async create(data: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> {
    return await api().query('inventory:create', data);
  },
  async update(data: Omit<InventoryItem, 'created_at' | 'updated_at'>): Promise<InventoryItem> {
    return await api().query('inventory:update', data);
  },
  async delete(id: string): Promise<void> {
    await api().query('inventory:delete', id);
  },
  async addStock(id: string, amount: number): Promise<InventoryItem> {
    return await api().query('inventory:addStock', { id, amount });
  },
};

export const wasteServiceElectron = {
  async getAll(): Promise<WasteRecord[]> {
    return await api().query('waste:getAll');
  },
  async create(data: Omit<WasteRecord, 'id' | 'date'>): Promise<WasteRecord> {
    return await api().query('waste:create', data);
  },
};