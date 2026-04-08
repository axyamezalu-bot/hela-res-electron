import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { UserManagement } from './components/UserManagement';
import { TicketSearch } from './components/TicketSearch';
import { CreditManagement } from './components/CreditManagement';
import { InventoryManagement } from './components/InventoryManagement';
import { Notifications } from './components/Notifications';
import { SalesRegistration } from './components/SalesRegistration';
import { ClientManagement } from './components/ClientManagement';
import { LoginScreen } from './components/LoginScreen';
import { SalesEdit } from './components/SalesEdit';
import { CashRegister } from './components/CashRegister';
import { CashRegisterStart } from './components/CashRegisterStart';
import { PendingCashDialog } from './components/PendingCashDialog';
import { SalesReports, type SalesReport } from './components/SalesReports';
import { PinAuthDialog } from './components/PinAuthDialog';
import { Users, Ticket, CreditCard, LayoutDashboard, Menu, X, PackageOpen, Bell, ShoppingCart, UserCircle, LogOut, User as UserIconLucide, Edit3, Calculator, FileText, Truck } from 'lucide-react';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import logoImage from './assets/hela-solutions.jpeg';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { useInventory } from './hooks/useInventory';
import { useUsers } from './hooks/useUsers';
import { useClients } from './hooks/useClients';
import { useSales } from './hooks/useSales';
import { useCredits } from './hooks/useCredits';
import { useCashRegister } from './hooks/useCashRegister';
import { useSuppliers } from './hooks/useSuppliers';
import { useWaste } from './hooks/useWaste';
import { salesReportService } from './services/salesReportService';
import { salesReportServiceElectron } from './services/salesReportService.electron';
import { cashRegisterService } from './services/cashRegisterService';
import { cashRegisterServiceElectron } from './services/cashRegisterService.electron';
import { SupplierManagement } from './components/SupplierManagement';

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

export interface Product {
  id: string;
  code: string; // Código de barras
  name: string;
  category: string;
  brand?: string; // Marca del producto
  description?: string; // Descripción (opcional)
  purchasePrice: number; // Precio de compra
  price: number; // Precio de venta
  initialStock: number; // Cantidad inicial
  stock: number; // Stock actual
  minStock: number; // Mínimo de producto recomendado
  saleUnit: 'unidad' | 'kg' | 'g';
  pricePerKg?: number;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  pin?: string; // PIN de 6 dígitos para autorización
  role: 'Dueño' | 'Administrador' | 'Cajero';
  isAdmin: boolean;
  createdAt: string;
}

export interface CreditAccount {
  id: string;
  clientName: string;
  clientCode: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'Pago Parcial' | 'Vencido' | 'Pagado' | 'Pendiente';
  debtDate: string; // Fecha en que se hizo la deuda
  lastPaymentDate: string | null; // Fecha del último abono, null si no ha abonado
}

export interface Client {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  neighborhood: string;
  street: string;
  streetNumber: string;
  businessName?: string;
  rfc?: string;
}

export interface Sale {
  id: string;
  date: string;
  items: Array<{ product: Product; quantity: number }>;
  total: number;
  paymentMethod: string;
  deliveryMethod: string;
  clientId?: string;
  clientName?: string;
  userId: string; // Usuario que realizó la venta
  userName: string; // Nombre del usuario que realizó la venta
  status?: 'normal' | 'modificada' | 'cancelada'; // Estado de la venta
  originalSaleId?: string; // ID de la venta original (si esta es una edición)
  modifiedSaleId?: string; // ID de la nueva venta (si esta fue modificada)
  folio?: string;
}

export interface CashStart {
  date: string;
  startingAmount: number;
  userId: string;
  userName: string;
}

type ViewType = 'dashboard' | 'users' | 'tickets' | 'credits' | 'inventory' | 'notifications' | 'sales' | 'clients' | 'editSales' | 'cashRegister' | 'salesReports' | 'ticketSearch' | 'suppliers';

