import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { PinAuthDialog } from './components/PinAuthDialog';
import { FloorPlan } from './components/restaurant/FloorPlan';
import { OrderPanel } from './components/restaurant/OrderPanel';
import { MenuAdmin } from './components/restaurant/MenuAdmin';
import { UserManagement } from './components/restaurant/UserManagement';
import { InventoryManagement } from './components/restaurant/InventoryManagement';
import { Reports } from './components/restaurant/Reports';
import { useUsers } from './hooks/useUsers';
import { useWaste } from './hooks/useWaste';
import { useRestaurant } from './hooks/useRestaurant';
import { restaurantService } from './services/restaurantService';
import type { RestaurantTable, OrderItem, MenuItem } from './types/restaurant';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ChefHat,
  PackageOpen,
  Users as UsersIcon,
  FileText,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Toaster } from './components/ui/sonner';
import logoImage from './assets/hela-solutions.jpeg';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  pin?: string;
  role: 'Dueño' | 'Administrador' | 'Mesero';
  isAdmin: boolean;
  createdAt: string;
}

type ViewType = 'dashboard' | 'floorPlan' | 'menuAdmin' | 'inventory' | 'users' | 'reports';

interface NavItem {
  id: ViewType;
  label: string;
  icon: typeof LayoutDashboard;
}

