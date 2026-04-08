export type ExpenseCategory = 'Pago a proveedor' | 'Compra de insumos' | 'Otros';

export interface Expense {
  id: string;
  cashRegisterDate: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  userId: string;
  userName: string;
  createdAt: string;
}
