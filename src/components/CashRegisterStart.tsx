import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface CashRegisterStartProps {
    onStartCash: (amount: number) => void;
    currentDate: string;
}

export function CashRegisterStart({ onStartCash, currentDate }: CashRegisterStartProps) {
    const [startingAmount, setStartingAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (loading) return;

        const amount = parseFloat(startingAmount);

        if (isNaN(amount) || amount < 0) {
            toast.error('Ingresa un monto válido');
            return;
        }

        setLoading(true);
        try {
            onStartCash(amount);
            toast.success(`Caja iniciada con $${amount.toFixed(2)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Backdrop blur */}
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

            {/* Dialog */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border-2 border-gray-200">
                    <div className="p-6 space-y-6">
                        {/* Header */}
                        <div className="text-center space-y-2">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                    <DollarSign className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                            <h2 className="text-2xl">Inicio de Caja</h2>
                            <p className="text-gray-600">
                                Ingresa el monto inicial con el que comienzas la caja
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(currentDate).toLocaleDateString('es-MX', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</span>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="startingAmount">Monto Inicial</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <Input
                                        id="startingAmount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={startingAmount}
                                        onChange={(e) => setStartingAmount(e.target.value)}
                                        className="pl-7 text-lg"
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading || !startingAmount}
                            >
                                {loading ? 'Iniciando...' : 'Iniciar Caja'}
                            </Button>
                        </form>

                        {/* Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800 text-center">
                                Debes iniciar la caja antes de poder usar el sistema
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
