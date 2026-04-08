import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Row interface: BD (snake_case)
// ---------------------------------------------------------------------------

interface WasteRecordRow {
  id: string;
  product_id: string | null;
  product_name: string;
  product_code: string;
  quantity: number;
  reason: string;
  user_id: string | null;
  user_name: string;
  date: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// TypeScript output type
// ---------------------------------------------------------------------------

export interface WasteRecord {
  id: string;
  productId: string | null;
  productName: string;
  productCode: string;
  quantity: number;
  reason: string;
  userId: string | null;
  userName: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function rowToWasteRecord(row: WasteRecordRow): WasteRecord {
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

// ---------------------------------------------------------------------------
// wasteService
// ---------------------------------------------------------------------------

export const wasteService = {
  async getAll(): Promise<WasteRecord[]> {
    try {
      const { data, error } = await supabase
        .from('waste_records')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return (data as WasteRecordRow[]).map(rowToWasteRecord);
    } catch (error) {
      console.error('wasteService.getAll:', error);
      throw error;
    }
  },

  async getByMonth(year: number, month: number): Promise<WasteRecord[]> {
    try {
      const from = new Date(year, month - 1, 1).toISOString();
      const to = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

      const { data, error } = await supabase
        .from('waste_records')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data as WasteRecordRow[]).map(rowToWasteRecord);
    } catch (error) {
      console.error('wasteService.getByMonth:', error);
      throw error;
    }
  },

  async create(record: Omit<WasteRecord, 'id'>): Promise<WasteRecord> {
    try {
      const { data, error } = await supabase
        .from('waste_records')
        .insert({
          product_id: record.productId,
          product_name: record.productName,
          product_code: record.productCode,
          quantity: record.quantity,
          reason: record.reason,
          user_id: record.userId,
          user_name: record.userName,
          date: record.date,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToWasteRecord(data as WasteRecordRow);
    } catch (error) {
      console.error('wasteService.create:', error);
      throw error;
    }
  },
};
