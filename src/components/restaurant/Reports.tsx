import { useEffect, useState } from 'react';
import { Clock, FileText, Banknote, CreditCard, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import type { Shift, Order } from '../../types/restaurant';
import type { User } from '../../App';
import { restaurantService } from '../../services/restaurantService';

interface ReportsProps {
  activeShift: Shift | null;
  currentUser: User;
  onOpenShift: (data: { date: string; user_id: string; user_name: string }) => Promise<Shift>;
  onCloseShift: (data: { id: string; total_cash: number; total_card: number; total_orders: number }) => Promise<Shift>;
}

const formatDate = (d: string) => {
  const date = new Date(d.includes('T') ? d : d.replace(' ', 'T') + 'Z');
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

const formatTime = (d: string) => {
  const date = new Date(d.includes('T') ? d : d.replace(' ', 'T') + 'Z');
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatMoney = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const formatDuration = (open: string, close: string | null) => {
  if (!close) return 'En curso';
  const o = new Date(open.includes('T') ? open : open.replace(' ', 'T') + 'Z');
  const c = new Date(close.includes('T') ? close : close.replace(' ', 'T') + 'Z');
  const diff = c.getTime() - o.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
};

export function Reports({ activeShift, currentUser, onOpenShift, onCloseShift }: ReportsProps) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Turno Actual</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <CurrentShiftTab
            activeShift={activeShift}
            currentUser={currentUser}
            onOpenShift={onOpenShift}
            onCloseShift={onCloseShift}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CurrentShiftTab({ activeShift, currentUser, onOpenShift, onCloseShift }: ReportsProps) {
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [ordersToday, setOrdersToday] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [salesByWaiter, setSalesByWaiter] = useState<Array<{
    waiter_name: string;
    waiter_id: string;
    total_orders: number;
    total_amount: number;
    avg_ticket: number;
  }>>([]);

  const isAdmin = currentUser.role === 'Dueño' || currentUser.role === 'Administrador';

  useEffect(() => {
    if (!activeShift) {
      setOrdersToday([]);
      setSalesByWaiter([]);
      return;
    }
    let cancelled = false;
    setLoadingOrders(true);
    Promise.all([
      restaurantService.getOrdersByDate(activeShift.date),
      restaurantService.getSalesByWaiter(activeShift.date),
    ])
      .then(([orders, byWaiter]) => {
        if (cancelled) return;
        setOrdersToday(orders);
        setSalesByWaiter(byWaiter);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Error al cargar órdenes');
      })
      .finally(() => { if (!cancelled) setLoadingOrders(false); });
    return () => { cancelled = true; };
  }, [activeShift]);

  const handleOpen = async () => {
    setOpening(true);
    try {
      await onOpenShift({
        date: new Date().toISOString().split('T')[0],
        user_id: currentUser.id,
        user_name: currentUser.fullName,
      });
      toast.success('Turno abierto');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al abrir turno');
    } finally {
      setOpening(false);
    }
  };

  const totals = ordersToday.reduce(
    (acc, o) => {
      const total = Number(o.total) || 0;
      if (o.payment_method === 'efectivo') acc.cash += total;
      else if (o.payment_method === 'tarjeta') acc.card += total;
      else acc.other += total;
      return acc;
    },
    { cash: 0, card: 0, other: 0 }
  );
  const grand = totals.cash + totals.card + totals.other;

  const handleConfirmClose = async () => {
    if (!activeShift) return;
    setClosing(true);
    try {
      await onCloseShift({
        id: activeShift.id,
        total_cash: totals.cash,
        total_card: totals.card,
        total_orders: ordersToday.length,
      });
      toast.success('Turno cerrado exitosamente');
      setConfirmClose(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cerrar turno');
    } finally {
      setClosing(false);
    }
  };

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-500">
        <Clock className="w-20 h-20 text-gray-300" />
        <div className="text-center space-y-1">
          <p className="text-lg font-medium text-gray-700">No hay turno activo</p>
          <p className="text-sm">Abre un turno para comenzar a registrar ventas</p>
        </div>
        <Button onClick={handleOpen} disabled={opening}>
          {opening ? 'Abriendo...' : 'Abrir Turno'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="text-lg font-semibold">Turno del {formatDate(activeShift.date)}</div>
            <div className="text-sm text-gray-600">Abierto por: {activeShift.user_name}</div>
            <div className="text-sm text-gray-600">Hora de apertura: {formatTime(activeShift.opened_at)}</div>
          </div>
          <Badge className="bg-green-600 hover:bg-green-600 text-white">Turno Activo</Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={Receipt} label="Órdenes cobradas" value={ordersToday.length.toString()} />
        <SummaryCard icon={Banknote} label="Total Efectivo" value={formatMoney(totals.cash)} />
        <SummaryCard icon={CreditCard} label="Total Tarjeta" value={formatMoney(totals.card)} />
        <SummaryCard icon={FileText} label="Gran Total" value={formatMoney(grand)} highlight />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Órdenes del día</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingOrders ? (
            <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
          ) : ordersToday.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Receipt className="w-12 h-12 mx-auto mb-2" />
              <p>Sin ventas en este turno</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b text-sm text-gray-500">
                <tr>
                  <th className="text-left p-3">Mesa</th>
                  <th className="text-left p-3">Mesero</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-left p-3">Método</th>
                  <th className="text-left p-3">Hora cierre</th>
                </tr>
              </thead>
              <tbody>
                {ordersToday.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3 font-medium">{o.table_number ?? o.table_name}</td>
                    <td className="p-3 text-gray-600">{o.waiter_name}</td>
                    <td className="p-3 text-right">{formatMoney(Number(o.total) || 0)}</td>
                    <td className="p-3 capitalize">{o.payment_method ?? '—'}</td>
                    <td className="p-3 text-gray-600">{o.closed_at ? formatTime(o.closed_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ventas por Mesero</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {salesByWaiter.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              Sin ventas registradas en este turno
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b text-sm text-gray-500">
                <tr>
                  <th className="text-left p-3">Mesero</th>
                  <th className="text-right p-3">Órdenes atendidas</th>
                  <th className="text-right p-3">Total vendido</th>
                  <th className="text-right p-3">Ticket promedio</th>
                </tr>
              </thead>
              <tbody>
                {salesByWaiter.map((w) => (
                  <tr key={w.waiter_id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3 font-medium">{w.waiter_name}</td>
                    <td className="p-3 text-right">{w.total_orders}</td>
                    <td className="p-3 text-right">{formatMoney(Number(w.total_amount) || 0)}</td>
                    <td className="p-3 text-right">{formatMoney(Number(w.avg_ticket) || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <div className="flex justify-end">
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => setConfirmClose(true)}
          >
            Cerrar Turno
          </Button>
        </div>
      )}

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar turno?</AlertDialogTitle>
            <AlertDialogDescription>
              Se registrarán {ordersToday.length} órdenes por {formatMoney(grand)} total.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={closing}
              onClick={(e) => { e.preventDefault(); handleConfirmClose(); }}
              className="bg-red-600 hover:bg-red-700"
            >
              Cerrar turno
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-green-500' : ''}>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`w-8 h-8 ${highlight ? 'text-green-600' : 'text-gray-400'}`} />
        <div>
          <div className="text-xs text-gray-500">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryTab() {
  const [history, setHistory] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    restaurantService
      .getShiftHistory()
      .then((data) => { if (!cancelled) setHistory(data); })
      .catch((err) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Error al cargar historial');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-400 text-sm">Cargando historial...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <FileText className="w-16 h-16 mx-auto mb-3" />
        <p>No hay turnos registrados</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="border-b text-sm text-gray-500">
            <tr>
              <th className="text-left p-3">Fecha</th>
              <th className="text-left p-3">Abierto por</th>
              <th className="text-right p-3">Órdenes</th>
              <th className="text-right p-3">Efectivo</th>
              <th className="text-right p-3">Tarjeta</th>
              <th className="text-right p-3">Total</th>
              <th className="text-left p-3">Duración</th>
              <th className="text-left p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {history.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-3 font-medium">{formatDate(s.date)}</td>
                <td className="p-3 text-gray-600">{s.user_name}</td>
                <td className="p-3 text-right">{s.total_orders}</td>
                <td className="p-3 text-right">{formatMoney(Number(s.total_cash) || 0)}</td>
                <td className="p-3 text-right">{formatMoney(Number(s.total_card) || 0)}</td>
                <td className="p-3 text-right font-semibold">{formatMoney(Number(s.grand_total) || 0)}</td>
                <td className="p-3 text-gray-600">{formatDuration(s.opened_at, s.closed_at ?? null)}</td>
                <td className="p-3">
                  {s.active ? (
                    <Badge className="bg-green-600 hover:bg-green-600 text-white">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Cerrado</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}