export default function App() {
  const { users, addUser, updateUser, deleteUser } = useUsers();
  const {
    inventoryItems,
    wasteRecords,
    createItem,
    updateItem,
    deleteItem,
    addStock,
    registerWaste,
  } = useWaste();
  const {
    tables,
    activeOrders,
    menuCategories,
    menuItems,
    createTable,
    deleteTable,
    updateTablePosition,
    createOrder,
    addOrderItem,
    removeOrderItem,
    sendToKitchen,
    requestBill,
    closeOrder,
    cancelOrder,
    createCategory,
    deleteCategory,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    activeShift,
    openShift,
    closeShift,
  } = useRestaurant();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pendingView, setPendingView] = useState<ViewType | null>(null);

  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [orderPanelOpen, setOrderPanelOpen] = useState(false);
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [floorEditMode, setFloorEditMode] = useState(false);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const isAdmin = currentUser?.role === 'Dueño' || currentUser?.role === 'Administrador';

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'floorPlan', label: 'Mesas / Comandas', icon: UtensilsCrossed },
    ...(isAdmin
      ? ([
        { id: 'menuAdmin', label: 'Administrar Menú', icon: ChefHat },
        { id: 'inventory', label: 'Inventario', icon: PackageOpen },
        { id: 'users', label: 'Usuarios', icon: UsersIcon },
        { id: 'reports', label: 'Reportes', icon: FileText },
      ] as NavItem[])
      : []),
  ];

  const handleNavigate = (view: ViewType) => {
    if (view === 'reports' && currentUser?.role === 'Mesero') {
      setPendingView(view);
      setPinDialogOpen(true);
      return;
    }
    setCurrentView(view);
  };

  const handlePinAuthSuccess = () => {
    if (pendingView) setCurrentView(pendingView);
    setPendingView(null);
    setPinDialogOpen(false);
  };

  const handlePinAuthCancel = () => {
    setPendingView(null);
    setPinDialogOpen(false);
  };

  const loadOrderItems = async (orderId: string) => {
    const items = await restaurantService.getOrderItems(orderId);
    setCurrentOrderItems(items);
  };

  const handleTableClick = async (table: RestaurantTable) => {
    setSelectedTable(table);
    const order = activeOrders.find((o) => o.table_id === table.id);
    if (order) await loadOrderItems(order.id);
    else setCurrentOrderItems([]);
    setOrderPanelOpen(true);
  };

  const handleAddTable = async (data: {
    number: number;
    name: string;
    seats: number;
    shape: 'rectangle' | 'circle';
  }) => {
    await createTable({
      number: data.number,
      name: data.name,
      seats: data.seats,
      shape: data.shape,
      x: 100 + tables.length * 20,
      y: 100,
      width: 120,
      height: 80,
    });
  };

  // MenuAdmin expects (id, Partial<MenuItem>) — adapt to hook signature
  const handleUpdateMenuItem = async (id: string, data: Partial<MenuItem>) => {
    const existing = menuItems.find((m) => m.id === id);
    if (!existing) return;
    await updateMenuItem({
      id,
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      price: data.price ?? existing.price,
      available: (data.available ?? existing.available) === 1,
    });
  };

  if (!currentUser) {
    return (
      <>
        <LoginScreen users={users} onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return (
          <UserManagement
            users={users}
            currentUser={currentUser}
            onAddUser={addUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
          />
        );
      case 'inventory':
        return (
          <InventoryManagement
            inventoryItems={inventoryItems}
            wasteRecords={wasteRecords}
            currentUser={currentUser}
            onCreateItem={createItem}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
            onAddStock={addStock}
            onRegisterWaste={registerWaste}
          />
        );
      case 'reports':
        return (
          <Reports
            activeShift={activeShift}
            currentUser={currentUser}
            onOpenShift={openShift}
            onCloseShift={closeShift}
          />
        );
      case 'menuAdmin':
        return (
          <MenuAdmin
            menuCategories={menuCategories}
            menuItems={menuItems}
            onCreateCategory={async (d) => { await createCategory(d); }}
            onDeleteCategory={deleteCategory}
            onCreateMenuItem={async (d) => { await createMenuItem(d); }}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={deleteMenuItem}
          />
        );
      case 'floorPlan':
        return (
          <>
            <FloorPlan
              tables={tables}
              activeOrders={activeOrders}
              currentUser={currentUser}
              editMode={floorEditMode}
              onEditModeChange={setFloorEditMode}
              onTableClick={handleTableClick}
              onUpdateTablePosition={updateTablePosition}
              onAddTable={handleAddTable}
              onDeleteTable={deleteTable}
            />
            {orderPanelOpen && selectedTable && (
              <OrderPanel
                table={selectedTable}
                order={activeOrders.find((o) => o.table_id === selectedTable.id) ?? null}
                orderItems={currentOrderItems}
                menuCategories={menuCategories}
                menuItems={menuItems}
                currentUser={currentUser}
                onCreateOrder={async () => {
                  const created = await createOrder({
                    table_id: selectedTable.id,
                    table_name: selectedTable.name,
                    waiter_id: currentUser.id,
                    waiter_name: currentUser.fullName,
                  });
                  await loadOrderItems(created.id);
                }}
                onAddItem={async (item, qty, notes) => {
                  const order = activeOrders.find((o) => o.table_id === selectedTable.id);
                  if (!order) return;
                  await addOrderItem({
                    order_id: order.id,
                    menu_item_id: item.id,
                    menu_item_name: item.name,
                    unit_price: item.price,
                    quantity: qty,
                    notes,
                  });
                  await loadOrderItems(order.id);
                }}
                onRemoveItem={async (oi) => {
                  await removeOrderItem({
                    item_id: oi.id,
                    order_id: oi.order_id,
                    quantity: oi.quantity,
                    unit_price: oi.unit_price,
                  });
                  await loadOrderItems(oi.order_id);
                }}
                onSendToKitchen={async () => {
                  const order = activeOrders.find((o) => o.table_id === selectedTable.id);
                  if (!order) return [];
                  const sent = await sendToKitchen(order.id);
                  await loadOrderItems(order.id);
                  return sent;
                }}
                onRequestBill={async () => {
                  await requestBill(selectedTable.id);
                }}
                onCloseOrder={async (pm) => {
                  const order = activeOrders.find((o) => o.table_id === selectedTable.id);
                  if (!order) return;
                  await closeOrder({
                    order_id: order.id,
                    table_id: selectedTable.id,
                    payment_method: pm,
                  });
                  setOrderPanelOpen(false);
                  setSelectedTable(null);
                  setCurrentOrderItems([]);
                }}
                onCancelOrder={async () => {
                  const order = activeOrders.find((o) => o.table_id === selectedTable.id);
                  if (!order) return;
                  await cancelOrder({ order_id: order.id, table_id: selectedTable.id });
                  setOrderPanelOpen(false);
                  setSelectedTable(null);
                  setCurrentOrderItems([]);
                }}
                onPrintKitchenTicket={async (items) => {
                  const order = activeOrders.find((o) => o.table_id === selectedTable.id);
                  if (!order) return;
                  await restaurantService.printKitchenTicket({
                    tableNumber: selectedTable.number,
                    tableName: selectedTable.name,
                    waiterName: currentUser.fullName,
                    orderId: order.id,
                    items: items.map((i) => ({
                      name: i.menu_item_name,
                      quantity: i.quantity,
                      notes: i.notes,
                    })),
                  });
                }}
                onClose={() => {
                  setOrderPanelOpen(false);
                  setSelectedTable(null);
                  setCurrentOrderItems([]);
                }}
              />
            )}
          </>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-200 bg-white border-r overflow-hidden`}
      >
        <div className="p-4 border-b">
          <img src={logoImage} alt="HELA RES" className="w-full h-auto" />
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${active ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-700'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h2 className="text-lg font-medium">HELA RES</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{currentUser.fullName}</span>
            <Badge variant="outline">{currentUser.role}</Badge>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{renderView()}</main>
      </div>

      <PinAuthDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        users={users}
        onAuthSuccess={handlePinAuthSuccess}
        onAuthCancel={handlePinAuthCancel}
      />
      <Toaster />
    </div>
  );
}

