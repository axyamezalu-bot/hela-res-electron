import type { Product } from '../App';
import logoImage from '../assets/hela-solutions.jpeg';

interface DashboardProps {
    products?: Product[];
    onNavigateToProducts?: () => void;
}

export function Dashboard({ products: _products, onNavigateToProducts: _onNavigateToProducts }: DashboardProps = {}) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
            <div className="text-center space-y-8">
                <img
                    src={logoImage}
                    alt="ZERVE POS Logo"
                    className="w-96 h-auto mx-auto"
                />
                <div className="space-y-2">
                    <h1 className="text-gray-800">Bienvenido a HELA POS</h1>
                    <p className="text-gray-500">
                        Sistema de punto de venta para gestión integral de tu negocio
                    </p>
                </div>
            </div>
        </div>
    );
}
