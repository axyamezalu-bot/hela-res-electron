import { useState, useEffect } from 'react';
import { cashRegisterService } from '../services/cashRegisterService';
import { cashRegisterServiceElectron } from '../services/cashRegisterService.electron';
import type { CashStart } from '../App';

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

export function useCashRegister() {
  const [cashStarted, setCashStarted] = useState(false);
  const [cashStartInfo, setCashStartInfo] = useState<CashStart | null>(null);
  const [pendingCash, setPendingCash] = useState<CashStart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Al montar, verificar si existe alguna caja abierta (hoy o de días anteriores)
  const checkTodayStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const unclosed = isElectron
        ? await cashRegisterServiceElectron.getUnclosed()
        : await cashRegisterService.getUnclosed();
      if (unclosed) {
        if (unclosed.date === today) {
          setCashStarted(true);
          setCashStartInfo(unclosed);
          setPendingCash(null);
        } else {
          setCashStarted(false);
          setCashStartInfo(null);
          setPendingCash(unclosed);
        }
      } else {
        setCashStarted(false);
        setCashStartInfo(null);
        setPendingCash(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar estado de caja');
    } finally {
      setLoading(false);
    }
  };

  const openCash = async (
    date: string,
    amount: number,
    userId: string,
    userName: string,
  ): Promise<CashStart> => {
    setError(null);
    try {
      const cashStart = isElectron
        ? await cashRegisterServiceElectron.open(date, amount, userId, userName)
        : await cashRegisterService.open(date, amount, userId, userName);
      setCashStartInfo(cashStart);
      setCashStarted(true);
      return cashStart;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al abrir caja';
      setError(msg);
      throw err;
    }
  };

  const closeCash = async (date: string): Promise<void> => {
    setError(null);
    try {
      if (isElectron) {
        await cashRegisterServiceElectron.close(date);
      } else {
        await cashRegisterService.close(date);
      }
      // Re-verificar estado: puede que quede pendingCash=null y cashStarted=false
      await checkTodayStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cerrar caja';
      setError(msg);
      throw err;
    }
  };

  useEffect(() => { checkTodayStatus(); }, []);

  return { cashStarted, cashStartInfo, pendingCash, loading, error, openCash, closeCash, checkTodayStatus };
}
