import { useMemo, useState } from 'react';
import { Loader2, Minus, Plus, Trash2, ChefHat, Receipt, DollarSign, Ban, CreditCard } from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import type {
  RestaurantTable,
  Order,
  OrderItem,
  MenuCategory,
  MenuItem,
} from '../../types/restaurant';
import type { User } from '../../App';

interface OrderPanelProps {
  table: RestaurantTable;
  order: Order | null;
  orderItems: OrderItem[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  currentUser: User;
  onCreateOrder: () => Promise<void>;
  onAddItem: (item: MenuItem, quantity: number, notes?: string) => Promise<void>;
  onRemoveItem: (item: OrderItem) => Promise<void>;
  onSendToKitchen: () => Promise<OrderItem[]>;
  onRequestBill: () => Promise<void>;
  onCloseOrder: (paymentMethod: string) => Promise<void>;
  onCancelOrder: () => Promise<void>;
  onClose: () => void;
  onPrintKitchenTicket: (items: OrderItem[]) => void;
}

const STATUS_LABELS: Record<RestaurantTable['status'], { label: string; className: string }> = {
  libre: { label: 'Libre', className: 'bg-green-100 text-green-700 border-green-300' },
  ocupada: { label: 'Ocupada', className: 'bg-red-100 text-red-700 border-red-300' },
  cuenta_pedida: { label: 'Cuenta pedida', className: 'bg-amber-100 text-amber-700 border-amber-300' },
};

export function OrderPanel(props: OrderPanelProps) {
  const {
    table,
    order,
    orderItems,
    menuCategories,
    menuItems,
    currentUser,
    onCreateOrder,
    onAddItem,
    onRemoveItem,
    onSendToKitchen,
    onRequestBill,
    onCloseOrder,
    onCancelOrder,
    onClose,
    onPrintKitchenTicket,
  } = props;

  const [loading, setLoading] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'order'>('menu');
  const [payStep, setPayStep] = useState<'method' | 'cash' | 'card' | 'split'>('method');
  const [cashReceived, setCashReceived] = useState('');
  const [splitParts, setSplitParts] = useState(2);
  const [splitMethod, setSplitMethod] = useState<'Efectivo' | 'Tarjeta'>('Efectivo');
  const [splitCardConfirm, setSplitCardConfirm] = useState(false);

  const isMesero = currentUser.role === 'Mesero';
  const status = STATUS_LABELS[table.status];

  const pending = orderItems.filter(i => i.sent_to_kitchen === 0);
  const inKitchen = orderItems.filter(i => i.sent_to_kitchen === 1);
  const total = orderItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const itemQtyByMenuId = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of orderItems) {
      if (it.menu_item_id) {
        map.set(it.menu_item_id, (map.get(it.menu_item_id) ?? 0) + it.quantity);
      }
    }
    return map;
  }, [orderItems]);

  const wrap = async (fn: () => Promise<void>) => {
    setLoading(true);
    try { await fn(); } finally { setLoading(false); }
  };

  const handleCreate = () => wrap(() => onCreateOrder());

  const handleAdd = (item: MenuItem) => wrap(() => onAddItem(item, 1));

  const handleIncrement = (oi: OrderItem) => {
    const menu = menuItems.find(m => m.id === oi.menu_item_id);
    if (!menu) return;
    return wrap(() => onAddItem(menu, 1));
  };

  const handleDecrement = (oi: OrderItem) =>
    wrap(() => onRemoveItem({ ...oi, quantity: 1 }));

  const handleRemove = (oi: OrderItem) =>
    wrap(() => onRemoveItem(oi));

  const handleSend = () =>
    wrap(async () => {
      const sent = await onSendToKitchen();
      if (sent.length > 0) onPrintKitchenTicket(sent);
    });

  const handleRequestBill = () => wrap(() => onRequestBill());

  const formatMoney = (n: number) =>
    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  const resetPayState = () => {
    setPayStep('method');
    setCashReceived('');
    setSplitParts(2);
    setSplitMethod('Efectivo');
    setSplitCardConfirm(false);
  };

  const closePayDialog = (open: boolean) => {
    setPayOpen(open);
    if (!open) resetPayState();
  };

  const handleConfirmCash = () =>
    wrap(async () => {
      restaurantService.openCashDrawer().catch(() => { });
      await onCloseOrder('Efectivo');
      setPayOpen(false);
      resetPayState();
    });

  const handleConfirmCard = () =>
    wrap(async () => {
      await onCloseOrder('Tarjeta');
      setPayOpen(false);
      resetPayState();
    });

  const handleConfirmSplit = () =>
    wrap(async () => {
      if (splitMethod === 'Efectivo') {
        restaurantService.openCashDrawer().catch(() => { });
      }
      await onCloseOrder(`dividido-${splitParts}-${splitMethod}`);
      setPayOpen(false);
      resetPayState();
    });

  const perPerson = splitParts > 0 ? Math.ceil((total / splitParts) * 100) / 100 : 0;
  const cashNum = parseFloat(cashReceived) || 0;
  const change = cashNum - total;
  const cashValid = cashReceived !== '' && cashNum >= total;
  const addToCash = (amount: number) => {
    const next = (parseFloat(cashReceived) || 0) + amount;
    setCashReceived(next.toFixed(2));
  };
  const dialogTitle =
    payStep === 'method' ? `Cobrar Mesa ${table.number}` :
      payStep === 'cash' ? 'Cobro en Efectivo' :
        payStep === 'card' ? 'Cobro con Tarjeta' :
          'Dividir Cuenta';

  const handleCancel = () =>
    wrap(async () => {
      await onCancelOrder();
      setCancelOpen(false);
    });

  const firstCategoryId = menuCategories[0]?.id ?? '';

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between gap-2 pr-6">
            <SheetTitle className="text-left">
              Mesa {table.number} — {table.name}
            </SheetTitle>
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
          </div>
        </SheetHeader>

        {!order ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
            <p className="text-gray-500">Mesa disponible</p>
            <Button size="lg" className="w-full" onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Abrir Mesa y Tomar Orden
            </Button>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'menu' | 'order')} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mx-4 mt-4 grid grid-cols-2">
                <TabsTrigger value="menu">Menú</TabsTrigger>
                <TabsTrigger value="order">
                  Comanda {orderItems.length > 0 && <Badge className="ml-2" variant="secondary">{orderItems.length}</Badge>}
                </TabsTrigger>
              </TabsList>

              {/* MENU TAB */}
              <TabsContent value="menu" className="flex-1 overflow-hidden mt-2">
                {menuCategories.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    No hay categorías en el menú. Crea categorías y platillos en Administrar Menú.
                  </div>
                ) : (
                  <Tabs defaultValue={firstCategoryId} className="flex flex-col h-full">
                    <ScrollArea className="w-full">
                      <TabsList className="mx-4 inline-flex w-auto">
                        {menuCategories.map(cat => (
                          <TabsTrigger key={cat.id} value={cat.id} style={{ borderBottom: `2px solid ${cat.color}` }}>
                            {cat.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </ScrollArea>
                    {menuCategories.map(cat => {
                      const items = menuItems.filter(m => m.category_id === cat.id && m.available === 1);
                      return (
                        <TabsContent key={cat.id} value={cat.id} className="flex-1 overflow-hidden mt-2">
                          <ScrollArea className="h-full px-4 pb-4">
                            <div className="grid grid-cols-2 gap-2">
                              {items.map(item => {
                                const qty = itemQtyByMenuId.get(item.id) ?? 0;
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => handleAdd(item)}
                                    disabled={loading}
                                    className="relative text-left border rounded-md p-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                  >
                                    {qty > 0 && (
                                      <Badge className="absolute top-1 right-1 bg-blue-600 hover:bg-blue-600">
                                        {qty}
                                      </Badge>
                                    )}
                                    <div className="font-medium text-sm pr-6">{item.name}</div>
                                    <div className="text-sm text-gray-600 mt-1">${item.price.toFixed(2)}</div>
                                  </button>
                                );
                              })}
                              {items.length === 0 && (
                                <div className="col-span-2 text-center text-sm text-gray-400 py-6">
                                  Sin platillos en esta categoría
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                )}
              </TabsContent>

              {/* ORDER TAB */}
              <TabsContent value="order" className="flex-1 overflow-hidden mt-2">
                <ScrollArea className="h-full px-4 pb-4">
                  {orderItems.length === 0 && (
                    <div className="text-center text-sm text-gray-400 py-10">
                      Comanda vacía
                    </div>
                  )}
                  {pending.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs uppercase text-gray-500 font-semibold mb-2">Por enviar a cocina</h4>
                      <div className="space-y-2">
                        {pending.map(item => (
                          <OrderLine
                            key={item.id}
                            item={item}
                            editable
                            disabled={loading}
                            onIncrement={() => handleIncrement(item)}
                            onDecrement={() => handleDecrement(item)}
                            onRemove={() => handleRemove(item)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {inKitchen.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase text-gray-500 font-semibold mb-2">En cocina / entregados</h4>
                      <div className="space-y-2">
                        {inKitchen.map(item => (
                          <OrderLine key={item.id} item={item} editable={false} />
                        ))}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="border-t p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total</span>
                <span className="text-2xl font-bold">${total.toFixed(2)}</span>
              </div>
              <div className="flex flex-col gap-2">
                {pending.length > 0 && (
                  <Button onClick={handleSend} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChefHat className="w-4 h-4 mr-2" />}
                    Enviar a Cocina
                  </Button>
                )}
                {order.status === 'abierta' && total > 0 && (
                  <Button onClick={handleRequestBill} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-gray-900">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Receipt className="w-4 h-4 mr-2" />}
                    Pedir Cuenta
                  </Button>
                )}
                {order.status === 'abierta' && total > 0 && (
                  <Button onClick={() => setPayOpen(true)} disabled={loading} className="bg-green-600 hover:bg-green-700">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Cobrar
                  </Button>
                )}
                {!isMesero && (
                  <Button
                    variant="ghost"
                    onClick={() => setCancelOpen(true)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Cancelar Orden
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Pay dialog */}
        <Dialog open={payOpen} onOpenChange={closePayDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>

            {payStep === 'method' && (
              <div className="grid grid-cols-3 gap-3 py-4">
                <Button variant="outline" className="h-20 flex-col" disabled={loading} onClick={() => setPayStep('cash')}>
                  <DollarSign className="w-6 h-6 mb-1" />
                  Efectivo
                </Button>
                <Button variant="outline" className="h-20 flex-col" disabled={loading} onClick={() => setPayStep('card')}>
                  <CreditCard className="w-6 h-6 mb-1" />
                  Tarjeta
                </Button>
                <Button variant="outline" className="h-20 flex-col" disabled={loading} onClick={() => setPayStep('split')}>
                  <Receipt className="w-6 h-6 mb-1" />
                  Dividir
                </Button>
              </div>
            )}

            {payStep === 'cash' && (
              <div className="space-y-4 py-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Total a cobrar</div>
                  <div className="text-3xl font-bold text-green-600">{formatMoney(total)}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dinero recibido del cliente</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={total}
                    autoFocus
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0.00"
                    className="text-xl h-12"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 200, 500].map((v) => (
                      <Button
                        key={v}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addToCash(v)}
                      >
                        +${v}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="text-center p-3 rounded-md bg-gray-50">
                  {cashReceived === '' ? (
                    <div className="text-sm text-gray-400">Ingresa el monto recibido</div>
                  ) : cashNum >= total ? (
                    <>
                      <div className="text-sm text-gray-600">Cambio</div>
                      <div className="text-2xl font-bold text-green-600">{formatMoney(change)}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-gray-600">Falta</div>
                      <div className="text-2xl font-bold text-red-600">{formatMoney(total - cashNum)}</div>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setPayStep('method')} disabled={loading}>
                    Regresar
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={loading || !cashValid}
                    onClick={handleConfirmCash}
                  >
                    Confirmar cobro
                  </Button>
                </div>
              </div>
            )}

            {payStep === 'card' && (
              <div className="space-y-4 py-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Total a cobrar</div>
                  <div className="text-3xl font-bold">{formatMoney(total)}</div>
                </div>
                <div className="flex flex-col items-center gap-3 py-4">
                  <CreditCard className="w-16 h-16 text-blue-600" />
                  <p className="text-center font-medium">
                    Confirma que el cobro con tarjeta fue realizado correctamente
                  </p>
                  <p className="text-center text-sm text-gray-500">
                    Verifica el comprobante de la terminal antes de confirmar
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setPayStep('method')} disabled={loading}>
                    Regresar
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={loading}
                    onClick={handleConfirmCard}
                  >
                    Cobro confirmado ✓
                  </Button>
                </div>
              </div>
            )}

            {payStep === 'split' && !splitCardConfirm && (
              <div className="space-y-4 py-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Total</div>
                  <div className="text-2xl font-bold">{formatMoney(total)}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">¿En cuántas partes?</label>
                  <Input
                    type="number"
                    min={2}
                    max={20}
                    value={splitParts}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) setSplitParts(Math.min(20, Math.max(2, v)));
                    }}
                  />
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-md">
                  <div className="text-sm text-gray-600">{splitParts} personas</div>
                  <div className="text-2xl font-bold">{formatMoney(perPerson)} cada una</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Método de pago</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={splitMethod === 'Efectivo' ? 'default' : 'outline'}
                      onClick={() => setSplitMethod('Efectivo')}
                    >
                      <DollarSign className="w-4 h-4 mr-2" /> Efectivo
                    </Button>
                    <Button
                      type="button"
                      variant={splitMethod === 'Tarjeta' ? 'default' : 'outline'}
                      onClick={() => setSplitMethod('Tarjeta')}
                    >
                      <CreditCard className="w-4 h-4 mr-2" /> Tarjeta
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setPayStep('method')} disabled={loading}>
                    Regresar
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={loading}
                    onClick={() => {
                      if (splitMethod === 'Tarjeta') setSplitCardConfirm(true);
                      else handleConfirmSplit();
                    }}
                  >
                    Confirmar cobro dividido
                  </Button>
                </div>
              </div>
            )}

            {payStep === 'split' && splitCardConfirm && (
              <div className="space-y-4 py-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500">{splitParts} × {formatMoney(perPerson)}</div>
                  <div className="text-3xl font-bold">{formatMoney(total)}</div>
                </div>
                <div className="flex flex-col items-center gap-3 py-4">
                  <CreditCard className="w-16 h-16 text-blue-600" />
                  <p className="text-center font-medium">
                    Confirma que los cobros con tarjeta fueron realizados correctamente
                  </p>
                  <p className="text-center text-sm text-gray-500">
                    Verifica los comprobantes de la terminal antes de confirmar
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setSplitCardConfirm(false)} disabled={loading}>
                    Regresar
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={loading}
                    onClick={handleConfirmSplit}
                  >
                    Cobro confirmado ✓
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel confirm */}
        <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar esta orden?</AlertDialogTitle>
              <AlertDialogDescription>
                La mesa quedará libre y los platillos enviados a cocina deberán manejarse manualmente.
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Volver</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); handleCancel(); }}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                Sí, cancelar orden
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

interface OrderLineProps {
  item: OrderItem;
  editable: boolean;
  disabled?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onRemove?: () => void;
}

function OrderLine({ item, editable, disabled, onIncrement, onDecrement, onRemove }: OrderLineProps) {
  return (
    <div className={`border rounded-md p-3 ${editable ? 'bg-white' : 'bg-gray-50 opacity-80'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{item.menu_item_name}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            ${item.unit_price.toFixed(2)} c/u · ${(item.unit_price * item.quantity).toFixed(2)}
          </div>
        </div>
        {editable ? (
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-7 w-7" disabled={disabled} onClick={onDecrement}>
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
            <Button size="icon" variant="outline" className="h-7 w-7" disabled={disabled} onClick={onIncrement}>
              <Plus className="w-3 h-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" disabled={disabled} onClick={onRemove}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <span className="text-sm font-medium">×{item.quantity}</span>
        )}
      </div>
      {editable && (
        <Input
          placeholder="Notas (opcional)"
          defaultValue={item.notes ?? ''}
          className="h-7 text-xs mt-2"
          disabled={disabled}
        />
      )}
    </div>
  );
}
