import type { CashStart } from '../App';

export const cashRegisterServiceElectron = {
  async getUnclosed(): Promise<CashStart | null> {
    return await (window as any).electronAPI.query('cash:getUnclosed');
  },
  async open(date: string, amount: number, userId: string, userName: string): Promise<CashStart> {
    return await (window as any).electronAPI.query('cash:open', { date, amount, userId, userName });
  },
  async close(date: string): Promise<void> {
    await (window as any).electronAPI.query('cash:close', date);
  },
  async getClosedDates(): Promise<string[]> {
    return await (window as any).electronAPI.query('cash:getClosedDates');
  },
};
