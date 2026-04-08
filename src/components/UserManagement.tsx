import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Search, Plus, Edit, Trash2, Mail, Phone, User as UserIcon, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Checkbox } from './ui/checkbox';
import type { User } from '../App';

interface UserManagementProps {
    users: User[];
    currentUser: User;
    onAddUser: (user: Omit<User, 'id'>) => void;
    onUpdateUser: (userId: string, user: Omit<User, 'id'>) => void;
    onDeleteUser: (userId: string) => void;
}

export function UserManagement({
    users,
    currentUser,
    onAddUser,
    onUpdateUser,
    onDeleteUser
}: UserManagementProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        pin: '',
        confirmPin: '',
        role: 'Cajero',
        isAdmin: false
    });

    const filteredUsers = users.filter(u => {
        if (currentUser.role === 'Administrador' && u.role === 'Dueño') {
            return false;
        }

        return (
            u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.role.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const generateUsername = (fullName: string) => {
        const parts = fullName.trim().split(' ').filter(p => p.length > 0);
        if (parts.length < 3) return '';
        const firstName = parts[0];
        const firstLastName = parts[1];
        return `${firstName}${firstLastName}`.toLowerCase();
    };

    const validateFullName = (fullName: string): boolean => {
        const parts = fullName.trim().split(' ').filter(p => p.length > 0);
        return parts.length >= 3;
    };

    const resetForm = () => {
        setFormData({
            fullName: '',
            username: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            pin: '',
            confirmPin: '',
            role: 'Cajero',
            isAdmin: false
        });
        setShowPassword(false);
    };

    const handleAdd = () => {
        if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
            toast.error('Completa todos los campos obligatorios');
            return;
        }

        if (!validateFullName(formData.fullName)) {
            toast.error('El nombre completo debe incluir nombre, apellido paterno y apellido materno');
            return;
        }

        if (formData.password.length < 8) {
            toast.error('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (formData.isAdmin) {
            if (!formData.pin || !formData.confirmPin) {
                toast.error('El PIN es obligatorio para usuarios con permisos de administrador');
                return;
            }

            if (formData.pin.length !== 6) {
                toast.error('El PIN debe tener exactamente 6 dígitos');
                return;
            }

            if (formData.pin !== formData.confirmPin) {
                toast.error('Los PINs no coinciden');
                return;
            }
        }

        const role = formData.isAdmin ? 'Administrador' : 'Cajero';

        const userData: Omit<User, 'id'> = {
            fullName: formData.fullName,
            username: formData.username,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            pin: formData.isAdmin ? formData.pin : '',
            role: role,
            isAdmin: formData.isAdmin,
            createdAt: new Date().toISOString()
        };

        onAddUser(userData);
        toast.success('Usuario agregado exitosamente');
        setIsAddDialogOpen(false);
        resetForm();
    };

    const handleEdit = () => {
        if (!selectedUser) return;
        if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
            toast.error('Completa todos los campos obligatorios');
            return;
        }

        if (!validateFullName(formData.fullName)) {
            toast.error('El nombre completo debe incluir nombre, apellido paterno y apellido materno');
            return;
        }

        if (formData.password.length < 8) {
            toast.error('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (formData.isAdmin) {
            if (!formData.pin || !formData.confirmPin) {
                toast.error('El PIN es obligatorio para usuarios con permisos de administrador');
                return;
            }

            if (formData.pin.length !== 6) {
                toast.error('El PIN debe tener exactamente 6 dígitos');
                return;
            }

            if (formData.pin !== formData.confirmPin) {
                toast.error('Los PINs no coinciden');
                return;
            }
        }

        if (selectedUser.role === 'Dueño') {
            toast.error('No puedes editar al Dueño');
            return;
        }

        const role = formData.isAdmin ? 'Administrador' : 'Cajero';

        const userData: Omit<User, 'id'> = {
            fullName: formData.fullName,
            username: formData.username,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            pin: formData.isAdmin ? formData.pin : '',
            role: role,
            isAdmin: formData.isAdmin,
            createdAt: selectedUser.createdAt
        };

        onUpdateUser(selectedUser.id, userData);
        toast.success('Usuario actualizado exitosamente');
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        resetForm();
    };

    const handleDelete = (userId: string, userName: string) => {
        setUserToDelete({ id: userId, name: userName });
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (userToDelete) {
            onDeleteUser(userToDelete.id);
            toast.success('Usuario dado de baja exitosamente');
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setFormData({
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            phone: user.phone,
            password: user.password,
            // CORRECCIÓN 5: Se agregaron confirmPassword y confirmPin que faltaban.
            // Sin ellos, al abrir el diálogo de edición estos campos quedaban con el valor
            // del estado anterior, haciendo que las validaciones de coincidencia fallaran
            // incluso cuando el usuario no había cambiado nada.
            confirmPassword: user.password,
            // CORRECCIÓN 6: Se usa ?? '' para manejar que pin es opcional (pin?: string).
            // Si user.pin es undefined, asignamos '' en lugar de undefined,
            // ya que formData.pin es de tipo string, no string | undefined.
            pin: user.pin ?? '',
            confirmPin: user.pin ?? '',
            role: user.role,
            isAdmin: user.isAdmin
        });
        setIsEditDialogOpen(true);
    };

    const getRoleBadgeVariant = (role: string) => {
        if (role === 'Dueño') return 'default';
        if (role === 'Administrador') return 'secondary';
        return 'outline';
    };

    const handleFullNameChange = (value: string) => {
        setFormData({
            ...formData,
            fullName: value,
            username: generateUsername(value)
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Buscar usuario por nombre, email o rol..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => resetForm()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Usuario
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
                            <DialogDescription>
                                Completa la información del usuario
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="fullName">Nombre Completo *</Label>
                                <Input
                                    id="fullName"
                                    value={formData.fullName}
                                    onChange={(e) => handleFullNameChange(e.target.value)}
                                    placeholder="Nombre Apellido-Paterno Apellido-Materno"
                                />
                                <p className="text-xs text-gray-500">Ejemplo: Juan Pérez García</p>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="username">Nombre de Usuario *</Label>
                                <div className="flex items-center gap-2">
                                    {/* CORRECCIÓN 1 aplicada: se usa UserIcon en lugar de User */}
                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        disabled
                                        placeholder="Se genera automáticamente"
                                        className="flex-1 bg-gray-50"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Se genera automáticamente: Primer Nombre + Apellido Paterno (Ejemplo: juanperez)</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico *</Label>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="juan.perez@example.com"
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono *</Label>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="555-1234567"
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña *</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500">Mínimo 8 caracteres</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder="••••••••"
                                    className="flex-1"
                                />
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                {currentUser.role === 'Dueño' ? (
                                    <>
                                        <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="add-isAdmin"
                                                    checked={formData.isAdmin}
                                                    onCheckedChange={(checked) => setFormData({ ...formData, isAdmin: checked as boolean })}
                                                />
                                                <label htmlFor="add-isAdmin" className="text-sm cursor-pointer flex items-center gap-2">
                                                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                                                    <span>Permisos de Administrador</span>
                                                </label>
                                            </div>
                                            {formData.isAdmin && (
                                                <Badge variant="default">Administrador</Badge>
                                            )}
                                            {!formData.isAdmin && (
                                                <Badge variant="outline">Cajero</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Los usuarios con permisos de administrador requieren un PIN de 6 dígitos y tendrán el rol de Administrador
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-4 border rounded-lg bg-gray-50 border-gray-200">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <ShieldCheck className="w-4 h-4" />
                                                <span className="text-sm">Este usuario será creado como <strong>Cajero</strong></span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Solo el Dueño puede crear usuarios con permisos de administrador
                                        </p>
                                    </>
                                )}
                            </div>

                            {formData.isAdmin && currentUser.role === 'Dueño' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="pin">PIN (6 dígitos) *</Label>
                                        <Input
                                            id="pin"
                                            type="text"
                                            maxLength={6}
                                            value={formData.pin}
                                            onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                                            placeholder="123456"
                                            className="flex-1"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPin">Confirmar PIN *</Label>
                                        <Input
                                            id="confirmPin"
                                            type="text"
                                            maxLength={6}
                                            value={formData.confirmPin}
                                            onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value.replace(/\D/g, '') })}
                                            placeholder="123456"
                                            className="flex-1"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleAdd}>Agregar Usuario</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <p className="text-gray-500">No se encontraron usuarios</p>
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <Card key={user.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{user.fullName}</CardTitle>
                                    </div>
                                    <Badge variant={getRoleBadgeVariant(user.role)}>
                                        {user.role}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span className="truncate">{user.email}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{user.phone}</span>
                                    </div>
                                </div>

                                {user.isAdmin && (
                                    <div className="pt-3 border-t">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                                            <Badge variant="default" className="text-xs">
                                                Permisos de Administrador
                                            </Badge>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 pt-3 border-t">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openEditDialog(user)}
                                        className="flex-1"
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Editar
                                    </Button>

                                    {user.role !== 'Dueño' && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDelete(user.id, user.fullName)}
                                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Dar de Baja
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Usuario</DialogTitle>
                        <DialogDescription>
                            Actualiza la información del usuario
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="edit-fullName">Nombre Completo *</Label>
                            <Input
                                id="edit-fullName"
                                value={formData.fullName}
                                onChange={(e) => handleFullNameChange(e.target.value)}
                                placeholder="Nombre Apellido-Paterno Apellido-Materno"
                            />
                            <p className="text-xs text-gray-500">Ejemplo: Juan Pérez García</p>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="edit-username">Nombre de Usuario *</Label>
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-gray-400" />
                                <Input
                                    id="edit-username"
                                    value={formData.username}
                                    disabled
                                    placeholder="Se genera automáticamente"
                                    className="flex-1 bg-gray-50"
                                />
                            </div>
                            <p className="text-xs text-gray-500">Se genera automáticamente: Primer Nombre + Apellido Paterno (Ejemplo: juanperez)</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Correo Electrónico *</Label>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="juan.perez@example.com"
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Teléfono *</Label>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <Input
                                    id="edit-phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="555-1234567"
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-password">Contraseña *</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="edit-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">Mínimo 8 caracteres</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-confirmPassword">Confirmar Contraseña *</Label>
                            <Input
                                id="edit-confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="••••••••"
                                className="flex-1"
                            />
                        </div>

                        <div className="space-y-3 md:col-span-2">
                            {currentUser.role === 'Dueño' ? (
                                <>
                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="edit-isAdmin"
                                                checked={formData.isAdmin}
                                                onCheckedChange={(checked) => setFormData({ ...formData, isAdmin: checked as boolean })}
                                            />
                                            <label htmlFor="edit-isAdmin" className="text-sm cursor-pointer flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-blue-600" />
                                                <span>Permisos de Administrador</span>
                                            </label>
                                        </div>
                                        {formData.isAdmin && (
                                            <Badge variant="default">Administrador</Badge>
                                        )}
                                        {!formData.isAdmin && (
                                            <Badge variant="outline">Cajero</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Los usuarios con permisos de administrador requieren un PIN de 6 dígitos y tendrán el rol de Administrador
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="p-4 border rounded-lg bg-gray-50 border-gray-200">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <ShieldCheck className="w-4 h-4" />
                                            <span className="text-sm">Este usuario es <strong>{formData.isAdmin ? 'Administrador' : 'Cajero'}</strong></span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Solo el Dueño puede modificar los permisos de administrador
                                    </p>
                                </>
                            )}
                        </div>

                        {formData.isAdmin && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-pin">PIN (6 dígitos) *</Label>
                                    <Input
                                        id="edit-pin"
                                        type="text"
                                        maxLength={6}
                                        value={formData.pin}
                                        onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                                        placeholder="123456"
                                        className="flex-1"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-confirmPin">Confirmar PIN *</Label>
                                    <Input
                                        id="edit-confirmPin"
                                        type="text"
                                        maxLength={6}
                                        value={formData.confirmPin}
                                        onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value.replace(/\D/g, '') })}
                                        placeholder="123456"
                                        className="flex-1"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEdit}>Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <DialogTitle className="text-xl">Confirmar Baja de Usuario</DialogTitle>
                            </div>
                        </div>
                        <DialogDescription className="text-base pt-2">
                            ¿Estás seguro de que deseas dar de baja a <strong className="text-gray-900">{userToDelete?.name}</strong>?
                            <br />
                            <span className="text-sm text-gray-500 mt-2 block">
                                Esta acción no se puede deshacer.
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteDialogOpen(false);
                                setUserToDelete(null);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Dar de Baja
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}