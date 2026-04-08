import { useState, useEffect } from 'react';
import { wasteServiceElectron, type WasteRecord } from '../services/wasteService.electron';

export function useWaste() {
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWaste = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await wasteServiceElectron.getAll();
      setWasteRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar mermas');
    } finally {
      setLoading(false);
    }
  };

  const addWaste = async (record: Omit<WasteRecord, 'id' | 'date'>): Promise<void> => {
    setError(null);
    try {
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar merma';
      setError(msg);
      throw err;
    }
  };

  useEffect(() => { fetchWaste(); }, []);

  return { wasteRecords, loading, error, fetchWaste, addWaste };
}
