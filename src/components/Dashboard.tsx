import { useEffect, useState } from 'react';
import {
  UtensilsCrossed,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import type { RestaurantTable, Order, Shift } from '../types/restaurant';
import type { InventoryItem } from '../services/wasteService.electron';
import { restaurantService } from '../services/restaurantService';

interface DashboardProps {
  tables: RestaurantTable[];
  activeOrders: Order[];
  activeShift: Shift | null;
  inventoryItems: InventoryItem[];
}

const formatMoney = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const parseDate = (d: string) =>
  new Date(d.includes('T') ? d : d.replace(' ', 'T') + 'Z');

export function Dashboard({ tables, activeOrders, activeShift, inventoryItems }: DashboardProps) {
  const [ordersToday, setOrdersToday] = useState<Order[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!activeShift) {
      setOrdersToday([]);
      return;
    }
    let cancelled = false;
    restaurantService
      .getOrdersByDate(activeShift.date)
      .then((data) => { if (!cancelled) setOrdersToday(data); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [activeShift]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const occupied = tables.filter((t) => t.status !== 'libre').length;
  const totalTables = tables.length;
  const openOrdersCount = activeOrders.filter((o) => o.status === 'abierta').length;
  const shiftSales = ordersToday.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const lowStock = inventoryItems.filter((i) => i.stock <= i.min_stock).length;

  const sortedOrders = [...activeOrders]
    .filter((o) => o.status === 'abierta')
    .sort((a, b) => parseDate(a.opened_at).getTime() - parseDate(b.opened_at).getTime());

  return (
    <div className="space-y-6">
      {/* SECCIÓN 1 — Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-3 rounded-lg ${occupied > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <UtensilsCrossed className={`w-6 h-6 ${occupied > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <div className="text-xs text-gray-500">Mesas ocupadas</div>
              <div className="text-2xl font-bold">{occupied} / {totalTables}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-3 rounded-lg ${openOrdersCount > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <ClipboardList className={`w-6 h-6 ${openOrdersCount > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <div className="text-xs text-gray-500">Órdenes abiertas</div>
              <div className="text-2xl font-bold">{openOrdersCount}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Ventas del turno</div>
              <div className="text-2xl font-bold">
                {activeShift ? formatMoney(shiftSales) : <span className="text-sm text-gray-400 font-normal">Sin turno activo</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-3 rounded-lg ${lowStock > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={`w-6 h-6 ${lowStock > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <div className="text-xs text-gray-500">Alertas de stock</div>
              <div className="text-2xl font-bold">{lowStock}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN 2 — Estado de mesas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mesas en este momento</CardTitle>
        </CardHeader>
        <CardContent>
          {tables.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400">No hay mesas configuradas</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tables.map((t) => {
                const cls =
                  t.status === 'libre'
                    ? 'bg-gray-100 text-gray-700 border-gray-200'
                    : t.status === 'ocupada'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
                return (
                  <Badge key={t.id} variant="outline" className={`${cls} px-3 py-1`}>
                    Mesa {t.number}
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN 3 — Comandas abiertas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comandas abiertas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-2" />
              <p>No hay comandas abiertas</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b text-sm text-gray-500">
                <tr>
                  <th className="text-left p-3">Mesa</th>
                  <th className="text-left p-3">Mesero</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-left p-3">Tiempo abierta</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map((o) => {
                  const opened = parseDate(o.opened_at).getTime();
                  const mins = Math.max(0, Math.floor((now - opened) / 60000));
                  const color =
                    mins < 30 ? 'text-green-600' : mins < 60 ? 'text-yellow-600' : 'text-red-600';
                  return (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-3 font-medium">{o.table_number ?? o.table_name}</td>
                      <td className="p-3 text-gray-600">{o.waiter_name}</td>
                      <td className="p-3 text-right">{formatMoney(Number(o.total) || 0)}</td>
                      <td className={`p-3 ${color} flex items-center gap-1`}>
                        <Clock className="w-4 h-4" />
                        {mins} min
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}