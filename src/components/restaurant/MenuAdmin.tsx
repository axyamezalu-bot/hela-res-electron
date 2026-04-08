import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Pencil, ChefHat, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
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
import type { MenuCategory, MenuItem } from '../../types/restaurant';

interface MenuAdminProps {
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  onCreateCategory: (data: { name: string; color: string; sort_order: number }) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onCreateMenuItem: (data: {
    category_id: string;
    name: string;
    description: string;
    price: number;
    sort_order: number;
  }) => Promise<void>;
  onUpdateMenuItem: (id: string, data: Partial<MenuItem>) => Promise<void>;
  onDeleteMenuItem: (id: string) => Promise<void>;
}

const itemSchema = z.object({
  category_id: z.string().min(1, 'Selecciona una categoría'),
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Precio inválido'),
  available: z.boolean().optional(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export function MenuAdmin({
  menuCategories,
  menuItems,
  onCreateCategory,
  onDeleteCategory,
  onCreateMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
}: MenuAdminProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Administrar Menú</h1>
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="items">Platillos</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="mt-4">
          <CategoriesTab
            menuCategories={menuCategories}
            menuItems={menuItems}
            onCreateCategory={onCreateCategory}
            onDeleteCategory={onDeleteCategory}
          />
        </TabsContent>
        <TabsContent value="items" className="mt-4">
          <ItemsTab
            menuCategories={menuCategories}
            menuItems={menuItems}
            onCreateMenuItem={onCreateMenuItem}
            onUpdateMenuItem={onUpdateMenuItem}
            onDeleteMenuItem={onDeleteMenuItem}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ----------- Categories ------------

function CategoriesTab({
  menuCategories,
  menuItems,
  onCreateCategory,
  onDeleteCategory,
}: Pick<MenuAdminProps, 'menuCategories' | 'menuItems' | 'onCreateCategory' | 'onDeleteCategory'>) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [submitting, setSubmitting] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onCreateCategory({ name: name.trim(), color, sort_order: menuCategories.length });
      setName('');
      setColor('#3B82F6');
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    setSubmitting(true);
    try {
      await onDeleteCategory(confirmId);
      setConfirmId(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Categorías ({menuCategories.length})</h2>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nueva Categoría
            </Button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSave} className="flex items-end gap-3 border rounded-md p-3 bg-gray-50">
            <div className="flex-1 space-y-1">
              <Label htmlFor="cat-name">Nombre</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bebidas, Entradas..."
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-color">Color</Label>
              <Input
                id="cat-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 p-1"
              />
            </div>
            <Button type="submit" disabled={submitting}>Guardar</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </form>
        )}

        {menuCategories.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <ChefHat className="w-12 h-12 mx-auto mb-2" />
            <p>No hay categorías. Crea la primera para empezar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {menuCategories.map((cat) => {
              const count = menuItems.filter((m) => m.category_id === cat.id).length;
              return (
                <div key={cat.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded" style={{ backgroundColor: cat.color }} />
                    <span className="font-medium">{cat.name}</span>
                    <Badge variant="secondary">{count} platillos</Badge>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => setConfirmId(cat.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <AlertDialog open={!!confirmId} onOpenChange={(v) => !v && setConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
              <AlertDialogDescription>
                Los platillos en esta categoría también se ocultarán del menú.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={submitting}
                onClick={(e) => { e.preventDefault(); handleDelete(); }}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

// ----------- Items ------------

function ItemsTab({
  menuCategories,
  menuItems,
  onCreateMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
}: Pick<MenuAdminProps, 'menuCategories' | 'menuItems' | 'onCreateMenuItem' | 'onUpdateMenuItem' | 'onDeleteMenuItem'>) {
  const [filterCat, setFilterCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    return menuItems.filter((m) => {
      if (filterCat !== 'all' && m.category_id !== filterCat) return false;
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [menuItems, filterCat, search]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    await onUpdateMenuItem(item.id, { available: item.available === 1 ? 0 : 1 } as Partial<MenuItem>);
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    setSubmitting(true);
    try {
      await onDeleteMenuItem(confirmId);
      setConfirmId(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {menuCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar platillo..."
                className="pl-9"
              />
            </div>
          </div>
          <Button size="sm" onClick={openNew} disabled={menuCategories.length === 0}>
            <Plus className="w-4 h-4 mr-1" /> Nuevo Platillo
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <ChefHat className="w-12 h-12 mx-auto mb-2" />
            <p>No hay platillos {search && 'que coincidan con tu búsqueda'}</p>
          </div>
        ) : (
          <div className="border rounded-md divide-y">
            {filtered.map((item) => {
              const cat = menuCategories.find((c) => c.id === item.category_id);
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEdit(item)}>
                    <div className="font-medium truncate">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-gray-500 truncate">{item.description}</div>
                    )}
                  </div>
                  {cat && (
                    <Badge variant="outline" style={{ borderColor: cat.color, color: cat.color }}>
                      {cat.name}
                    </Badge>
                  )}
                  <div className="w-24 text-right font-medium">${item.price.toFixed(2)}</div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.available === 1}
                      onCheckedChange={() => handleToggleAvailable(item)}
                    />
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => setConfirmId(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editing={editing}
          menuCategories={menuCategories}
          defaultSortOrder={menuItems.length}
          onCreateMenuItem={onCreateMenuItem}
          onUpdateMenuItem={onUpdateMenuItem}
        />

        <AlertDialog open={!!confirmId} onOpenChange={(v) => !v && setConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar platillo?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={submitting}
                onClick={(e) => { e.preventDefault(); handleDelete(); }}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: MenuItem | null;
  menuCategories: MenuCategory[];
  defaultSortOrder: number;
  onCreateMenuItem: MenuAdminProps['onCreateMenuItem'];
  onUpdateMenuItem: MenuAdminProps['onUpdateMenuItem'];
}

function ItemDialog({
  open, onOpenChange, editing, menuCategories, defaultSortOrder,
  onCreateMenuItem, onUpdateMenuItem,
}: ItemDialogProps) {
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    values: editing
      ? {
          category_id: editing.category_id,
          name: editing.name,
          description: editing.description ?? '',
          price: editing.price,
          available: editing.available === 1,
        }
      : {
          category_id: menuCategories[0]?.id ?? '',
          name: '',
          description: '',
          price: 0,
          available: true,
        },
  });

  const categoryId = watch('category_id');

  const onSubmit = async (values: ItemFormValues) => {
    if (editing) {
      await onUpdateMenuItem(editing.id, {
        name: values.name,
        description: values.description,
        price: values.price,
        available: values.available ? 1 : 0,
      } as Partial<MenuItem>);
    } else {
      await onCreateMenuItem({
        category_id: values.category_id,
        name: values.name,
        description: values.description ?? '',
        price: values.price,
        sort_order: defaultSortOrder,
      });
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Platillo' : 'Nuevo Platillo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => setValue('category_id', v, { shouldValidate: true })}
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {menuCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-xs text-red-600">{errors.category_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-name">Nombre</Label>
              <Input id="item-name" {...register('name')} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-desc">Descripción</Label>
              <Textarea id="item-desc" rows={3} {...register('description')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">Precio</Label>
              <Input
                id="item-price"
                type="number"
                step="0.01"
                min="0"
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && <p className="text-xs text-red-600">{errors.price.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editing ? 'Guardar cambios' : 'Crear platillo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
