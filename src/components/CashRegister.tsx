import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { AlertCircle, Scissors, Receipt, ArrowDownCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import type { Sale, User as UserType, CashStart } from '../App';
import { PartialCutDialog } from './PartialCutDialog';
import { usePartialCuts } from '../hooks/usePartialCuts';
import { ExpenseDialog } from './ExpenseDialog';
import { useExpenses } from '../hooks/useExpenses';
import { DepositDialog } from './DepositDialog';
import { useDeposits } from '../hooks/useDeposits';

interface CashRegisterProps {
    sales: Sale[];
    closedDates: string[];
    onCloseCashRegister: (date: string) => void;
    currentUserIsAdmin: boolean;
    adminAuthorized?: boolean;
    currentUser: UserType;
    cashStartInfo: CashStart | null;
    users: UserType[];
}

export function CashRegister({
    sales,
    closedDates,
    onCloseCashRegister,
    currentUserIsAdmin,
    adminAuthorized,
    currentUser,
    cashStartInfo,
    users,
}: CashRegisterProps) {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [showPartialCut, setShowPartialCut] = useState(false);
    const [showExpenses, setShowExpenses] = useState(false);
    const [showDeposits, setShowDeposits] = useState(false);

    const { partialCuts, fetchByDate, createPartialCut } = usePartialCuts();
    const { expenses, fetchByDate: fetchExpensesByDate, createExpense, deleteExpense } = useExpenses();
    const { deposits, fetchByDate: fetchDepositsByDate, createDeposit, deleteDeposit } = useDeposits();

    useEffect(() => {
        fetchByDate(today);
        fetchExpensesByDate(today);
        fetchDepositsByDate(today);
    }, [today]);

    const canCloseCash = currentUserIsAdmin || adminAuthorized;
    const isDateClosed = closedDates.includes(selectedDate);

    const salesForDate = sales.filter((sale) => {
        const saleDate = new Date(sale.date).toISOString().split('T')[0];
        return saleDate === selectedDate && sale.status !== 'cancelada';
    });

    const totalForDate = salesForDate.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalDeposits = deposits.reduce((s, d) => s + d.amount, 0);

    const handleCloseCashClick = () => {
        if (!canCloseCash) {
            toast.error('No tienes permisos para realizar corte de caja');
            return;
        }

        if (isDateClosed) {
            toast.error('El corte de caja de esta fecha ya fue realizado');
            return;
        }

        onCloseCashRegister(selectedDate);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    onClick={() => setShowPartialCut(true)}
                    className="flex items-center gap-2"
                >
                    <Scissors className="w-4 h-4" />
                    Corte Parcial
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setShowExpenses(true)}
                    className="flex items-center gap-2"
                >
                    <Receipt className="w-4 h-4" />
                    Gastos
                    {expenses.length > 0 && (
                        <Badge variant="destructive" className="ml-1 text-xs">
                            -${totalExpenses.toFixed(2)}
                        </Badge>
                    )}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setShowDeposits(true)}
                    className="flex items-center gap-2"
                >
                    <ArrowDownCircle className="w-4 h-4 text-green-600" />
                    Depósitos
                    {deposits.length > 0 && (
                        <Badge className="ml-1 text-xs bg-green-100 text-green-700 border-green-200">
                            +${totalDeposits.toFixed(2)}
                        </Badge>
                    )}
                </Button>
            </div>

            {partialCuts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Scissors className="w-4 h-4" />
                            Cortes Parciales del Día ({partialCuts.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {partialCuts.map((cut, idx) => (
                                <div key={cut.id}
                                    className="flex items-center justify-between p-3 border rounded-lg text-sm">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline">#{idx + 1}</Badge>
                                        <div>
                                            <p className="font-medium">{cut.cashierName}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(cut.cutTime).toLocaleTimeString('es-MX',
                                                    { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-green-600">
                                            ${cut.salesCash.toFixed(2)} efectivo
                                        </p>
                                        {cut.difference !== 0 && (
                                            <p className={`text-xs ${cut.difference > 0
                                                ? 'text-blue-500' : 'text-red-500'}`}>
                                                {cut.difference > 0 ? 'Sobrante' : 'Faltante'}{' '}
                                                ${Math.abs(cut.difference).toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="border-t pt-2 flex justify-between items-center font-medium">
                                <span className="text-sm">Total acumulado (cortes parciales)</span>
                                <span className="text-green-600">
                                    ${partialCuts.reduce((s, c) => s + c.salesCash, 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Corte de Caja</CardTitle>
                    <CardDescription>Selecciona una fecha para visualizar ventas y cerrar caja</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="closeDate">Fecha de corte</Label>
                        <Input
                            id="closeDate"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg border">
                            <p className="text-sm text-gray-500">Ventas registradas</p>
                            <p>{salesForDate.length}</p>
                        </div>
                        <div className="p-3 rounded-lg border">
                            <p className="text-sm text-gray-500">Total vendido</p>
                            <p>${totalForDate.toFixed(2)} MXN</p>
                        </div>
                        {expenses.length > 0 && (
                            <div className="p-3 rounded-lg border border-red-200 bg-red-50">
                                <p className="text-sm text-red-600">Gastos del día</p>
                                <p className="text-red-700 font-medium">
                                    -${totalExpenses.toFixed(2)}
                                </p>
                            </div>
                        )}
                        {deposits.length > 0 && (
                            <div className="p-3 rounded-lg border border-green-200 bg-green-50">
                                <p className="text-sm text-green-600">Depósitos del día</p>
                                <p className="font-medium text-green-700">
                                    +${totalDeposits.toFixed(2)}
                                </p>
                            </div>
                        )}
                        {(expenses.length > 0 || deposits.length > 0) && (
                            <div className="p-3 rounded-lg border bg-gray-50 col-span-2">
                                <p className="text-sm text-gray-500">Total neto (ventas + depósitos - gastos)</p>
                                <p className="font-medium">
                                    ${(totalForDate + totalDeposits - totalExpenses).toFixed(2)} MXN
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">Estado:</p>
                        {isDateClosed ? (
                            <Badge variant="secondary">Corte realizado</Badge>
                        ) : (
                            <Badge variant="outline">Pendiente</Badge>
                        )}
                    </div>

                    <Button
                        onClick={handleCloseCashClick}
                        disabled={isDateClosed || !canCloseCash}
                    >
                        Realizar Corte de Caja
                    </Button>

                    {!canCloseCash && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Requieres autorización administrativa para realizar el corte de caja.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <PartialCutDialog
                open={showPartialCut}
                onOpenChange={setShowPartialCut}
                currentUser={currentUser}
                cashStartInfo={cashStartInfo}
                sales={sales}
                previousPartialCuts={partialCuts}
                onCreatePartialCut={createPartialCut}
            />

            <ExpenseDialog
                open={showExpenses}
                onOpenChange={setShowExpenses}
                currentUser={currentUser}
                users={users}
                expenses={expenses}
                onCreateExpense={createExpense}
                onDeleteExpense={deleteExpense}
            />

            <DepositDialog
                open={showDeposits}
                onOpenChange={setShowDeposits}
                currentUser={currentUser}
                deposits={deposits}
                onCreateDeposit={createDeposit}
                onDeleteDeposit={deleteDeposit}
            />
        </div>
    );
}
