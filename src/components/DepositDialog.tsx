import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Trash2, ArrowDownCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import type { User } from '../App';
import type { Deposit } from '../types/deposit';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  deposits: Deposit[];
  onCreateDeposit: (data: Omit<Deposit, 'id' | 'createdAt'>) => Promise<Deposit>;
  onDeleteDeposit: (id: string) => Promise<void>;
}

export function DepositDialog({
  open,
  onOpenChange,
  currentUser,
  deposits,
  onCreateDeposit,
  onDeleteDeposit,
}: DepositDialogProps) {
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    if (!concept.trim()) {
      toast.error('El concepto es obligatorio');
      return;
    }

    setSaving(true);
    try {
      await onCreateDeposit({
        cashRegisterDate: today,
        amount: parseFloat(amount),
        concept: concept.trim(),
        userId: currentUser.id,
        userName: currentUser.fullName,
      });
      toast.success('Depósito registrado exitosamente');
      setAmount('');
      setConcept('');
    } catch {
      toast.error('Error al registrar el depósito');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteDeposit(id);
      toast.success('Depósito eliminado');
    } catch {
      toast.error('Error al eliminar el depósito');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-green-600" />
            Depósitos del Día
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Formulario */}
          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Registrar nuevo depósito
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
              <Label>Concepto *</Label>
              <Input
                placeholder="Ej: Fondo adicional, Cambio de turno, Retiro del banco..."
                value={concept}
                onChange={e => setConcept(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Registrar Depósito'}
            </Button>
          </div>

          {/* Lista de depósitos del día */}
          {deposits.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Depósitos registrados hoy
                </p>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  +${totalDeposits.toFixed(2)} total
                </Badge>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {deposits.map(deposit => (
                  <div key={deposit.id}
                    className="flex items-center justify-between p-3 border rounded-lg text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-gray-700 font-medium">
                        {deposit.concept}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {deposit.userName} •{' '}
                        {new Date(deposit.createdAt).toLocaleTimeString('es-MX',
                          { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className="font-medium text-green-600">
                        +${deposit.amount.toFixed(2)}
                      </span>
                      {currentUser.role !== 'Cajero' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-500"
                          onClick={() => handleDelete(deposit.id)}
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

          {deposits.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay depósitos registrados hoy
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
  );
}
