import { useState } from 'react';
import { Button } from './ui/button';
import { AlertTriangle, Calendar } from 'lucide-react';

interface PendingCashDialogProps {
  pendingDate: string;
  totalSales: number;
  totalSalesCount: number;
  onClosePending: () => Promise<void>;
}

export function PendingCashDialog({
  pendingDate,
  totalSales,
  totalSalesCount,
  onClosePending,
}: PendingCashDialogProps) {
  const [closing, setClosing] = useState(false);

  // Agregar hora al parsear para evitar desfase de timezone
  const formattedDate = new Date(pendingDate + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleClose = async () => {
    setClosing(true);
    try {
      await onClosePending();
    } finally {
      setClosing(false);
    }
  };

  return (
    <>
      {/* Backdrop blur */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border-2 border-amber-300">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                </div>
              </div>
              <h2 className="text-2xl">Caja sin cerrar</h2>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
              <p className="text-gray-600 text-sm">
                Hay una caja del {formattedDate} que no fue cerrada.
                Debes cerrarla antes de continuar.
              </p>
            </div>

            {/* Resumen de ventas del día pendiente */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border text-center">
                <p className="text-xs text-gray-500">Ventas registradas</p>
                <p className="text-lg font-medium">{totalSalesCount}</p>
              </div>
              <div className="p-3 rounded-lg border text-center">
                <p className="text-xs text-gray-500">Total del día</p>
                <p className="text-lg font-medium">${totalSales.toFixed(2)}</p>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleClose}
              disabled={closing}
            >
              {closing ? 'Cerrando caja...' : 'Cerrar caja pendiente'}
            </Button>

            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800 text-center">
                Esta acción cerrará la caja del día anterior y generará su reporte.
                Después podrás abrir la caja de hoy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
