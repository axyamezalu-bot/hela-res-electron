import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '../App';

interface PinAuthDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    users: User[];
    onAuthSuccess: () => void;
    onAuthCancel: () => void;
    onVerifyPin?: (pin: string) => Promise<User | null>;
}

export function PinAuthDialog({ open, onOpenChange, users, onAuthSuccess, onAuthCancel }: PinAuthDialogProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    if (!open) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (pin.length !== 6) {
            setError('El PIN debe tener 6 dígitos');
            return;
        }

        // Check if any admin has this PIN
        const adminUser = users.find(u =>
            (u.role === 'Administrador' || u.role === 'Dueño') && u.pin === pin
        );

        if (adminUser) {
            toast.success(`Acción autorizada por ${adminUser.fullName}`);
            setPin('');
            setError('');
            onAuthSuccess();
        } else {
            setError('PIN incorrecto');
            setPin('');
            toast.error('PIN incorrecto. Intenta nuevamente.');
        }
    };

    const handlePinChange = (value: string) => {
        // Only allow numbers
        const numericValue = value.replace(/[^0-9]/g, '');
        if (numericValue.length <= 6) {
            setPin(numericValue);
            setError('');
        }
    };

    const handleCancel = () => {
        setPin('');
        setError('');
        onAuthCancel();
        onOpenChange(false);
    };

    return (
        <>
            {/* Backdrop blur */}
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={handleCancel} />

            {/* Dialog */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border-2 border-gray-200">
                    <div className="p-6 space-y-6">
                        {/* Header */}
                        <div className="text-center space-y-2">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                                    <Lock className="w-8 h-8 text-orange-600" />
                                </div>
                            </div>
                            <h2 className="text-2xl">Autorización Requerida</h2>
                            <p className="text-gray-600">
                                Esta acción requiere autorización de un administrador
                            </p>
                            <p className="text-sm text-gray-500">
                                Solicita el PIN de 6 dígitos a un administrador
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="pin" className="text-center block">PIN del Administrador</Label>
                                <Input
                                    id="pin"
                                    type="password"
                                    inputMode="numeric"
                                    placeholder="••••••"
                                    value={pin}
                                    onChange={(e) => handlePinChange(e.target.value)}
                                    className="text-center text-2xl tracking-widest"
                                    maxLength={6}
                                    autoFocus
                                />
                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm justify-center">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={pin.length !== 6}
                                >
                                    Autorizar
                                </Button>
                            </div>
                        </form>

                        {/* Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800 text-center">
                                Solo los administradores y dueños pueden autorizar esta acción
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}