export default function App() {
  // ─── Hooks de Supabase ────────────────────────────────────────────────────
  const {
    products,
    loading: productsLoading,
    addProduct,
    updateProduct,
    updateStock,
    fetchProducts,
  } = useInventory();

  const {
    users,
    loading: usersLoading,
    addUser,
    updateUser,
    deleteUser,
  } = useUsers();

  const {
    clients,
    loading: clientsLoading,
    addClient,
    updateClient,
    deleteClient,
  } = useClients();

  const {
    sales,
    loading: salesLoading,
    createSale,
    cancelSale,
    updateSaleStatus,
    fetchSales,
  } = useSales();

  const {
    credits,
    loading: creditsLoading,
    addCredit,
    registerPayment,
  } = useCredits();

  const {
    cashStarted,
    cashStartInfo,
    pendingCash,
    loading: cashLoading,
    openCash,
    closeCash,
  } = useCashRegister();

  const {
    suppliers,
    loading: suppliersLoading,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  } = useSuppliers();

  const { wasteRecords, addWaste } = useWaste();

  // ─── Estado local (UI, reportes, navegación) ──────────────────────────────
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [closedDates, setClosedDates] = useState<string[]>([]);
  const [salesReports, setSalesReports] = useState<SalesReport[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showPinAuth, setShowPinAuth] = useState(false);
  const [pendingView, setPendingView] = useState<ViewType | null>(null);
  const [adminAuthorizedForView, setAdminAuthorizedForView] = useState(false); // Track if admin authorized with PIN

  // ─── Carga inicial de closedDates y salesReports ──────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const loadInitialData = async () => {
      setDataLoading(true);
      try {
        const [dates, reports] = await Promise.all([
          isElectron
            ? cashRegisterServiceElectron.getClosedDates()
            : cashRegisterService.getClosedDates(),
          isElectron
            ? salesReportServiceElectron.getAll()
            : salesReportService.getAll(),
        ]);
        setClosedDates(dates);
        setSalesReports(reports);
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadInitialData();
  }, [currentUser]);

  // ─── Loading screen global ────────────────────────────────────────────────
  const isLoading = productsLoading || usersLoading || clientsLoading || salesLoading || creditsLoading || cashLoading || dataLoading || suppliersLoading;

  // ─── Handlers de Inventario ───────────────────────────────────────────────
  const handleAddProduct = async (product: Omit<Product, 'id'>) => {
    try {
      await addProduct(product);
    } catch {
      toast.error('Error al agregar producto');
    }
  };

  const handleUpdateProduct = async (productId: string, updatedProduct: Omit<Product, 'id'>) => {
    try {
      await updateProduct(productId, updatedProduct);
    } catch {
      toast.error('Error al actualizar producto');
    }
  };

  // ─── Handlers de Usuarios ─────────────────────────────────────────────────
  const handleAddUser = async ({ createdAt: _createdAt, ...user }: Omit<User, 'id'>) => {
    try {
      await addUser(user);
    } catch {
      toast.error('Error al agregar usuario');
    }
  };

  const handleUpdateUser = async (userId: string, { createdAt: _createdAt, ...updatedUser }: Omit<User, 'id'>) => {
    try {
      await updateUser(userId, updatedUser);
    } catch {
      toast.error('Error al actualizar usuario');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
    } catch {
      toast.error('Error al eliminar usuario');
    }
  };

  // ─── Handlers de Créditos ─────────────────────────────────────────────────
  const handleRegisterPayment = async (creditId: string, amount: number) => {
    try {
      await registerPayment(creditId, amount);
    } catch {
      toast.error('Error al registrar pago');
    }
  };

  // ─── Handlers de Proveedores ──────────────────────────────────────────────
  const handleAddSupplier = async (s: Parameters<typeof addSupplier>[0]) => {
    try {
      return await addSupplier(s);
    } catch {
      toast.error('Error al agregar proveedor');
      throw new Error('Error al agregar proveedor');
    }
  };

  const handleUpdateSupplier = async (id: string, s: Parameters<typeof updateSupplier>[1]) => {
    try {
      return await updateSupplier(id, s);
    } catch {
      toast.error('Error al actualizar proveedor');
      throw new Error('Error al actualizar proveedor');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      await deleteSupplier(id);
    } catch {
      toast.error('Error al desactivar proveedor');
    }
  };

  // ─── Handlers de Ventas ───────────────────────────────────────────────────
  const handleSaleComplete = async (saleData: {
    items: Array<{ product: Product; quantity: number }>;
    total: number;
    paymentMethod: string;
    clientId?: string;
  }) => {
    if (!currentUser) return;
    const client = saleData.clientId ? clients.find(c => c.id === saleData.clientId) : undefined;

    try {
      await createSale(
        {
          date: new Date().toISOString(),
          total: saleData.total,
          paymentMethod: saleData.paymentMethod,
          deliveryMethod: 'pickup',
          clientId: saleData.clientId,
          clientName: client ? `${client.firstName} ${client.lastName}` : 'Público en General',
          userId: currentUser.id,
          userName: currentUser.fullName,
          status: 'normal',
        },
        saleData.items,
      );

      // Refrescar stock después de la venta
      fetchProducts();

      // Si el pago es a crédito, crear cuenta de crédito
      if (saleData.paymentMethod === 'credito' && saleData.clientId && client) {
        await addCredit({
          clientName: `${client.firstName} ${client.lastName}`,
          clientCode: client.code,
          description: `Venta a crédito - ${saleData.items.map(i => i.product.name).join(', ')}`,
          totalAmount: saleData.total,
          paidAmount: 0,
          pendingAmount: saleData.total,
          status: 'Pendiente',
          debtDate: new Date().toISOString().split('T')[0],
          lastPaymentDate: null,
        });
      }
    } catch {
      toast.error('Error al registrar la venta');
    }
  };

  // ─── Handlers de Clientes ─────────────────────────────────────────────────
  const handleAddClient = async (client: Omit<Client, 'id' | 'code'>): Promise<Client> => {
    try {
      return await addClient(client);
    } catch {
      toast.error('Error al agregar cliente');
      throw new Error('Error al agregar cliente');
    }
  };

  const handleUpdateClient = async (clientId: string, updatedClient: Omit<Client, 'id' | 'code'>) => {
    try {
      await updateClient(clientId, updatedClient);
    } catch {
      toast.error('Error al actualizar cliente');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteClient(clientId);
    } catch {
      toast.error('Error al eliminar cliente');
    }
  };

  // ─── Handler de modificación de venta (lógica compleja preservada) ────────
  const handleModifySale = async (
    originalSaleId: string,
    newSaleData: {
      items: Array<{ product: Product; quantity: number }>;
      total: number;
      paymentMethod: string;
      deliveryMethod: string;
      clientId?: string;
    }
  ) => {
    if (!currentUser) return;

    const originalSale = sales.find(s => s.id === originalSaleId);
    if (!originalSale) return;

    try {
      // 1. Revertir stock de los items de la venta original
      for (const item of originalSale.items) {
        const currentProduct = products.find(p => p.id === item.product.id);
        if (currentProduct) {
          await updateStock(item.product.id, currentProduct.stock + item.quantity);
        }
      }

      // 2. Marcar la venta original como modificada
      await updateSaleStatus(originalSaleId, 'modificada');

      // 3. Crear nueva venta (saleService maneja la reducción de stock de los nuevos items)
      const client = newSaleData.clientId ? clients.find(c => c.id === newSaleData.clientId) : undefined;
      await createSale(
        {
          date: new Date().toISOString(),
          total: newSaleData.total,
          paymentMethod: newSaleData.paymentMethod,
          deliveryMethod: newSaleData.deliveryMethod,
          clientId: newSaleData.clientId,
          clientName: client ? `${client.firstName} ${client.lastName}` : undefined,
          userId: currentUser.id,
          userName: currentUser.fullName,
          status: 'normal',
          originalSaleId: originalSaleId,
        },
        newSaleData.items,
      );

      // 4. Refrescar estado desde la BD
      fetchSales();
      fetchProducts();

      toast.success('Venta modificada exitosamente. Se creó una nueva venta.');
    } catch {
      toast.error('Error al modificar la venta');
    }
  };

  const handleCancelSale = async (saleId: string) => {
    try {
      await cancelSale(saleId); // saleService.cancel() revierte el stock en BD
      fetchProducts();           // Refrescar stock local
      toast.success('Venta cancelada exitosamente. Se devolvió el stock.');
    } catch {
      toast.error('Error al cancelar la venta');
    }
  };

  // Calculate notifications count
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

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

  const overdueCreditsCount = getOverdueCredits().length;
  const notificationsCount = lowStockCount + overdueCreditsCount;

  const menuItems = [
    { id: 'dashboard', label: 'Página Principal', icon: LayoutDashboard },
    ...(currentUser?.role !== 'Cajero' ? [{ id: 'users', label: 'Usuarios', icon: Users }] : []),
    { id: 'inventory', label: 'Inventario', icon: PackageOpen },
    ...(currentUser?.role !== 'Cajero' ? [{ id: 'suppliers', label: 'Proveedores', icon: Truck }] : []),
    { id: 'sales', label: 'Registrar Venta', icon: ShoppingCart },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'editSales', label: 'Editar Ventas', icon: Edit3 },
    { id: 'clients', label: 'Clientes', icon: UserCircle },
    { id: 'credits', label: 'Créditos', icon: CreditCard },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'cashRegister', label: 'Corte de Caja', icon: Calculator },
    { id: 'salesReports', label: 'Reportes de Ventas', icon: FileText }
  ];

  const getViewTitle = () => {
    const item = menuItems.find(m => m.id === currentView);
    return item?.label || 'HELA POS';
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleStartCash = async (amount: number) => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      await openCash(today, amount, currentUser.id, currentUser.fullName);
    } catch {
      toast.error('Error al abrir caja');
    }
  };

  // Handle cash register close and generate reports
  const handleCloseCashRegister = async (date: string) => {
    if (!currentUser) return;

    try {
      await closeCash(date);
    } catch {
      toast.error('Error al cerrar la caja');
      return;
    }

    // Add date to closed dates
    setClosedDates([...closedDates, date]);

    // Get sales for this date
    const salesForDate = sales.filter(sale => {
      const saleDate = new Date(sale.date).toISOString().split('T')[0];
      return saleDate === date && sale.status !== 'cancelada';
    });

    // Calculate totals
    let cashTotal = 0;
    let creditTotal = 0;
    let creditCovered = 0;
    let creditPending = 0;

    salesForDate.forEach(sale => {
      const amount = sale.total;
      const isCredit = sale.paymentMethod.toLowerCase() === 'credito' || sale.paymentMethod.toLowerCase() === 'crédito';

      if (isCredit) {
        creditTotal += amount;
        creditPending += amount; // Simplified - in real app, check actual payments
      } else {
        cashTotal += amount;
      }
    });

    const grandTotal = cashTotal + creditTotal;

    // Create daily report
    const newReport: SalesReport = {
      id: crypto.randomUUID(),
      type: 'diario',
      date: new Date().toISOString(),
      startDate: date,
      endDate: date,
      sales: salesForDate,
      totalCash: cashTotal,
      totalCredit: creditTotal,
      grandTotal: grandTotal,
      totalSales: salesForDate.length,
      creditCovered: creditCovered,
      creditPending: creditPending,
      closedByUserId: currentUser.id,
      closedByUserName: currentUser.fullName
    };

    try {
      const reportPayload = {
        id: newReport.id,
        type: newReport.type,
        date: newReport.date,
        startDate: newReport.startDate,
        endDate: newReport.endDate,
        totalCash: newReport.totalCash,
        totalCredit: newReport.totalCredit,
        grandTotal: newReport.grandTotal,
        totalSales: newReport.totalSales,
        creditCovered: newReport.creditCovered,
        creditPending: newReport.creditPending,
        closedByUserId: newReport.closedByUserId,
        closedByUserName: newReport.closedByUserName,
      };
      if (isElectron) {
        await salesReportServiceElectron.create(reportPayload);
      } else {
        await salesReportService.create(reportPayload);
      }
    } catch {
      toast.error('Error al guardar el reporte en la base de datos');
    }

    setSalesReports([...salesReports, newReport]);

    // Check if we need to generate weekly, monthly, or annual reports
    await generateAggregatedReports(date, [...salesReports, newReport]);

    toast.success(`Corte de caja realizado exitosamente. Reporte del ${new Date(date).toLocaleDateString('es-MX')} generado.`);
  };

  // Generate aggregated reports (weekly, monthly, annual)
  const generateAggregatedReports = async (newCloseDate: string, currentReports: SalesReport[]) => {
    if (!currentUser) return;

    const allClosedDates = [...closedDates, newCloseDate];
    const newReports: SalesReport[] = [];

    // Get all daily reports
    const dailyReports = currentReports.filter(r => r.type === 'diario');

    // Check for weekly report (7 consecutive days)
    const today = new Date(newCloseDate);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6); // 7 days including today

    let hasFullWeek = true;
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(weekStart);
      checkDate.setDate(weekStart.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];
      weekDates.push(dateStr);
      if (!allClosedDates.includes(dateStr)) {
        hasFullWeek = false;
        break;
      }
    }

    if (hasFullWeek) {
      const weekReports = dailyReports.filter(r => weekDates.includes(r.startDate));
      if (weekReports.length >= 7) {
        const weekSales = weekReports.flatMap(r => r.sales);
        const weekTotalCash = weekReports.reduce((sum, r) => sum + r.totalCash, 0);
        const weekTotalCredit = weekReports.reduce((sum, r) => sum + r.totalCredit, 0);

        // Check if this week report already exists
        const weekExists = currentReports.some(r =>
          r.type === 'semanal' &&
          r.startDate === weekDates[0] &&
          r.endDate === weekDates[6]
        );

        if (!weekExists) {
          newReports.push({
            id: crypto.randomUUID(),
            type: 'semanal',
            date: new Date().toISOString(),
            startDate: weekDates[0],
            endDate: weekDates[6],
            sales: weekSales,
            totalCash: weekTotalCash,
            totalCredit: weekTotalCredit,
            grandTotal: weekTotalCash + weekTotalCredit,
            totalSales: weekSales.length,
            creditCovered: 0,
            creditPending: weekTotalCredit,
            closedByUserId: currentUser.id,
            closedByUserName: currentUser.fullName
          });
        }
      }
    }

    // Check for monthly report (all days of a month)
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let hasFullMonth = true;
    const monthDates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const checkDate = new Date(currentYear, currentMonth, day);
      const dateStr = checkDate.toISOString().split('T')[0];
      monthDates.push(dateStr);
      if (!allClosedDates.includes(dateStr)) {
        hasFullMonth = false;
        break;
      }
    }

    if (hasFullMonth) {
      const monthReports = dailyReports.filter(r => monthDates.includes(r.startDate));
      const monthSales = monthReports.flatMap(r => r.sales);
      const monthTotalCash = monthReports.reduce((sum, r) => sum + r.totalCash, 0);
      const monthTotalCredit = monthReports.reduce((sum, r) => sum + r.totalCredit, 0);

      const monthExists = currentReports.some(r =>
        r.type === 'mensual' &&
        new Date(r.startDate).getMonth() === currentMonth &&
        new Date(r.startDate).getFullYear() === currentYear
      );

      if (!monthExists) {
        newReports.push({
          id: crypto.randomUUID(),
          type: 'mensual',
          date: new Date().toISOString(),
          startDate: monthDates[0],
          endDate: monthDates[monthDates.length - 1],
          sales: monthSales,
          totalCash: monthTotalCash,
          totalCredit: monthTotalCredit,
          grandTotal: monthTotalCash + monthTotalCredit,
          totalSales: monthSales.length,
          creditCovered: 0,
          creditPending: monthTotalCredit,
          closedByUserId: currentUser.id,
          closedByUserName: currentUser.fullName
        });
      }
    }

    // Check for annual report (all days of a year)
    const dayOfYear = Math.floor((today.getTime() - new Date(currentYear, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const isLastDayOfYear = dayOfYear === (new Date(currentYear, 11, 31).getTime() - new Date(currentYear, 0, 0).getTime()) / (1000 * 60 * 60 * 24);

    if (isLastDayOfYear) {
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31);

      let hasFullYear = true;
      const yearDates: string[] = [];
      for (let d = new Date(yearStart); d <= yearEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        yearDates.push(dateStr);
        if (!allClosedDates.includes(dateStr)) {
          hasFullYear = false;
          break;
        }
      }

      if (hasFullYear) {
        const yearReports = dailyReports.filter(r => {
          const reportYear = new Date(r.startDate).getFullYear();
          return reportYear === currentYear;
        });
        const yearSales = yearReports.flatMap(r => r.sales);
        const yearTotalCash = yearReports.reduce((sum, r) => sum + r.totalCash, 0);
        const yearTotalCredit = yearReports.reduce((sum, r) => sum + r.totalCredit, 0);

        const yearExists = currentReports.some(r =>
          r.type === 'anual' &&
          new Date(r.startDate).getFullYear() === currentYear
        );

        if (!yearExists) {
          newReports.push({
            id: crypto.randomUUID(),
            type: 'anual',
            date: new Date().toISOString(),
            startDate: yearStart.toISOString().split('T')[0],
            endDate: yearEnd.toISOString().split('T')[0],
            sales: yearSales,
            totalCash: yearTotalCash,
            totalCredit: yearTotalCredit,
            grandTotal: yearTotalCash + yearTotalCredit,
            totalSales: yearSales.length,
            creditCovered: 0,
            creditPending: yearTotalCredit,
            closedByUserId: currentUser.id,
            closedByUserName: currentUser.fullName
          });
        }
      }
    }

    // Add new aggregated reports
    if (newReports.length > 0) {
      for (const report of newReports) {
        try {
          const aggPayload = {
            id: report.id,
            type: report.type,
            date: report.date,
            startDate: report.startDate,
            endDate: report.endDate,
            totalCash: report.totalCash,
            totalCredit: report.totalCredit,
            grandTotal: report.grandTotal,
            totalSales: report.totalSales,
            creditCovered: report.creditCovered,
            creditPending: report.creditPending,
            closedByUserId: report.closedByUserId,
            closedByUserName: report.closedByUserName,
          };
          if (isElectron) {
            await salesReportServiceElectron.create(aggPayload);
          } else {
            await salesReportService.create(aggPayload);
          }
        } catch {
          console.error('Error al guardar reporte agregado:', report.type);
        }
      }

      setSalesReports(prev => [...prev, ...newReports]);
      toast.success(`Se generaron ${newReports.length} reporte(s) adicional(es).`);
    }
  };

  // Check if today's cash register has been closed
  const isTodayClosed = () => {
    const today = new Date().toISOString().split('T')[0];
    return closedDates.includes(today);
  };

  const handleLogout = () => {
    // Check if there are sales today
    const today = new Date().toISOString().split('T')[0];
    const salesToday = sales.filter(sale => {
      const saleDate = new Date(sale.date).toISOString().split('T')[0];
      return saleDate === today && sale.status !== 'cancelada';
    });

    // If there are sales today and cash register hasn't been closed, prevent logout
    if (salesToday.length > 0 && !isTodayClosed()) {
      // Para cajeros, solo mostrar mensaje de error sin navegar
      if (currentUser?.role === 'Cajero') {
        toast.error('Corte de caja no realizado. Realícelo antes de cerrar sesión.');
        return;
      }
      // Para otros roles, navegar al corte de caja
      toast.error('Debes realizar el corte de caja antes de cerrar sesión');
      setCurrentView('cashRegister');
      return;
    }

    setCurrentUser(null);
    setCurrentView('dashboard');
    toast.success('Sesión cerrada exitosamente');
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    if (role === 'Dueño') return 'default';
    if (role === 'Administrador') return 'secondary';
    return 'outline';
  };

  // Handle view change with PIN authorization for cashiers
  const handleViewChange = (newView: ViewType) => {
    // Reset admin authorization when changing views
    setAdminAuthorizedForView(false);

    // If cashier tries to access salesReports or cashRegister, require PIN
    if (currentUser?.role === 'Cajero' && (newView === 'salesReports' || newView === 'cashRegister')) {
      setPendingView(newView);
      setShowPinAuth(true);
      return;
    }

    // Otherwise, navigate normally
    setCurrentView(newView);
  };

  const handlePinAuthSuccess = () => {
    if (pendingView) {
      setCurrentView(pendingView);
      // Mark that admin authorized access for this view
      setAdminAuthorizedForView(true);
    }
    setShowPinAuth(false);
    setPendingView(null);
  };

  const handlePinAuthCancel = () => {
    setShowPinAuth(false);
    setPendingView(null);
  };

  // Show login screen if no user is logged in
  if (!currentUser) {
    return (
      <>
        <div className="min-h-screen bg-white flex blur-sm">
          {/* Blurred background showing the interface */}
          <aside className="w-64 bg-gray-900 text-white">
            <div className="p-6">
              <div className="flex items-center justify-center mb-8 bg-white rounded-lg py-3">
                <img
                  src={logoImage}
                  alt="HELA POS"
                  className="w-48 h-auto"
                />
              </div>
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="flex-1 text-left">{item.label}</span>
                    </div>
                  );
                })}
              </nav>
            </div>
          </aside>
          <div className="flex-1 flex flex-col">
            <header className="border-b border-gray-200 bg-white">
              <div className="px-6 py-4">
                <h2>HELA POS</h2>
              </div>
            </header>
            <main className="flex-1 px-6 py-8">
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </main>
          </div>
        </div>
        <LoginScreen users={users} onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-600">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  // Show cash register start if user logged in but cash not started
  if (!cashStarted) {
    return (
      <>
        <div className="min-h-screen bg-white flex blur-sm">
          {/* Blurred background showing the interface */}
          <aside className="w-64 bg-gray-900 text-white">
            <div className="p-6">
              <div className="flex items-center justify-center mb-8 bg-white rounded-lg py-3">
                <img
                  src={logoImage}
                  alt="HELA POS"
                  className="w-48 h-auto"
                />
              </div>
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="flex-1 text-left">{item.label}</span>
                    </div>
                  );
                })}
              </nav>
            </div>
          </aside>
          <div className="flex-1 flex flex-col">
            <header className="border-b border-gray-200 bg-white">
              <div className="px-6 py-4">
                <h2>HELA POS</h2>
              </div>
            </header>
            <main className="flex-1 px-6 py-8">
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </main>
          </div>
        </div>
        {pendingCash ? (
          <PendingCashDialog
            pendingDate={pendingCash.date}
            totalSalesCount={sales.filter(s => {
              const d = new Date(s.date).toISOString().split('T')[0];
              return d === pendingCash.date && s.status !== 'cancelada';
            }).length}
            totalSales={sales
              .filter(s => {
                const d = new Date(s.date).toISOString().split('T')[0];
                return d === pendingCash.date && s.status !== 'cancelada';
              })
              .reduce((sum, s) => sum + s.total, 0)}
            onClosePending={() => handleCloseCashRegister(pendingCash.date)}
          />
        ) : (
          <CashRegisterStart
            onStartCash={handleStartCash}
            currentDate={new Date().toISOString().split('T')[0]}
          />
        )}
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-gray-900 text-white transition-all duration-300 overflow-hidden`}>
        <div className="p-6">
          <div className="flex items-center justify-center mb-8 bg-white rounded-lg py-3">
            <img
              src={logoImage}
              alt="HELA POS"
              className="w-48 h-auto"
            />
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const showBadge = item.id === 'notifications' && notificationsCount > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id as ViewType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {showBadge && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs">
                      {notificationsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
                <div>
                  <h2>{getViewTitle()}</h2>
                  <p className="text-gray-500 text-sm">
                    {currentView === 'dashboard' && 'Resumen general del sistema'}
                    {currentView === 'sales' && 'Registra nuevas ventas y asigna clientes'}
                    {currentView === 'editSales' && 'Edita ventas existentes'}
                    {currentView === 'clients' && 'Administra la información de tus clientes'}
                    {currentView === 'inventory' && 'Control de entradas y salidas por merma'}
                    {currentView === 'users' && 'Administra los usuarios y sus permisos de acceso al sistema'}
                    {currentView === 'tickets' && 'Busca y consulta tickets registrados'}
                    {currentView === 'credits' && 'Administra las cuentas pendientes de tus clientes'}
                    {currentView === 'notifications' && 'Mira las notificaciones del sistema'}
                    {currentView === 'cashRegister' && 'Administra la caja y realiza pagos'}
                    {currentView === 'salesReports' && 'Genera y visualiza reportes de ventas'}
                    {currentView === 'suppliers' && 'Gestiona tus proveedores y productos que surten'}
                  </p>
                </div>
              </div>

              {/* User Info & Logout */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <UserIconLucide className="w-4 h-4 text-gray-500" />
                    <p className="text-sm">{currentUser.fullName}</p>
                  </div>
                  <Badge variant={getRoleBadgeVariant(currentUser.role)} className="text-xs mt-1">
                    {currentUser.role}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-6 py-8 overflow-auto">
          {currentView === 'dashboard' && (
            <Dashboard />
          )}

          {currentView === 'sales' && currentUser && (
            <SalesRegistration
              products={products}
              clients={clients}
              currentUser={currentUser}
              users={users}
              onSaleComplete={handleSaleComplete}
              onAddClient={handleAddClient}
            />
          )}

          {currentView === 'editSales' && (
            <SalesEdit
              sales={sales}
              products={products}
              clients={clients}
              currentUser={currentUser}
              users={users}
              onModifySale={handleModifySale}
              onCancelSale={handleCancelSale}
            />
          )}

          {currentView === 'clients' && (
            <ClientManagement
              clients={clients}
              credits={credits}
              currentUser={currentUser!}
              users={users}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onRegisterPayment={handleRegisterPayment}
            />
          )}

          {currentView === 'inventory' && (
            <InventoryManagement
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onRegisterWaste={addWaste}
              wasteRecords={wasteRecords}
              currentUser={currentUser}
              users={users}
            />
          )}

          {currentView === 'users' && (
            <UserManagement
              users={users}
              currentUser={currentUser!}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}


          {currentView === 'tickets' && (
            <TicketSearch sales={sales} />
          )}

          {currentView === 'credits' && (
            <CreditManagement
              credits={credits}
              currentUser={currentUser!}
              users={users}
              onRegisterPayment={handleRegisterPayment}
            />
          )}

          {currentView === 'notifications' && (
            <Notifications products={products} credits={credits} />
          )}

          {currentView === 'cashRegister' && currentUser && (
            <CashRegister
              sales={sales}
              closedDates={closedDates}
              onCloseCashRegister={handleCloseCashRegister}
              currentUserIsAdmin={currentUser.isAdmin}
              adminAuthorized={adminAuthorizedForView}
              currentUser={currentUser}
              cashStartInfo={cashStartInfo ?? null}
              users={users}
            />
          )}

          {currentView === 'salesReports' && currentUser && (
            <SalesReports
              reports={salesReports}
              currentUserIsAdmin={currentUser.isAdmin}
            />
          )}

          {currentView === 'suppliers' && currentUser && (
            <SupplierManagement
              suppliers={suppliers}
              products={products}
              currentUser={currentUser}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          )}
        </main>
      </div>
      <Toaster />
      <PinAuthDialog
        open={showPinAuth}
        onOpenChange={setShowPinAuth}
        onAuthSuccess={handlePinAuthSuccess}
        onAuthCancel={handlePinAuthCancel}
        users={users}
      />
    </div>
  );
}
