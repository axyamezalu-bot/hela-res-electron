import { supabase } from '@/lib/supabase';
import type { CashStart } from '../App';

// ---------------------------------------------------------------------------
// Mappers: BD (snake_case) ↔ TypeScript (camelCase)
// ---------------------------------------------------------------------------

interface CashRegisterRow {
  id: string;
  date: string;
  starting_amount: number;
  user_id: string;
  user_name: string;
  closed: boolean;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToCashStart(row: CashRegisterRow): CashStart {
  return {
    date: row.date,
    startingAmount: row.starting_amount,
    userId: row.user_id,
    userName: row.user_name,
  };
}

// ---------------------------------------------------------------------------
// cashRegisterService
// ---------------------------------------------------------------------------

export const cashRegisterService = {
  /**
   * Abre la caja para el día indicado con el monto inicial.
   * Si ya existe un registro abierto para ese día y usuario, lo retorna.
   */
  async open(date: string, amount: number, userId: string, userName: string): Promise<CashStart> {
    try {
      // Verificar si ya existe un registro para este día y usuario
      const { data: existing, error: fetchError } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('date', date)
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        return rowToCashStart(existing as CashRegisterRow);
      }

      // Crear nuevo registro de apertura
      const { data, error } = await supabase
        .from('cash_registers')
        .insert({
          date,
          starting_amount: amount,
          user_id: userId,
          user_name: userName,
          closed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToCashStart(data as CashRegisterRow);
    } catch (error) {
      console.error('cashRegisterService.open:', error);
      throw error;
    }
  },

  /**
   * Cierra el corte de caja del día indicado.
   * Marca el registro como cerrado y registra el timestamp del cierre.
   */
  async close(date: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cash_registers')
        .update({
          closed: true,
          closed_at: new Date().toISOString(),
        })
        .eq('date', date)
        .eq('closed', false);

      if (error) throw error;
    } catch (error) {
      console.error('cashRegisterService.close:', error);
      throw error;
    }
  },

  /**
   * Obtiene cualquier caja abierta (no cerrada), sin importar la fecha.
   * Retorna la más reciente si hubiera más de una.
   */
  async getUnclosed(): Promise<CashStart | null> {
    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('closed', false)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;
      return data ? rowToCashStart(data as CashRegisterRow) : null;
    } catch (error) {
      console.error('cashRegisterService.getUnclosed:', error);
      throw error;
    }
  },

  /**
   * Verifica si existe un registro de caja abierto (no cerrado) para el día de hoy.
   */
  async isOpenToday(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('cash_registers')
        .select('id')
        .eq('date', today)
        .eq('closed', false)
        .maybeSingle();

      if (error) throw error;
      return data !== null;
    } catch (error) {
      console.error('cashRegisterService.isOpenToday:', error);
      throw error;
    }
  },

  /**
   * Obtiene el registro de apertura de caja del día de hoy, si existe.
   */
  async getToday(): Promise<CashStart | null> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('date', today)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;
      return data ? rowToCashStart(data as CashRegisterRow) : null;
    } catch (error) {
      console.error('cashRegisterService.getToday:', error);
      throw error;
    }
  },

  async getClosedDates(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .select('date')
        .eq('closed', true);

      if (error) throw error;
      return (data as Array<{ date: string }>).map(r => r.date);
    } catch (error) {
      console.error('cashRegisterService.getClosedDates:', error);
      throw error;
    }
  },
};
