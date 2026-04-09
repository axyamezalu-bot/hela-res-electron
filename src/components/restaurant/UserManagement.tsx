import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
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
import type { User } from '../../App';

interface UserManagementProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  onUpdateUser: (id: string, user: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  onDeleteUser: (id: string) => Promise<void>;
}

const ROLE_BADGE: Record<User['role'], string> = {
  'Dueño': 'bg-blue-900 text-white hover:bg-blue-900',
  'Administrador': 'bg-blue-500 text-white hover:bg-blue-500',
  'Mesero': 'bg-gray-200 text-gray-800 hover:bg-gray-200',
};

const baseSchema = z.object({
  fullName: z.string().min(2, 'Mínimo 2 caracteres'),
  username: z.string().min(3, 'Mínimo 3 caracteres').regex(/^\S+$/, 'Sin espacios'),
  role: z.enum(['Dueño', 'Administrador', 'Mesero']),
  phone: z.string().optional(),
  password: z.string().optional(),
  pin: z.string().optional().refine(
    (v) => !v || /^\d{4}$/.test(v),
    { message: 'PIN debe ser 4 dígitos' }
  ),
});

type UserFormValues = z.infer<typeof baseSchema>;

export function UserManagement({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}: UserManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isMesero = currentUser.role === 'Mesero';

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await onDeleteUser(confirmDelete.id);
      toast.success(`Usuario ${confirmDelete.fullName} eliminado`);
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar usuario');
    } finally {
      setDeleting(false);
    }
  };

  const canDeleteUser = (u: User) => {
    if (u.id === currentUser.id) return false;
    if (users.length <= 1) return false;
    if (u.role === 'Dueño' && currentUser.role !== 'Dueño') return false;
    return true;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Gestión de Usuarios</h1>
        {!isMesero && (
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <UsersIcon className="w-16 h-16 mx-auto mb-3" />
              <p>No hay usuarios registrados</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b text-sm text-gray-500">
                <tr>
                  <th className="text-left p-3">Nombre completo</th>
                  <th className="text-left p-3">Usuario</th>
                  <th className="text-left p-3">Rol</th>
                  <th className="text-left p-3">Teléfono</th>
                  <th className="text-right p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser.id;
                  return (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-3 font-medium">{u.fullName}</td>
                      <td className="p-3 text-gray-600">@{u.username}</td>
                      <td className="p-3">
                        <Badge className={ROLE_BADGE[u.role]}>{u.role}</Badge>
                      </td>
                      <td className="p-3 text-gray-600">{u.phone || '—'}</td>
                      <td className="p-3 text-right">
                        {!isSelf && (
                          <div className="inline-flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(u)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-600"
                              disabled={!canDeleteUser(u)}
                              onClick={() => setConfirmDelete(u)}
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

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onAddUser={onAddUser}
        onUpdateUser={onUpdateUser}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario {confirmDelete?.fullName}?</AlertDialogTitle>
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

interface UserDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: User | null;
  onAddUser: UserManagementProps['onAddUser'];
  onUpdateUser: UserManagementProps['onUpdateUser'];
}

function UserDialog({ open, onOpenChange, editing, onAddUser, onUpdateUser }: UserDialogProps) {
  const isEdit = !!editing;

  const schema = isEdit
    ? baseSchema
    : baseSchema.extend({
        password: z.string().min(6, 'Mínimo 6 caracteres'),
      });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema) as any,
    values: editing
      ? {
          fullName: editing.fullName,
          username: editing.username,
          role: editing.role,
          phone: editing.phone ?? '',
          password: '',
          pin: '',
        }
      : {
          fullName: '',
          username: '',
          role: 'Mesero',
          phone: '',
          password: '',
          pin: '',
        },
  });

  const role = watch('role');

  const onSubmit = async (values: UserFormValues) => {
    try {
      if (isEdit && editing) {
        const payload: Omit<User, 'id' | 'createdAt'> = {
          fullName: values.fullName,
          username: values.username,
          role: values.role,
          phone: values.phone ?? '',
          email: editing.email,
          password: values.password ?? '',
          pin: values.pin ?? '',
          isAdmin: values.role !== 'Mesero',
        };
        await onUpdateUser(editing.id, payload);
        toast.success('Usuario actualizado');
      } else {
        await onAddUser({
          fullName: values.fullName,
          username: values.username,
          role: values.role,
          phone: values.phone ?? '',
          email: '',
          password: values.password ?? '',
          pin: values.pin ?? '',
          isAdmin: values.role !== 'Mesero',
        });
        toast.success('Usuario creado');
      }
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar usuario');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="u-fullname">Nombre completo</Label>
              <Input id="u-fullname" {...register('fullName')} />
              {errors.fullName && <p className="text-xs text-red-600">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-username">Usuario</Label>
              <Input id="u-username" {...register('username')} />
              {errors.username && <p className="text-xs text-red-600">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v) => setValue('role', v as UserFormValues['role'], { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dueño">Dueño</SelectItem>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Mesero">Mesero</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-phone">Teléfono</Label>
              <Input id="u-phone" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-password">Contraseña</Label>
              <Input
                id="u-password"
                type="password"
                {...register('password')}
                placeholder={isEdit ? 'Dejar vacío para no cambiar' : ''}
              />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-pin">PIN de 4 dígitos</Label>
              <Input
                id="u-pin"
                type="password"
                maxLength={4}
                {...register('pin')}
                placeholder={isEdit ? 'Dejar vacío para no cambiar' : ''}
              />
              <p className="text-xs text-gray-500">Se usa para autorizar acciones sensibles</p>
              {errors.pin && <p className="text-xs text-red-600">{errors.pin.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
