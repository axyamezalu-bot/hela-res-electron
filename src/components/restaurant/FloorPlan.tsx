import { useState } from 'react';
import {
  DndContext,
  useDraggable,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { UtensilsCrossed, Plus, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
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
import type { RestaurantTable, Order } from '../../types/restaurant';
import type { User } from '../../App';

interface FloorPlanProps {
  tables: RestaurantTable[];
  activeOrders: Order[];
  currentUser: User;
  editMode: boolean;
  onEditModeChange: (v: boolean) => void;
  onTableClick: (table: RestaurantTable) => void;
  onUpdateTablePosition: (id: string, x: number, y: number) => Promise<void>;
  onAddTable: (data: {
    number: number;
    name: string;
    seats: number;
    shape: 'rectangle' | 'circle';
  }) => Promise<void>;
  onDeleteTable: (id: string) => Promise<void>;
}

const STATUS_STYLES: Record<RestaurantTable['status'], string> = {
  libre: 'bg-white border-green-500 text-gray-900',
  ocupada: 'bg-red-600 border-red-700 text-white',
  cuenta_pedida: 'bg-amber-400 border-orange-500 text-gray-900',
};

export function FloorPlan({
  tables,
  activeOrders,
  currentUser,
  editMode,
  onEditModeChange,
  onTableClick,
  onUpdateTablePosition,
  onAddTable,
  onDeleteTable,
}: FloorPlanProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmTable = tables.find(t => t.id === confirmDeleteId) ?? null;

  const handleDeleteRequest = (table: RestaurantTable) => {
    if (table.status !== 'libre') {
      toast.error('No se puede eliminar una mesa ocupada');
      return;
    }
    setConfirmDeleteId(table.id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await onDeleteTable(confirmDeleteId);
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };
  const isMesero = currentUser.role === 'Mesero';

  const counts = {
    libre: tables.filter(t => t.status === 'libre').length,
    ocupada: tables.filter(t => t.status === 'ocupada').length,
    cuenta_pedida: tables.filter(t => t.status === 'cuenta_pedida').length,
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    const table = tables.find(t => t.id === active.id);
    if (!table) return;
    const newX = Math.max(0, table.x + delta.x);
    const newY = Math.max(0, table.y + delta.y);
    await onUpdateTablePosition(table.id, newX, newY);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold">Plano del Restaurante</h1>
          {!editMode && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <LegendDot color="bg-green-500" label="Libre" />
              <LegendDot color="bg-red-600" label="Ocupada" />
              <LegendDot color="bg-amber-400" label="Cuenta pedida" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {counts.libre} libres · {counts.ocupada} ocupadas · {counts.cuenta_pedida} cuenta pedida
          </span>
          {!isMesero && (
            <div className="flex items-center gap-2">
              <Switch id="edit-mode" checked={editMode} onCheckedChange={onEditModeChange} />
              <Label htmlFor="edit-mode" className="cursor-pointer">Editar plano</Label>
            </div>
          )}
          {editMode && (
            <Button onClick={() => setAddOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Agregar Mesa
            </Button>
          )}
        </div>
      </div>

      {/* Canvas */}
      {tables.length === 0 ? (
        <EmptyState
          isMesero={isMesero}
          onActivate={() => onEditModeChange(true)}
        />
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div
            className="relative w-full flex-1 rounded-lg border overflow-auto"
            style={{
              minHeight: 600,
              backgroundColor: '#F8FAFC',
              backgroundImage:
                'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          >
            {tables.map(table => {
              const order = activeOrders.find(o => o.table_id === table.id);
              return (
                <TableCard
                  key={table.id}
                  table={table}
                  order={order}
                  editMode={editMode}
                  onClick={() => !editMode && onTableClick(table)}
                  onDelete={() => handleDeleteRequest(table)}
                />
              );
            })}
          </div>
        </DndContext>
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(v) => !v && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar mesa {confirmTable?.number}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción ocultará la mesa del plano. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add table dialog */}
      <AddTableDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultNumber={tables.length + 1}
        onSubmit={async (data) => {
          await onAddTable(data);
          setAddOpen(false);
        }}
      />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}

interface TableCardProps {
  table: RestaurantTable;
  order?: Order;
  editMode: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function TableCard({ table, order, editMode, onClick, onDelete }: TableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: table.id,
    disabled: !editMode,
  });

  const style: React.CSSProperties = {
    position: 'absolute',
    left: table.x,
    top: table.y,
    width: table.width,
    height: table.height,
    transform: CSS.Translate.toString(transform),
    borderRadius: table.shape === 'circle' ? '50%' : 12,
    cursor: editMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
    zIndex: isDragging ? 50 : 1,
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(editMode ? { ...attributes, ...listeners } : {})}
      onClick={editMode ? undefined : onClick}
      className={`border-2 shadow-sm flex flex-col items-center justify-center p-2 select-none transition-shadow hover:shadow-md ${STATUS_STYLES[table.status]}`}
    >
      {order && (
        <Badge className="absolute -top-2 -right-2 bg-green-600 hover:bg-green-600 text-white">
          ${order.total.toFixed(2)}
        </Badge>
      )}
      {editMode && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow hover:bg-red-700"
          title="Eliminar mesa"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
      <div className="text-2xl font-bold leading-none">{table.number}</div>
      <div className="text-xs opacity-80 mt-1 truncate max-w-full">{table.name}</div>
      <div className="flex items-center gap-1 text-xs mt-1 opacity-80">
        <Users className="w-3 h-3" />
        <span>{table.seats}</span>
      </div>
    </div>
  );
}

function EmptyState({ isMesero, onActivate }: { isMesero: boolean; onActivate: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 border rounded-lg bg-gray-50 min-h-[600px]">
      <UtensilsCrossed className="w-20 h-20" />
      <div className="text-center space-y-1">
        <p className="text-lg font-medium text-gray-600">No hay mesas configuradas</p>
        <p className="text-sm">Activa el modo edición para agregar tu primera mesa</p>
      </div>
      {!isMesero && (
        <Button onClick={onActivate}>
          <Plus className="w-4 h-4 mr-1" />
          Configurar mesas
        </Button>
      )}
    </div>
  );
}

interface AddTableDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultNumber: number;
  onSubmit: (data: {
    number: number;
    name: string;
    seats: number;
    shape: 'rectangle' | 'circle';
  }) => Promise<void>;
}

function AddTableDialog({ open, onOpenChange, defaultNumber, onSubmit }: AddTableDialogProps) {
  const [number, setNumber] = useState<number>(defaultNumber);
  const [name, setName] = useState('');
  const [seats, setSeats] = useState('4');
  const [shape, setShape] = useState<'rectangle' | 'circle'>('rectangle');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setNumber(defaultNumber);
    setName('');
    setSeats('4');
    setShape('rectangle');
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        number,
        name: name.trim() || `Mesa ${number}`,
        seats: parseInt(seats, 10),
        shape,
      });
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agregar Mesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="table-number">Número de mesa</Label>
              <Input
                id="table-number"
                type="number"
                min={1}
                value={number}
                onChange={e => setNumber(parseInt(e.target.value, 10) || 1)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-name">Nombre / Ubicación</Label>
              <Input
                id="table-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Terraza, Junto a ventana..."
              />
            </div>
            <div className="space-y-2">
              <Label>Sillas</Label>
              <Select value={seats} onValueChange={setSeats}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 personas</SelectItem>
                  <SelectItem value="4">4 personas</SelectItem>
                  <SelectItem value="6">6 personas</SelectItem>
                  <SelectItem value="8">8 personas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Forma</Label>
              <Select value={shape} onValueChange={(v) => setShape(v as 'rectangle' | 'circle')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rectangle">Rectangular</SelectItem>
                  <SelectItem value="circle">Circular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Agregando...' : 'Agregar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
