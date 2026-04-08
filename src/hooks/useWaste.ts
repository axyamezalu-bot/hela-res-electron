import { useState, useEffect } from 'react';
import { wasteService, type WasteRecord } from '../services/wasteService';
import { wasteServiceElectron } from '../services/wasteService.electron';

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

export function useWaste() {
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWaste = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isElectron) {
        const data = await wasteServiceElectron.getAll();
        setWasteRecords(data);
        return;
      }
      const data = await wasteService.getAll();
      setWasteRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar mermas');
    } finally {
      setLoading(false);
    }
  };

  const addWaste = async (record: Omit<WasteRecord, 'id'>): Promise<void> => {
    setError(null);
    try {
      if (isElectron) {
        const created = await wasteServiceElectron.create({
          productId: record.productId ?? '',
          productName: record.productName,
          productCode: record.productCode,
          quantity: record.quantity,
          reason: record.reason,
          userId: record.userId ?? '',
          userName: record.userName,
        });
        setWasteRecords(prev => [created, ...prev]);
        return;
      }
      const created = await wasteService.create(record);
      setWasteRecords(prev => [created, ...prev]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar merma';
      setError(msg);
      throw err;
    }
  };

  const fetchByMonth = async (year: number, month: number): Promise<WasteRecord[]> => {
    setError(null);
    try {
      return await wasteService.getByMonth(year, month);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar mermas del mes';
      setError(msg);
      throw err;
    }
  };

  useEffect(() => { fetchWaste(); }, []);

  return { wasteRecords, loading, error, fetchWaste, addWaste, fetchByMonth };
}
