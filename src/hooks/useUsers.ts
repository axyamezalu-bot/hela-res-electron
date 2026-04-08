import { useState, useEffect } from 'react';
import { userServiceElectron } from '../services/userService.electron';
import type { User } from '../App';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userServiceElectron.getAll();
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
      const newUser = await userServiceElectron.create(user);
      setUsers(prev => [newUser, ...prev]);
      return newUser;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear usuario';
      setError(msg);
      throw err;
    }
  };

  const updateUser = async (id: string, user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    setError(null);
    try {
      const updated = await userServiceElectron.update(id, user);
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
      await userServiceElectron.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar usuario';
      setError(msg);
      throw err;
    }
  };

  const verifyPin = async (userId: string, pin: string): Promise<boolean> => {
    setError(null);
    try {
      return await userServiceElectron.verifyPin(userId, pin);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al verificar PIN';
      setError(msg);
      throw err;
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  return { users, loading, error, fetchUsers, addUser, updateUser, deleteUser, verifyPin };
}
