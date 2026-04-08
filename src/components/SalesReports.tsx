import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
    FileText,
    Download,
    Eye,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import type { Sale } from '../App';
import { toast } from 'sonner';

export interface SalesReport {
    id: string;
    type: 'diario' | 'semanal' | 'mensual' | 'anual';
    date: string; // Date when the report was generated
    startDate: string; // Period start date
    endDate: string; // Period end date
    sales: Sale[];
    totalCash: number;
    totalCredit: number;
    grandTotal: number;
    totalSales: number;
    creditCovered: number;
    creditPending: number;
    closedByUserId: string;
    closedByUserName: string;
}

interface SalesReportsProps {
    reports: SalesReport[];
    currentUserIsAdmin: boolean;
}

export function SalesReports({ reports, currentUserIsAdmin }: SalesReportsProps) {
    const [filterType, setFilterType] = useState<string>('all');
    const [filterDate, setFilterDate] = useState<string>('');
    const [filterSeller, setFilterSeller] = useState('');
    const [filterPayment, setFilterPayment] = useState('');
    const [selectedReport, setSelectedReport] = useState<SalesReport | null>(null);

    // Unique sellers across all reports
    const sellers = Array.from(new Set(
        reports.flatMap(r => r.sales.map(s => s.userName))
    )).filter(Boolean);

    // Filter reports
    const filteredReports = useMemo(() => {
        let filtered = [...reports];

        if (filterType !== 'all') {
            filtered = filtered.filter(r => r.type === filterType);
        }

        if (filterDate) {
            filtered = filtered.filter(r => {
                const reportDate = new Date(r.date).toISOString().split('T')[0];
                const selectedDate = new Date(filterDate).toISOString().split('T')[0];
                return reportDate === selectedDate;
            });
        }

        if (filterSeller) {
            filtered = filtered.filter(r => r.sales.some(s => s.userName === filterSeller));
        }

        if (filterPayment) {
            filtered = filtered.filter(r => r.sales.some(s => s.paymentMethod === filterPayment));
        }

        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return filtered;
    }, [reports, filterType, filterDate, filterSeller, filterPayment]);

    const getTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
        switch (type) {
            case 'diario': return 'default';
            case 'semanal': return 'secondary';
            case 'mensual': return 'outline';
            default: return 'outline';
        }
    };

    const handleExportPDF = (report: SalesReport) => {
        if (!currentUserIsAdmin) {
            toast.error('Solo los administradores pueden exportar reportes');
            return;
        }

        const ventasDetalle = report.sales
            .filter(s => s.status !== 'cancelada')
            .map(s =>
                `${s.folio ?? '—'} | ${new Date(s.date).toLocaleString('es-MX')} | ${s.userName} | ${s.paymentMethod} | $${s.total.toFixed(2)}`
            ).join('\n');

        const content = `REPORTE DE VENTAS — ${report.type.toUpperCase()}
Período: ${report.startDate} al ${report.endDate}
Generado: ${new Date(report.date).toLocaleString('es-MX')}
Generado por: ${report.closedByUserName}

═══ RESUMEN ═══
Total Ventas: ${report.totalSales}
Ventas Efectivo: $${report.totalCash.toFixed(2)}
Ventas Crédito: $${report.totalCredit.toFixed(2)}
Total General: $${report.grandTotal.toFixed(2)}

═══ DETALLE DE VENTAS ═══
Folio | Fecha/Hora | Vendedor | Método | Total
${ventasDetalle}
`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${report.type}-${report.startDate}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = (report: SalesReport) => {
        if (!currentUserIsAdmin) {
            toast.error('Solo los administradores pueden exportar reportes');
            return;
        }
        const exportDate = new Date().toLocaleString('es-MX', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
        toast.success(`Exportando reporte a Excel... (Fecha de exportación: ${exportDate})`);
    };

    const formatDateRange = (report: SalesReport) => {
        const start = new Date(report.startDate).toLocaleDateString('es-MX');
        const end = new Date(report.endDate).toLocaleDateString('es-MX');
        return start === end ? start : `${start} - ${end}`;
    };

    const getPaymentMethodLabel = (method: string) => {
        const methods: Record<string, string> = {
            'efectivo': 'Efectivo', 'cash': 'Efectivo',
            'transferencia': 'Transferencia', 'transfer': 'Transferencia',
            'tdc': 'Tarjeta de Crédito', 'tdd': 'Tarjeta de Débito',
            'tarjeta': 'Tarjeta', 'card': 'Tarjeta',
            'credito': 'Crédito', 'crédito': 'Crédito', 'credit': 'Crédito'
        };
        return methods[method] || method;
    };

    const getDeliveryMethodLabel = (method: string) => {
        const methods: Record<string, string> = {
            'domicilio': 'A Domicilio', 'delivery': 'A Domicilio',
            'envío': 'A Domicilio', 'envio': 'A Domicilio',
            'sucursal': 'En Sucursal', 'pickup': 'En Sucursal'
        };
        return methods[method] || method;
    };

    const buildKPIs = (report: SalesReport) => {
        const ticketPromedio = report.totalSales > 0
            ? report.grandTotal / report.totalSales : 0;

        const utilidadBruta = report.sales.reduce((sum, sale) => {
            return sum + sale.items.reduce((s, item) => {
                const costo = (item.product.purchasePrice ?? 0) * item.quantity;
                const venta = item.product.price * item.quantity;
                return s + (venta - costo);
            }, 0);
        }, 0);

        const ventasCanceladas = report.sales
            .filter(s => s.status === 'cancelada')
            .reduce((sum, s) => sum + s.total, 0);

        const ventasNetas = report.grandTotal - ventasCanceladas;

        const productMap: Record<string, { name: string; qty: number; total: number; saleUnit: string }> = {};
        report.sales.forEach(sale => {
            if (sale.status === 'cancelada') return;
            sale.items.forEach(item => {
                const key = item.product.code;
                if (!productMap[key]) {
                    const cleanName = item.product.name.replace(/\s*\(\d+(\.\d+)?(kg|g)\)$/i, '');
                    productMap[key] = { name: cleanName, qty: 0, total: 0, saleUnit: item.product.saleUnit ?? 'unidad' };
                }
                const weightMatch = item.product.name.match(/\((\d+(\.\d+)?)(kg|g)\)/i);
                let realQty = item.quantity;
                if (weightMatch) {
                    const num = parseFloat(weightMatch[1]);
                    const unit = weightMatch[3].toLowerCase();
                    realQty = unit === 'g' ? num / 1000 : num;
                }
                productMap[key].qty += realQty;
                productMap[key].total += item.product.price * item.quantity;
            });
        });
        const top5 = Object.values(productMap)
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        return { ticketPromedio, utilidadBruta, ventasCanceladas, ventasNetas, top5 };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-gray-900">Reportes de Venta</h3>
                <p className="text-gray-600">Consulta los reportes generados automáticamente al realizar cortes de caja</p>
            </div>

            {/* Info Card */}
            {!currentUserIsAdmin && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-yellow-600" />
                            <div>
                                <p className="text-yellow-900">Acceso limitado</p>
                                <p className="text-yellow-700 text-sm">Solo los administradores pueden exportar reportes a PDF o Excel.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                    <CardDescription>Filtra los reportes por tipo, fecha, vendedor y método de pago</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Tipo de Reporte</label>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="diario">Diario</SelectItem>
                                    <SelectItem value="semanal">Semanal</SelectItem>
                                    <SelectItem value="mensual">Mensual</SelectItem>
                                    <SelectItem value="anual">Anual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Fecha de Generación</label>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Vendedor</label>
                            <select
                                value={filterSeller}
                                onChange={e => setFilterSeller(e.target.value)}
                                className="w-full rounded-md border border-gray-300 p-2 text-sm"
                            >
                                <option value="">Todos los vendedores</option>
                                {sellers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Método de Pago</label>
                            <select
                                value={filterPayment}
                                onChange={e => setFilterPayment(e.target.value)}
                                className="w-full rounded-md border border-gray-300 p-2 text-sm"
                            >
                                <option value="">Todos los métodos</option>
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="tdc">Tarjeta Crédito</option>
                                <option value="tdd">Tarjeta Débito</option>
                                <option value="credito">Crédito</option>
                            </select>
                        </div>
                    </div>

                    {(filterType !== 'all' || filterDate || filterSeller || filterPayment) && (
                        <div className="mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setFilterType('all');
                                    setFilterDate('');
                                    setFilterSeller('');
                                    setFilterPayment('');
                                }}
                            >
                                Limpiar Filtros
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reports List */}
            <Card>
                <CardHeader>
                    <CardTitle>Reportes Generados</CardTitle>
                    <CardDescription>
                        {filteredReports.length} reporte{filteredReports.length !== 1 ? 's' : ''} encontrado{filteredReports.length !== 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredReports.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg">No hay reportes disponibles</p>
                            <p className="text-sm mt-2">Los reportes se generan automáticamente al realizar el corte de caja</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredReports.map((report) => {
                                const kpis = buildKPIs(report);
                                return (
                                    <div
                                        key={report.id}
                                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Badge variant={getTypeBadgeVariant(report.type)} className="capitalize">
                                                        {report.type}
                                                    </Badge>
                                                    <span className="text-sm text-gray-600">
                                                        {formatDateRange(report)}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Total Ventas</p>
                                                        <p className="font-semibold">{report.totalSales}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Ventas al Contado</p>
                                                        <p className="font-semibold text-green-600">
                                                            ${report.totalCash.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Ventas a Crédito</p>
                                                        <p className="font-semibold text-orange-600">
                                                            ${report.totalCredit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-3 border-t">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600">Total General:</span>
                                                        <span className="font-semibold text-blue-600">
                                                            ${report.grandTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-2 text-xs text-gray-500">
                                                    Generado el {new Date(report.date).toLocaleDateString('es-MX')} por {report.closedByUserName}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 ml-4">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedReport(report)}
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Ver
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>
                                                                Reporte {report.type.charAt(0).toUpperCase() + report.type.slice(1)} - {formatDateRange(report)}
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                Generado el {new Date(report.date).toLocaleDateString('es-MX')} por {report.closedByUserName}
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        <div className="space-y-6 mt-4">
                                                            {/* Summary cards */}
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                <Card>
                                                                    <CardContent className="pt-6">
                                                                        <p className="text-xs text-gray-500">Total Ventas</p>
                                                                        <p className="text-2xl mt-1">{report.totalSales}</p>
                                                                    </CardContent>
                                                                </Card>
                                                                <Card>
                                                                    <CardContent className="pt-6">
                                                                        <p className="text-xs text-gray-500">Ventas Contado</p>
                                                                        <p className="text-2xl mt-1 text-green-600">
                                                                            ${report.totalCash.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                                                                        </p>
                                                                    </CardContent>
                                                                </Card>
                                                                <Card>
                                                                    <CardContent className="pt-6">
                                                                        <p className="text-xs text-gray-500">Ventas Crédito</p>
                                                                        <p className="text-2xl mt-1 text-orange-600">
                                                                            ${report.totalCredit.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                                                                        </p>
                                                                    </CardContent>
                                                                </Card>
                                                                <Card>
                                                                    <CardContent className="pt-6">
                                                                        <p className="text-xs text-gray-500">Total General</p>
                                                                        <p className="text-2xl mt-1 text-blue-600">
                                                                            ${report.grandTotal.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                                                                        </p>
                                                                    </CardContent>
                                                                </Card>
                                                            </div>

                                                            {/* KPIs */}
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                <div className="p-3 border rounded-lg text-center">
                                                                    <p className="text-xs text-gray-500">Ticket Promedio</p>
                                                                    <p className="text-lg font-semibold">${kpis.ticketPromedio.toFixed(2)}</p>
                                                                </div>
                                                                <div className="p-3 border rounded-lg text-center">
                                                                    <p className="text-xs text-gray-500">Utilidad Bruta</p>
                                                                    <p className="text-lg font-semibold text-green-600">${kpis.utilidadBruta.toFixed(2)}</p>
                                                                </div>
                                                                <div className="p-3 border rounded-lg text-center">
                                                                    <p className="text-xs text-gray-500">Ventas Netas</p>
                                                                    <p className="text-lg font-semibold">${kpis.ventasNetas.toFixed(2)}</p>
                                                                </div>
                                                                <div className="p-3 border rounded-lg text-center">
                                                                    <p className="text-xs text-gray-500">Cancelaciones</p>
                                                                    <p className="text-lg font-semibold text-red-500">${kpis.ventasCanceladas.toFixed(2)}</p>
                                                                </div>
                                                            </div>

                                                            {/* Top 5 */}
                                                            {kpis.top5.length > 0 && (
                                                                <div>
                                                                    <h4 className="text-sm font-medium mb-2">Top productos</h4>
                                                                    <div className="space-y-1">
                                                                        {kpis.top5.map((p, i) => (
                                                                            <div key={i} className="flex justify-between text-sm p-2 border rounded">
                                                                                <span>{i + 1}. {p.name}</span>
                                                                                <span className="text-gray-500">
                                                                                    {p.saleUnit === 'unidad'
                                                                                        ? `${p.qty % 1 === 0 ? p.qty : p.qty.toFixed(3)} uds`
                                                                                        : `${p.qty.toFixed(3)} kg`
                                                                                    } — ${p.total.toFixed(2)}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Sales Detail */}
                                                            <div>
                                                                <h4 className="mb-3">Detalle de Ventas</h4>
                                                                <div className="border rounded-lg overflow-hidden">
                                                                    <Table>
                                                                        <TableHeader>
                                                                            <TableRow>
                                                                                <TableHead>Folio</TableHead>
                                                                                <TableHead>Fecha</TableHead>
                                                                                <TableHead>Productos</TableHead>
                                                                                <TableHead>Total</TableHead>
                                                                                <TableHead>Método Pago</TableHead>
                                                                                <TableHead>Tipo Venta</TableHead>
                                                                                <TableHead>Vendedor</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {report.sales.map((sale) => (
                                                                                <TableRow key={sale.id}>
                                                                                    <TableCell className="text-xs font-mono">
                                                                                        {sale.folio ?? '—'}
                                                                                    </TableCell>
                                                                                    <TableCell className="text-xs">
                                                                                        {new Date(sale.date).toLocaleDateString('es-MX')}
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <div className="text-xs">
                                                                                            {sale.items.slice(0, 2).map((item, i) => (
                                                                                                <div key={i}>
                                                                                                    {item.product.name}
                                                                                                </div>
                                                                                            ))}
                                                                                            {sale.items.length > 2 && (
                                                                                                <div className="text-gray-400">
                                                                                                    +{sale.items.length - 2} más
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell className="font-semibold">
                                                                                        ${sale.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Badge variant="outline" className="text-xs">
                                                                                            {getPaymentMethodLabel(sale.paymentMethod)}
                                                                                        </Badge>
                                                                                    </TableCell>
                                                                                    <TableCell className="text-xs">
                                                                                        {getDeliveryMethodLabel(sale.deliveryMethod)}
                                                                                    </TableCell>
                                                                                    <TableCell className="text-xs text-gray-600">
                                                                                        {sale.userName}
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>

                                                {currentUserIsAdmin && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleExportPDF(report)}
                                                        >
                                                            <Download className="w-4 h-4 mr-2" />
                                                            PDF
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleExportExcel(report)}
                                                        >
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Excel
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* suppress unused warning */}
            {selectedReport && <span className="hidden">{selectedReport.id}</span>}
        </div>
    );
}
