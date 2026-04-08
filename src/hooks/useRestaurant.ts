import { useState, useEffect } from 'react';
import { restaurantService } from '../services/restaurantService';
import type {
  RestaurantTable,
  MenuCategory,
  MenuItem,
  Order,
  Shift,
} from '../types/restaurant';

export function useRestaurant() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, o, c, m, s] = await Promise.all([
        restaurantService.getTables(),
        restaurantService.getActiveOrders(),
        restaurantService.getCategories(),
        restaurantService.getAllMenuItems(),
        restaurantService.getActiveShift(),
      ]);
      setTables(t);
      setActiveOrders(o);
      setMenuCategories(c);
      setMenuItems(m);
      setActiveShift(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos del restaurante');
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    const t = await restaurantService.getTables();
    setTables(t);
  };

  const fetchActiveOrders = async () => {
    const o = await restaurantService.getActiveOrders();
    setActiveOrders(o);
  };

  // Tables
  const createTable = async (data: Parameters<typeof restaurantService.createTable>[0]) => {
    setError(null);
    try {
      const created = await restaurantService.createTable(data);
      setTables(prev => [...prev, created]);
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear mesa';
      setError(msg);
      throw err;
    }
  };

  const updateTablePosition = async (id: string, x: number, y: number) => {
    setError(null);
    setTables(prev => prev.map(t => (t.id === id ? { ...t, x, y } : t)));
    try {
      await restaurantService.updateTablePosition(id, x, y);
    } catch (err) {
      await fetchTables();
      const msg = err instanceof Error ? err.message : 'Error al actualizar posición';
      setError(msg);
      throw err;
    }
  };

  const updateTableStatus = async (id: string, status: RestaurantTable['status']) => {
    setError(null);
    setTables(prev => prev.map(t => (t.id === id ? { ...t, status } : t)));
    try {
      await restaurantService.updateTableStatus(id, status);
    } catch (err) {
      await fetchTables();
      const msg = err instanceof Error ? err.message : 'Error al actualizar estado';
      setError(msg);
      throw err;
    }
  };

  // Orders
  const createOrder = async (data: Parameters<typeof restaurantService.createOrder>[0]) => {
    setError(null);
    try {
      const order = await restaurantService.createOrder(data);
      await Promise.all([fetchTables(), fetchActiveOrders()]);
      return order;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear orden';
      setError(msg);
      throw err;
    }
  };

  const addOrderItem = async (data: Parameters<typeof restaurantService.addOrderItem>[0]) => {
    setError(null);
    try {
      const item = await restaurantService.addOrderItem(data);
      await fetchActiveOrders();
      return item;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al agregar producto';
      setError(msg);
      throw err;
    }
  };

  const removeOrderItem = async (data: Parameters<typeof restaurantService.removeOrderItem>[0]) => {
    setError(null);
    try {
      await restaurantService.removeOrderItem(data);
      await fetchActiveOrders();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar producto';
      setError(msg);
      throw err;
    }
  };

  const sendToKitchen = async (orderId: string) => {
    setError(null);
    try {
      return await restaurantService.sendToKitchen(orderId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al enviar a cocina';
      setError(msg);
      throw err;
    }
  };

  const requestBill = async (tableId: string) => {
    setError(null);
    try {
      await restaurantService.requestBill(tableId);
      await fetchTables();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al pedir cuenta';
      setError(msg);
      throw err;
    }
  };

  const closeOrder = async (data: Parameters<typeof restaurantService.closeOrder>[0]) => {
    setError(null);
    try {
      const order = await restaurantService.closeOrder(data);
      await Promise.all([fetchTables(), fetchActiveOrders()]);
      return order;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cerrar orden';
      setError(msg);
      throw err;
    }
  };

  const cancelOrder = async (data: Parameters<typeof restaurantService.cancelOrder>[0]) => {
    setError(null);
    try {
      await restaurantService.cancelOrder(data);
      await Promise.all([fetchTables(), fetchActiveOrders()]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cancelar orden';
      setError(msg);
      throw err;
    }
  };

  // Shifts
  const openShift = async (data: Parameters<typeof restaurantService.openShift>[0]) => {
    setError(null);
    try {
      const shift = await restaurantService.openShift(data);
      setActiveShift(shift);
      return shift;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al abrir turno';
      setError(msg);
      throw err;
    }
  };

  const closeShift = async (data: Parameters<typeof restaurantService.closeShift>[0]) => {
    setError(null);
    try {
      const shift = await restaurantService.closeShift(data);
      setActiveShift(null);
      return shift;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cerrar turno';
      setError(msg);
      throw err;
    }
  };

  // Menu categories
  const createCategory = async (data: Parameters<typeof restaurantService.createCategory>[0]) => {
    setError(null);
    try {
      const created = await restaurantService.createCategory(data);
      setMenuCategories(prev => [...prev, created]);
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear categoría';
      setError(msg);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    setError(null);
    try {
      await restaurantService.deleteCategory(id);
      setMenuCategories(prev => prev.filter(c => c.id !== id));
      setMenuItems(prev => prev.filter(i => i.category_id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar categoría';
      setError(msg);
      throw err;
    }
  };

  // Menu items
  const createMenuItem = async (data: Parameters<typeof restaurantService.createMenuItem>[0]) => {
    setError(null);
    try {
      const created = await restaurantService.createMenuItem(data);
      const all = await restaurantService.getAllMenuItems();
      setMenuItems(all);
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear producto del menú';
      setError(msg);
      throw err;
    }
  };

  const updateMenuItem = async (data: Parameters<typeof restaurantService.updateMenuItem>[0]) => {
    setError(null);
    try {
      const updated = await restaurantService.updateMenuItem(data);
      const all = await restaurantService.getAllMenuItems();
      setMenuItems(all);
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar producto';
      setError(msg);
      throw err;
    }
  };

  const deleteMenuItem = async (id: string) => {
    setError(null);
    try {
      await restaurantService.deleteMenuItem(id);
      setMenuItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar producto';
      setError(msg);
      throw err;
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return {
    tables,
    activeOrders,
    menuCategories,
    menuItems,
    activeShift,
    loading,
    error,
    fetchAll,
    createTable,
    updateTablePosition,
    updateTableStatus,
    createOrder,
    addOrderItem,
    removeOrderItem,
    sendToKitchen,
    requestBill,
    closeOrder,
    cancelOrder,
    openShift,
    closeShift,
    createCategory,
    deleteCategory,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
  };
}
