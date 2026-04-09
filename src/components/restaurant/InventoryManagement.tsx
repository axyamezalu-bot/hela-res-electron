import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Pencil,
  Trash2,
  PackageMinus,
  PackagePlus,
  PackageOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
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
import type { InventoryItem, WasteRecord } from '../../services/wasteService.electron';
import type { User } from '../../App';

interface InventoryManagementProps {
  inventoryItems: InventoryItem[];
  wasteRecords: WasteRecord[];
  currentUser: User;
  onCreateItem: (data: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => Promise<InventoryItem>;
  onUpdateItem: (data: Omit<InventoryItem, 'created_at' | 'updated_at'>) => Promise<InventoryItem>;
  onDeleteItem: (id: string) => Promise<void>;
  onAddStock: (id: string, amount: number) => Promise<void>;
  onRegisterWaste: (data: Omit<WasteRecord, 'id' | 'date'>) => Promise<WasteRecord>;
}

const UNITS: InventoryItem['unit'][] = ['unidad', 'kg', 'g', 'l', 'ml'];
const REASONS = ['Vencido', 'Derramado', 'Robado', 'Dañado', 'Otro'];

const itemSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  unit: z.enum(['unidad', 'kg', 'g', 'l', 'ml']),
  stock: z.number().min(0, 'No puede ser negativo'),
  min_stock: z.number().min(0, 'No puede ser negativo'),
});
type ItemFormValues = z.infer<typeof itemSchema>;

