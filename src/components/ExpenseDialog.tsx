import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Trash2, Receipt } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { PinAuthDialog } from './PinAuthDialog';
import type { User } from '../App';
import type { Expense, ExpenseCategory } from '../types/expense';

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  users: User[];
  expenses: Expense[];
  onCreateExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>;
  onDeleteExpense: (id: string) => Promise<void>;
}

const CATEGORIES: ExpenseCategory[] = [
  'Pago a proveedor',
  'Compra de insumos',
  'Otros',
];

export function ExpenseDialog({
  open,
  onOpenChange,
  currentUser,
  users,
  expenses,
  onCreateExpense,
  onDeleteExpense,
}: ExpenseDialogProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPinAuth, setShowPinAuth] = useState(false);
  const [pendingExpense, setPendingExpense] = useState<Omit<Expense, 'id' | 'createdAt'> | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const isCajero = currentUser.role === 'Cajero';

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    if (!category) {
      toast.error('Selecciona una categoría');
      return;
    }
    if (!description.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }

    const expenseData: Omit<Expense, 'id' | 'createdAt'> = {
      cashRegisterDate: today,
      amount: parseFloat(amount),
      category: category as ExpenseCategory,
      description: description.trim(),
      userId: currentUser.id,
      userName: currentUser.fullName,
    };

    if (isCajero) {
      setPendingExpense(expenseData);
      setShowPinAuth(true);
      return;
    }

    saveExpense(expenseData);
  };

  const saveExpense = async (data: Omit<Expense, 'id' | 'createdAt'>) => {
    setSaving(true);
    try {
      await onCreateExpense(data);
      toast.success('Gasto registrado exitosamente');
      setAmount('');
      setCategory('');
      setDescription('');
    } catch {
      toast.error('Error al registrar el gasto');
    } finally {
      setSaving(false);
    }
  };

  const handlePinSuccess = () => {
    setShowPinAuth(false);
    if (pendingExpense) {
      saveExpense(pendingExpense);
      setPendingExpense(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteExpense(id);
      toast.success('Gasto eliminado');
    } catch {
      toast.error('Error al eliminar el gasto');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Gastos del Día
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Formulario */}
            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Registrar nuevo gasto
              </p>

              <div className="space-y-2">
                <Label>Monto *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select
                  value={category}
                  onValueChange={v => setCategory(v as ExpenseCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Descripción *
                  {category !== 'Otros' && category !== '' && (
                    <span className="text-xs text-gray-500 ml-1">
                      (ej: nombre del proveedor, artículo comprado)
                    </span>
                  )}
                </Label>
                <Input
                  placeholder={
                    category === 'Pago a proveedor' ? 'Nombre del proveedor...' :
                    category === 'Compra de insumos' ? 'Descripción del insumo...' :
                    'Describe el gasto...'
                  }
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {isCajero && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                  Como Cajero, necesitas autorización de Administrador o Dueño para registrar gastos.
                </p>
              )}

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Registrar Gasto'}
              </Button>
            </div>

            {/* Lista de gastos del día */}
            {expenses.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Gastos registrados hoy
                  </p>
                  <Badge variant="destructive">
                    -${totalExpenses.toFixed(2)} total
                  </Badge>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {expenses.map(expense => (
                    <div key={expense.id}
                      className="flex items-center justify-between p-3 border rounded-lg text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {expense.category}
                          </Badge>
                          <span className="truncate text-gray-600">
                            {expense.description}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {expense.userName} •{' '}
                          {new Date(expense.createdAt).toLocaleTimeString('es-MX',
                            { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className="font-medium text-red-600">
                          -${expense.amount.toFixed(2)}
                        </span>
                        {currentUser.role !== 'Cajero' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expenses.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay gastos registrados hoy
              </p>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PinAuthDialog
        open={showPinAuth}
        onOpenChange={setShowPinAuth}
        users={users}
        onAuthSuccess={handlePinSuccess}
        onAuthCancel={() => {
          setShowPinAuth(false);
          setPendingExpense(null);
        }}
      />
    </>
  );
}
