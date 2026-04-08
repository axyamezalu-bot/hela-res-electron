import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, Bell, Package, DollarSign } from 'lucide-react';
import type { Product, CreditAccount } from '../App';

interface NotificationsProps {
    products: Product[];
    credits: CreditAccount[];
}

export function Notifications({ products, credits }: NotificationsProps) {
    const lowStockProducts = products.filter(p => p.stock <= p.minStock);

    // Calculate overdue credits (more than 1 month without payment)
    const getOverdueCredits = () => {
        const today = new Date();
        return credits.filter(c => {
            if (c.pendingAmount === 0) return false; // Skip paid credits

            const lastDate = c.lastPaymentDate ? new Date(c.lastPaymentDate) : new Date(c.debtDate);
            const diffTime = today.getTime() - lastDate.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);

            return diffDays > 30; // More than 1 month (30 days)
        });
    };

    const overdueCredits = getOverdueCredits();
    const totalNotifications = lowStockProducts.length + overdueCredits.length;

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Sin abonos';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600">Notificaciones Activas</p>
                            <p className="text-3xl text-blue-700">{totalNotifications}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Overdue Credits Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle>Pagos Atrasados</CardTitle>
                    <CardDescription>
                        Clientes con más de 1 mes sin realizar abonos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {overdueCredits.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                                <DollarSign className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-gray-900 mb-2">No hay pagos atrasados</h3>
                            <p className="text-gray-500">
                                Todos los clientes están al corriente con sus pagos
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {overdueCredits.map((credit) => {
                                const lastDate = credit.lastPaymentDate || credit.debtDate;
                                const daysSinceLastPayment = Math.floor(
                                    (new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
                                );

                                return (
                                    <div
                                        key={credit.id}
                                        className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                                                <AlertCircle className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-gray-900">{credit.clientName}</p>
                                                    <Badge variant="destructive">Pago Atrasado</Badge>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Monto adeudado: ${credit.pendingAmount.toFixed(2)}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {credit.lastPaymentDate
                                                        ? `Último abono: ${formatDate(credit.lastPaymentDate)}`
                                                        : `Fecha de deuda: ${formatDate(credit.debtDate)} (Sin abonos)`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-red-600">
                                                {daysSinceLastPayment} días
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                sin abonar
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Low Stock Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle>Alertas de Stock Bajo</CardTitle>
                    <CardDescription>
                        Productos que requieren reabastecimiento
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {lowStockProducts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                                <Package className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-gray-900 mb-2">No hay alertas</h3>
                            <p className="text-gray-500">
                                Todos los productos tienen stock suficiente
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {lowStockProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                                            <AlertCircle className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-gray-900">{product.name}</p>
                                                <Badge variant="destructive">Stock Bajo</Badge>
                                            </div>
                                            <p className="text-sm text-gray-600">SKU: {product.code}</p>
                                            <p className="text-sm text-gray-600">Categoría: {product.category}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-orange-600">
                                            {product.stock} unidades
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Mínimo: {product.minStock}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
