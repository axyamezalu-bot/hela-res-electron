import { supabase } from '@/lib/supabase';
import type { User } from '../App';

// ---------------------------------------------------------------------------
// Mappers: BD (snake_case) ↔ TypeScript (camelCase)
// ---------------------------------------------------------------------------

interface UserRow {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  pin: string | null;
  role: User['role'];
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    password: row.password_hash,
    pin: row.pin ?? undefined,
    role: row.role,
    isAdmin: row.is_admin,
    createdAt: row.created_at,
  };
}

function userToRow(user: Omit<User, 'id' | 'createdAt'>): Omit<UserRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    username: user.username,
    full_name: user.fullName,
    email: user.email,
    phone: user.phone,
    password_hash: user.password,
    pin: user.pin ?? null,
    role: user.role,
    is_admin: user.isAdmin,
  };
}

// ---------------------------------------------------------------------------
// userService
// ---------------------------------------------------------------------------

export const userService = {
  async getAll(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as UserRow[]).map(rowToUser);
    } catch (error) {
      console.error('userService.getAll:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return rowToUser(data as UserRow);
    } catch (error) {
      console.error('userService.getById:', error);
      throw error;
    }
  },

  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(userToRow(user))
        .select()
        .single();

      if (error) throw error;
      return rowToUser(data as UserRow);
    } catch (error) {
      console.error('userService.create:', error);
      throw error;
    }
  },

  async update(id: string, user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(userToRow(user))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return rowToUser(data as UserRow);
    } catch (error) {
      console.error('userService.update:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('userService.delete:', error);
      throw error;
    }
  },

  /**
   * Busca un Dueño o Administrador cuyo PIN coincida con el proporcionado.
   * Usado para autorizar acciones de Cajeros que requieren PIN de admin.
   */
  async verifyPin(pin: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('pin', pin)
        .in('role', ['Dueño', 'Administrador'])
        .maybeSingle();

      if (error) throw error;
      return data ? rowToUser(data as UserRow) : null;
    } catch (error) {
      console.error('userService.verifyPin:', error);
      throw error;
    }
  },
};
