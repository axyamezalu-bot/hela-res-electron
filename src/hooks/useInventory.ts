import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { productServiceElectron } from '../services/productService.electron';
import type { Product } from '../App';

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

export function useInventory() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isElectron) {
                const data = await productServiceElectron.getAll();
                setProducts(data);
                return;
            }
            const data = await productService.getAll();
            setProducts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
        setError(null);
        try {
            if (isElectron) {
                const created = await productServiceElectron.create(product);
                setProducts(prev => [...prev, created]);
                return created;
            }
            const created = await productService.create(product);
            setProducts(prev => [...prev, created]);
            return created;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al crear producto';
            setError(msg);
            throw err;
        }
    };

    const updateProduct = async (id: string, product: Omit<Product, 'id'>): Promise<Product> => {
        setError(null);
        try {
            if (isElectron) {
                const updated = await productServiceElectron.update(id, product);
                setProducts(prev => prev.map(p => p.id === id ? updated : p));
                return updated;
            }
            const updated = await productService.update(id, product);
            setProducts(prev => prev.map(p => p.id === id ? updated : p));
            return updated;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al actualizar producto';
            setError(msg);
            throw err;
        }
    };

    const deleteProduct = async (id: string): Promise<void> => {
        setError(null);
        try {
            if (isElectron) {
                await productServiceElectron.delete(id);
                setProducts(prev => prev.filter(p => p.id !== id));
                return;
            }
            await productService.delete(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al eliminar producto';
            setError(msg);
            throw err;
        }
    };

    const updateStock = async (productId: string, newStock: number): Promise<void> => {
        setError(null);
        try {
            if (isElectron) {
                const updated = await productServiceElectron.updateStock(productId, newStock);
                setProducts(prev => prev.map(p => p.id === productId ? updated : p));
                return;
            }
            await productService.updateStock(productId, newStock);
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al actualizar stock';
            setError(msg);
            throw err;
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    return {
        products,
        loading,
        error,
        fetchProducts,
        refetch: fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
    };
}
