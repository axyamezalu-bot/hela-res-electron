import type { WasteRecord } from './wasteService';

function rowToWaste(row: any): WasteRecord {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productCode: row.product_code,
    quantity: row.quantity,
    reason: row.reason,
    userId: row.user_id,
    userName: row.user_name,
    date: row.date,
  };
}

export const wasteServiceElectron = {
  async getAll(): Promise<any[]> {
    const rows = await (window as any).electronAPI.query('waste:getAll');
    return rows.map(rowToWaste);
  },
  async create(data: {
    productId: string; productName: string; productCode: string;
    quantity: number; reason: string; userId: string; userName: string;
  }): Promise<any> {
    const row = await (window as any).electronAPI.query('waste:create', data);
    return rowToWaste(row);
  },
};
