import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { AlertCircle, CheckCircle2, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import type { Sale, User as UserType, CashStart } from '../App';
import type { PartialCut } from '../types/partialCut';

interface PartialCutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: UserType;
  cashStartInfo: CashStart | null;
  sales: Sale[];
  previousPartialCuts: PartialCut[];
  onCreatePartialCut: (
    data: Omit<PartialCut, 'id' | 'cutTime' | 'createdAt'>
  ) => Promise<PartialCut>;
}

export function PartialCutDialog({
  open,
  onOpenChange,
  currentUser,
  cashStartInfo,
  sales,
  previousPartialCuts,
  onCreatePartialCut,
}: PartialCutDialogProps) {
  const [physicalCash, setPhysicalCash] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const lastCutTime = previousPartialCuts.length > 0
    ? previousPartialCuts[previousPartialCuts.length - 1].cutTime
    : cashStartInfo?.date ?? today;

  const todaySales = sales.filter(s => {
    const saleDate = new Date(s.date).toISOString().split('T')[0];
    return saleDate === today && s.status !== 'cancelada';
  });

  const shiftSales = previousPartialCuts.length > 0
    ? todaySales.filter(s => new Date(s.date) > new Date(lastCutTime))
    : todaySales;

  const shiftSalesCash = shiftSales
    .filter(s => s.paymentMethod.toLowerCase() !== 'credito' &&
      s.paymentMethod.toLowerCase() !== 'crédito')
    .reduce((sum, s) => sum + s.total, 0);

  const shiftSalesCredit = shiftSales
    .filter(s => s.paymentMethod.toLowerCase() === 'credito' ||
      s.paymentMethod.toLowerCase() === 'crédito')
    .reduce((sum, s) => sum + s.total, 0);

  const initialAmount = cashStartInfo?.startingAmount ?? 0;
  const isFirstCut = previousPartialCuts.length === 0;
  const expectedCash = (isFirstCut ? initialAmount : 0) + shiftSalesCash;

  const physical = parseFloat(physicalCash) || 0;
  const difference = physical - expectedCash;

  const handleCreate = async () => {
    if (!physicalCash) {
      toast.error('Ingresa el efectivo físico contado');
      return;
    }
    setSaving(true);
    try {
      await onCreatePartialCut({
        cashRegisterDate: today,
        cashierId: currentUser.id,
        cashierName: currentUser.fullName,
        initialAmount: isFirstCut ? initialAmount : 0,
        salesCash: shiftSalesCash,
        salesCredit: shiftSalesCredit,
        deposits: 0,
        expenses: 0,
        physicalCash: physical,
        expectedCash,
        difference,
        notes: notes || undefined,
      });
      toast.success('Corte parcial registrado exitosamente');
      setPhysicalCash('');
      setNotes('');
      onOpenChange(false);
    } catch {
      toast.error('Error al registrar el corte parcial');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Corte Parcial de Caja
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info del cajero */}
          <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
            <User className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">{currentUser.fullName}</p>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleString('es-MX', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            <Badge variant="outline" className="ml-auto">
              Corte #{previousPartialCuts.length + 1}
            </Badge>
          </div>

          {/* Resumen del turno */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Ventas de este turno
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Efectivo</p>
                <p className="text-lg font-semibold text-green-600">
                  ${shiftSalesCash.toFixed(2)}
                </p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Crédito</p>
                <p className="text-lg font-semibold text-blue-600">
                  ${shiftSalesCredit.toFixed(2)}
                </p>
              </div>
            </div>

            {isFirstCut && (
              <div className="border rounded-lg p-3 flex justify-between items-center">
                <p className="text-sm text-gray-500">Fondo inicial de caja</p>
                <p className="text-sm font-medium">
                  ${initialAmount.toFixed(2)}
                </p>
              </div>
            )}

            <div className="border rounded-lg p-3 flex justify-between items-center bg-gray-50">
              <p className="text-sm text-gray-600">Efectivo esperado en caja</p>
              <p className="text-sm font-semibold">
                ${expectedCash.toFixed(2)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Arqueo físico */}
          <div className="space-y-2">
            <Label htmlFor="physical-cash">
              Efectivo físico contado *
            </Label>
            <Input
              id="physical-cash"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={physicalCash}
              onChange={e => setPhysicalCash(e.target.value)}
            />
          </div>

          {/* Diferencia */}
          {physicalCash && (
            <div className={`rounded-lg p-3 flex items-center gap-3 ${difference === 0 ? 'bg-green-50 border border-green-200' :
                difference > 0 ? 'bg-blue-50 border border-blue-200' :
                  'bg-red-50 border border-red-200'
              }`}>
              {difference === 0
                ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                : <AlertCircle className={`w-5 h-5 ${difference > 0 ? 'text-blue-500' : 'text-red-500'}`} />
              }
              <div>
                <p className="text-sm font-medium">
                  {difference === 0 && 'Cuadre perfecto'}
                  {difference > 0 && `Sobrante: $${difference.toFixed(2)}`}
                  {difference < 0 && `Faltante: $${Math.abs(difference).toFixed(2)}`}
                </p>
                <p className="text-xs text-gray-500">
                  Esperado ${expectedCash.toFixed(2)} — Físico ${physical.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="cut-notes">Notas (opcional)</Label>
            <Input
              id="cut-notes"
              placeholder="Observaciones del turno..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !physicalCash}
            >
              {saving ? 'Guardando...' : 'Registrar Corte Parcial'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
