import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { PinAuthDialog } from './components/PinAuthDialog';
import { useUsers } from './hooks/useUsers';
import { useWaste } from './hooks/useWaste';
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
  const { users } = useUsers();
  useWaste();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pendingView, setPendingView] = useState<ViewType | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
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
        return <Placeholder label="Usuarios" icon={UsersIcon} />;
      case 'floorPlan':
        return <Placeholder label="Mesas / Comandas" icon={UtensilsCrossed} />;
      case 'menuAdmin':
        return <Placeholder label="Administrar Menú" icon={ChefHat} />;
      case 'inventory':
        return <Placeholder label="Inventario" icon={PackageOpen} />;
      case 'reports':
        return <Placeholder label="Reportes" icon={FileText} />;
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-700'
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

function Placeholder({
  label,
  icon: Icon,
}: {
  label: string;
  icon: typeof LayoutDashboard;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
      <Icon className="w-16 h-16" />
      <p className="text-lg">{label} — Módulo en construcción</p>
    </div>
  );
}
