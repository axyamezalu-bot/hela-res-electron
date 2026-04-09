import { useState, useEffect } from 'react';
import {
  inventoryService,
  wasteServiceElectron,
  type InventoryItem,
  type WasteRecord,
} from '../services/wasteService.electron';

export function useWaste() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [items, waste] = await Promise.all([
        inventoryService.getAll(),
        wasteServiceElectron.getAll(),
      ]);
      setInventoryItems(items);
      setWasteRecords(waste);
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (data: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    const created = await inventoryService.create(data);
    setInventoryItems(prev => [...prev, created]);
    return created;
  };

  const updateItem = async (data: Omit<InventoryItem, 'created_at' | 'updated_at'>) => {
    const updated = await inventoryService.update(data);
    setInventoryItems(prev => prev.map(i => i.id === data.id ? updated : i));
    return updated;
  };

  const deleteItem = async (id: string) => {
    await inventoryService.delete(id);
    setInventoryItems(prev => prev.filter(i => i.id !== id));
  };

  const addStock = async (id: string, amount: number) => {
    const updated = await inventoryService.addStock(id, amount);
    setInventoryItems(prev => prev.map(i => i.id === id ? updated : i));
  };

  const registerWaste = async (data: Omit<WasteRecord, 'id' | 'date'>) => {
    const created = await wasteServiceElectron.create(data);
    setWasteRecords(prev => [created, ...prev]);
    setInventoryItems(prev =>
      prev.map(i => i.id === data.item_id
        ? { ...i, stock: Math.max(0, i.stock - data.quantity) }
        : i
      )
    );
    return created;
  };

  useEffect(() => { fetchAll(); }, []);

  return {
    inventoryItems, wasteRecords, loading,
    createItem, updateItem, deleteItem, addStock, registerWaste,
  };
}