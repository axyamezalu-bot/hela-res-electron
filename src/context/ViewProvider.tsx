import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';
import { PinAuthDialog } from '../components/PinAuthDialog';
import type { User } from '../App'; // Asumimos que los tipos están en App.tsx o en un archivo de tipos

export type ViewType = 'dashboard' | 'users' | 'tickets' | 'credits' | 'inventory' | 'notifications' | 'sales' | 'clients' | 'editSales' | 'cashRegister' | 'salesReports' | 'ticketSearch' | 'lastTicket';

interface ViewContextType {
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;
    adminAuthorizedForView: boolean;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

// El provider ahora necesita conocer al usuario y la lista de usuarios
interface ViewProviderProps {
    children: ReactNode;
    currentUser: User | null;
    users: User[];
}

export function ViewProvider({ children, currentUser, users }: ViewProviderProps) {
    const [currentView, setInternalCurrentView] = useState<ViewType>('dashboard');
    const [pendingView, setPendingView] = useState<ViewType | null>(null);
    const [showPinAuth, setShowPinAuth] = useState(false);
    const [adminAuthorizedForView, setAdminAuthorizedForView] = useState(false);

    const setCurrentView = (newView: ViewType) => {
        setAdminAuthorizedForView(false); // Siempre reseteamos la autorización al cambiar de vista

        // Lógica de autorización por PIN para Cajeros
        const isProtectedView = newView === 'salesReports' || newView === 'cashRegister';
        if (currentUser?.role === 'Cajero' && isProtectedView) {
            setPendingView(newView);
            setShowPinAuth(true);
            return; // Detenemos la navegación hasta que se autorice
        }

        setInternalCurrentView(newView);
    };

    const handlePinAuthSuccess = () => {
        if (pendingView) {
            setInternalCurrentView(pendingView);
            setAdminAuthorizedForView(true); // Marcamos que la vista fue autorizada
        }
        setShowPinAuth(false);
        setPendingView(null);
    };

    const handlePinAuthCancel = () => {
        setShowPinAuth(false);
        setPendingView(null);
    };

    return (
        <ViewContext.Provider value={{ currentView, setCurrentView, adminAuthorizedForView }}>
            {children}
            <PinAuthDialog
                open={showPinAuth}
                onOpenChange={setShowPinAuth}
                onAuthSuccess={handlePinAuthSuccess}
                onAuthCancel={handlePinAuthCancel}
                users={users}
            />
        </ViewContext.Provider>
    );
}

export function useView() {
    const context = useContext(ViewContext);
    if (!context) {
        throw new Error('useView must be used within a ViewProvider');
    }
    return context;
}