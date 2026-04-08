import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import logoImage from '../assets/hela-solutions.jpeg';
import type { User } from '../App';
import { userServiceElectron } from '../services/userService.electron';

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

interface LoginScreenProps {
    users: User[];
    onLogin: (user: User) => void;
}

export function LoginScreen({ users, onLogin }: LoginScreenProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            toast.error('Por favor ingresa tu usuario y contraseña');
            return;
        }

        const user = isElectron
            ? await userServiceElectron.login(username, password)
            : users.find(u => u.username === username && u.password === password) ?? null;

        if (user) {
            onLogin(user);
            toast.success(`¡Bienvenido ${user.fullName}!`);
        } else {
            toast.error('Usuario o contraseña incorrectos');
        }
    };

    const handleQuickLogin = (user: User) => {
        onLogin(user);
        toast.success(`¡Bienvenido ${user.fullName}!`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="space-y-4 text-center pb-4">
                    <div className="flex justify-center">
                        <img
                            src={logoImage}
                            alt="ZERVE POS"
                            className="w-64 h-auto"
                        />
                    </div>
                    <div>
                        <CardTitle>Iniciar Sesión</CardTitle>
                        <CardDescription>
                            Ingresa tus credenciales para acceder al sistema
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                            <TabsTrigger value="demo">Usuarios Demo</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="space-y-4 mt-4">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Usuario</Label>
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="w-4 h-4 text-gray-400" />
                                        <Input
                                            id="username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Ingresa tu usuario"
                                            className="flex-1"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-gray-400" />
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Ingresa tu contraseña"
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
                                </div>

                                <Button type="submit" className="w-full">
                                    Iniciar Sesión
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="demo" className="space-y-3 mt-4">
                            <p className="text-sm text-gray-600 text-center mb-3">
                                Selecciona un usuario para acceso rápido
                            </p>

                            {users.map((user) => (
                                <Button
                                    key={user.id}
                                    variant="outline"
                                    className="w-full justify-between"
                                    onClick={() => handleQuickLogin(user)}
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">{user.fullName}</span>
                                        <span className="text-xs text-gray-500">
                                            @{user.username} • {user.role}
                                        </span>
                                    </div>
                                    <UserIcon className="w-4 h-4" />
                                </Button>
                            ))}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}