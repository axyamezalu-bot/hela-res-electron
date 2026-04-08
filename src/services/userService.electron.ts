import type { User } from '../App';

function rowToUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    email: row.email ?? '',
    phone: row.phone ?? '',
    password: '',
    pin: '',
    role: row.role as User['role'],
    isAdmin: row.is_admin === 1,
    createdAt: row.created_at,
  };
}

export const userServiceElectron = {
  async getAll(): Promise<User[]> {
    const rows = await (window as any).electronAPI.query('users:getAll');
    return rows.map(rowToUser);
  },

  async login(username: string, password: string): Promise<User | null> {
    const row = await (window as any).electronAPI.query('users:login', { username, password });
    if (!row) return null;
    return rowToUser(row);
  },

  async create(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const row = await (window as any).electronAPI.query('users:create', userData);
    return rowToUser(row);
  },

  async update(id: string, userData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    const row = await (window as any).electronAPI.query('users:update', { id, ...userData });
    return rowToUser(row);
  },

  async delete(id: string): Promise<void> {
    await (window as any).electronAPI.query('users:delete', id);
  },

  async verifyPin(userId: string, pin: string): Promise<boolean> {
    return await (window as any).electronAPI.query('users:verifyPin', { userId, pin });
  },
};
