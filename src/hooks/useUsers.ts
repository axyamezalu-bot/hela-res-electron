import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { userServiceElectron } from '../services/userService.electron';
import type { User } from '../App';

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isElectron) {
        const data = await userServiceElectron.getAll();
        setUsers(data);
        return;
      }
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    setError(null);
    try {
      if (isElectron) {
        const newUser = await userServiceElectron.create(user);
        setUsers(prev => [newUser, ...prev]);
        return newUser;
      }
      const created = await userService.create(user);
      setUsers(prev => [...prev, created]);
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear usuario';
      setError(msg);
      throw err;
    }
  };

  const updateUser = async (id: string, user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    setError(null);
    try {
      if (isElectron) {
        const updated = await userServiceElectron.update(id, user);
        setUsers(prev => prev.map(u => u.id === id ? updated : u));
        return updated;
      }
      const updated = await userService.update(id, user);
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar usuario';
      setError(msg);
      throw err;
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    setError(null);
    try {
      if (isElectron) {
        await userServiceElectron.delete(id);
        setUsers(prev => prev.filter(u => u.id !== id));
        return;
      }
      await userService.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar usuario';
      setError(msg);
      throw err;
    }
  };

  const verifyPin = async (userId: string, pin: string): Promise<User | null> => {
    setError(null);
    try {
      if (isElectron) {
        return await userServiceElectron.verifyPin(userId, pin) as any;
      }
      return await userService.verifyPin(pin);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al verificar PIN';
      setError(msg);
      throw err;
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  return { users, loading, error, fetchUsers, addUser, updateUser, deleteUser, verifyPin };
}