function formatDate(d: string) {
  const date = new Date(d.includes('T') ? d : d.replace(' ', 'T') + 'Z');
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function InventoryManagement({
  inventoryItems,
  wasteRecords,
  currentUser,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onAddStock,
  onRegisterWaste,
}: InventoryManagementProps) {
  const isMesero = currentUser.role === 'Mesero';

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stockTarget, setStockTarget] = useState<InventoryItem | null>(null);
  const [wasteTarget, setWasteTarget] = useState<InventoryItem | null>(null);

  const openNew = () => {
    setEditing(null);
    setItemDialogOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setItemDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await onDeleteItem(confirmDelete.id);
      toast.success(`Insumo ${confirmDelete.name} eliminado`);
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar insumo');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="waste">Mermas</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Inventario</h1>
            {!isMesero && (
              <Button onClick={openNew}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar Insumo
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {inventoryItems.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <PackageOpen className="w-16 h-16 mx-auto mb-3" />
                  <p>No hay insumos registrados</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="border-b text-sm text-gray-500">
                    <tr>
                      <th className="text-left p-3">Nombre</th>
                      <th className="text-left p-3">Unidad</th>
                      <th className="text-right p-3">Stock</th>
                      <th className="text-right p-3">Mínimo</th>
                      <th className="text-right p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryItems.map((i) => {
                      const low = i.stock <= i.min_stock;
                      return (
                        <tr key={i.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="p-3 font-medium">{i.name}</td>
                          <td className="p-3">
                            <Badge variant="outline">{i.unit}</Badge>
                          </td>
                          <td className={`p-3 text-right ${low ? 'text-red-600 font-semibold' : ''}`}>
                            {i.stock}
                          </td>
                          <td className="p-3 text-right text-gray-600">{i.min_stock}</td>
                          <td className="p-3 text-right">
                            {!isMesero && (
                              <div className="inline-flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Agregar stock"
                                  onClick={() => setStockTarget(i)}
                                >
                                  <PackagePlus className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Registrar merma"
                                  onClick={() => setWasteTarget(i)}
                                >
                                  <PackageMinus className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Editar"
                                  onClick={() => openEdit(i)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-red-600"
                                  title="Eliminar"
                                  onClick={() => setConfirmDelete(i)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waste" className="space-y-4">
          <h1 className="text-xl font-semibold">Mermas</h1>
          <Card>
            <CardContent className="p-0">
              {wasteRecords.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <PackageMinus className="w-16 h-16 mx-auto mb-3" />
                  <p>No hay mermas registradas</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="border-b text-sm text-gray-500">
                    <tr>
                      <th className="text-left p-3">Insumo</th>
                      <th className="text-right p-3">Cantidad</th>
                      <th className="text-left p-3">Motivo</th>
                      <th className="text-left p-3">Registrado por</th>
                      <th className="text-left p-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteRecords.map((w) => (
                      <tr key={w.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-3 font-medium">{w.item_name}</td>
                        <td className="p-3 text-right">
                          {w.quantity} {w.unit ?? ''}
                        </td>
                        <td className="p-3">{w.reason}</td>
                        <td className="p-3 text-gray-600">{w.user_name}</td>
                        <td className="p-3 text-gray-600">{formatDate(w.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        editing={editing}
        onCreateItem={onCreateItem}
        onUpdateItem={onUpdateItem}
      />

      <AddStockDialog
        item={stockTarget}
        onClose={() => setStockTarget(null)}
        onAddStock={onAddStock}
      />

      <WasteDialog
        item={wasteTarget}
        currentUser={currentUser}
        onClose={() => setWasteTarget(null)}
        onRegisterWaste={onRegisterWaste}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {confirmDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: InventoryItem | null;
  onCreateItem: InventoryManagementProps['onCreateItem'];
  onUpdateItem: InventoryManagementProps['onUpdateItem'];
}

function ItemDialog({ open, onOpenChange, editing, onCreateItem, onUpdateItem }: ItemDialogProps) {
  const isEdit = !!editing;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema) as any,
    values: editing
      ? {
          name: editing.name,
          unit: editing.unit,
          stock: editing.stock,
          min_stock: editing.min_stock,
        }
      : {
          name: '',
          unit: 'unidad',
          stock: 0,
          min_stock: 0,
        },
  });

  const unit = watch('unit');

  const onSubmit = async (values: ItemFormValues) => {
    try {
      if (isEdit && editing) {
        await onUpdateItem({
          id: editing.id,
          name: values.name,
          unit: values.unit,
          stock: values.stock,
          min_stock: values.min_stock,
        });
        toast.success('Insumo actualizado');
      } else {
        await onCreateItem({
          name: values.name,
          unit: values.unit,
          stock: values.stock,
          min_stock: values.min_stock,
        });
        toast.success('Insumo creado');
      }
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar insumo');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar Insumo' : 'Nuevo Insumo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="i-name">Nombre</Label>
              <Input id="i-name" {...register('name')} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select
                value={unit}
                onValueChange={(v) => setValue('unit', v as ItemFormValues['unit'], { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isEdit && (
              <div className="space-y-2">
                <Label htmlFor="i-stock">Stock inicial</Label>
                <Input
                  id="i-stock"
                  type="number"
                  step="any"
                  {...register('stock', { valueAsNumber: true })}
                />
                {errors.stock && <p className="text-xs text-red-600">{errors.stock.message}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="i-min">Stock mínimo</Label>
              <Input
                id="i-min"
                type="number"
                step="any"
                {...register('min_stock', { valueAsNumber: true })}
              />
              {errors.min_stock && <p className="text-xs text-red-600">{errors.min_stock.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Guardar cambios' : 'Crear insumo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface AddStockDialogProps {
  item: InventoryItem | null;
  onClose: () => void;
  onAddStock: (id: string, amount: number) => Promise<void>;
}

function AddStockDialog({ item, onClose, onAddStock }: AddStockDialogProps) {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!item || isNaN(n) || n <= 0) {
      toast.error('Cantidad inválida');
      return;
    }
    setSubmitting(true);
    try {
      await onAddStock(item.id, n);
      toast.success(`Stock actualizado: ${item.name}`);
      setAmount('');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al agregar stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(v) => { if (!v) { setAmount(''); onClose(); } }}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agregar stock — {item?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-amount">Cantidad a agregar ({item?.unit})</Label>
              <Input
                id="add-amount"
                type="number"
                step="any"
                min="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>Confirmar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface WasteDialogProps {
  item: InventoryItem | null;
  currentUser: User;
  onClose: () => void;
  onRegisterWaste: InventoryManagementProps['onRegisterWaste'];
}

function WasteDialog({ item, currentUser, onClose, onRegisterWaste }: WasteDialogProps) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState<string>('Vencido');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(quantity);
    if (!item || isNaN(n) || n <= 0) {
      toast.error('Cantidad inválida');
      return;
    }
    if (n > item.stock) {
      toast.error('Cantidad mayor al stock disponible');
      return;
    }
    setSubmitting(true);
    try {
      await onRegisterWaste({
        item_id: item.id,
        item_name: item.name,
        quantity: n,
        reason,
        user_id: currentUser.id,
        user_name: currentUser.fullName,
      });
      toast.success('Merma registrada');
      setQuantity('');
      setReason('Vencido');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar merma');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(v) => { if (!v) { setQuantity(''); setReason('Vencido'); onClose(); } }}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar merma — {item?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="w-qty">
                Cantidad ({item?.unit}) — disponible: {item?.stock}
              </Label>
              <Input
                id="w-qty"
                type="number"
                step="any"
                min="0.1"
                max={item?.stock}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>Confirmar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}