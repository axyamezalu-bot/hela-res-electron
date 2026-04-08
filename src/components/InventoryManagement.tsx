import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Package, TrendingUp, AlertCircle, Plus, PlusCircle, DollarSign, Search, Edit2, History } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import type { Product, User } from '../App';
import type { WasteRecord } from '../services/wasteService';
import { PinAuthDialog } from './PinAuthDialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface InventoryManagementProps {
    products: Product[];
    onAddProduct: (product: Omit<Product, 'id'>) => void;
    onUpdateProduct: (productId: string, product: Omit<Product, 'id'>) => void;
    onRegisterWaste: (record: Omit<WasteRecord, 'id'>) => Promise<void>;
    wasteRecords: WasteRecord[];
    currentUser: User;
    users: User[];
}

interface InventoryMovement {
    id: string;
    type: 'entrada' | 'salida';
    productId: string;
    productName: string;
    quantity: number;
    reason: string;
    date: string;
}

const CATEGORIES = [
    'Aceite y Grasas',
    'Arroz, Frijol y Granos',
    'Café, Té y Sustitutos',
    'Cereales y Desayunos',
    'Enlatados y Conservas',
    'Galletas y Snacks',
    'Harinas y Repostería',
    'Pastas',
    'Salsas y Condimentos',
    'Queso a Granel',
    'Quesos Empacados',
    'Carnes Frías/Embutidos',
    'Cremas y Lácteos',
    'Huevo',
    'Frutas',
    'Verduras',
    'Refrescos',
    'Aguas y Jugos',
    'Bebidas Energizantes/Electrolitos',
    'Cervezas y Vinos',
    'Otros'
];

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function InventoryManagement({ products, onAddProduct, onUpdateProduct, onRegisterWaste, wasteRecords, currentUser, users }: InventoryManagementProps) {
    const [movements, setMovements] = useState<InventoryMovement[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPinAuth, setShowPinAuth] = useState(false);
    const [pendingAction, setPendingAction] = useState<'addProduct' | 'exitProduct' | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [exitQuantityError, setExitQuantityError] = useState('');
    const [exitReason, setExitReason] = useState('');

    // Historial de mermas filter
    const now = new Date();
    const [wasteFilterYear, setWasteFilterYear] = useState(now.getFullYear());
    const [wasteFilterMonth, setWasteFilterMonth] = useState(now.getMonth() + 1);

    const [entryForm, setEntryForm] = useState({
        productId: '',
        quantity: ''
    });
    const [exitForm, setExitForm] = useState({
        productId: '',
        quantity: ''
    });
    const [newProductForm, setNewProductForm] = useState({
        code: '',
        name: '',
        brand: '',
        category: '',
        description: '',
        purchasePrice: '',
        price: '',
        initialStock: '',
        minStock: '',
        saleUnit: 'unidad' as 'unidad' | 'kg' | 'g',
        pricePerKg: ''
    });
    const [editForm, setEditForm] = useState({
        code: '',
        name: '',
        brand: '',
        category: '',
        description: '',
        purchasePrice: '',
        price: '',
        minStock: '',
        saleUnit: 'unidad' as 'unidad' | 'kg' | 'g',
        pricePerKg: ''
    });

    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStockProducts = products.filter(p => p.stock <= p.minStock).length;
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    // Filter products based on search term
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Waste historial filtered by month/year
    const filteredWasteRecords = wasteRecords.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === wasteFilterYear && d.getMonth() + 1 === wasteFilterMonth;
    });
    const totalWasteUnits = filteredWasteRecords.reduce((sum, r) => sum + r.quantity, 0);

    // Top 5 products by waste quantity in selected period
    const wasteByProduct = filteredWasteRecords.reduce<Record<string, { name: string; code: string; total: number }>>(
        (acc, r) => {
            const key = r.productCode;
            if (!acc[key]) acc[key] = { name: r.productName, code: r.productCode, total: 0 };
            acc[key].total += r.quantity;
            return acc;
        },
        {}
    );
    const top5Waste = Object.values(wasteByProduct)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    // Available years for filter (last 3 years + current)
    const availableYears = Array.from({ length: 4 }, (_, i) => now.getFullYear() - 3 + i);

    // Get selected product for exit form and validate quantity
    const selectedExitProduct = products.find(p => p.id === exitForm.productId);
    const exitQuantity = parseInt(exitForm.quantity) || 0;
    const isExitQuantityInvalid = selectedExitProduct && exitQuantity > 0 && exitQuantity > selectedExitProduct.stock;

    // Update exit quantity with validation
    const handleExitQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setExitForm({ ...exitForm, quantity: value });

        const qty = parseInt(value) || 0;
        if (selectedExitProduct && qty > 0 && qty > selectedExitProduct.stock) {
            setExitQuantityError(`La cantidad ingresada excede el inventario disponible. Debe ser menor o igual a ${selectedExitProduct.stock} unidades.`);
        } else {
            setExitQuantityError('');
        }
    };

    const handleProductEntry = (e: React.FormEvent) => {
        e.preventDefault();

        if (!entryForm.productId || !entryForm.quantity) {
            toast.error('Por favor complete todos los campos');
            return;
        }

        const product = products.find(p => p.id === entryForm.productId);
        if (!product) return;

        const quantity = parseInt(entryForm.quantity);

        const updatedProduct: Omit<Product, 'id'> = {
            ...product,
            stock: product.stock + quantity
        };

        onUpdateProduct(product.id, updatedProduct);

        const movement: InventoryMovement = {
            id: Date.now().toString(),
            type: 'entrada',
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            reason: 'Ingreso de producto',
            date: new Date().toLocaleString('es-MX')
        };

        setMovements([movement, ...movements]);
        toast.success('Entrada registrada exitosamente');
        setEntryForm({ productId: '', quantity: '' });
    };

    const handleProductExit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!exitForm.productId || !exitForm.quantity) {
            toast.error('Por favor complete todos los campos');
            return;
        }

        if (!exitReason.trim()) {
            toast.error('El motivo de merma es obligatorio');
            return;
        }

        // Check if user is cashier - require PIN
        if (currentUser.role === 'Cajero') {
            setPendingAction('exitProduct');
            setShowPinAuth(true);
            return;
        }

        // Admin/Owner can exit directly
        processProductExit();
    };

    const processProductExit = async () => {
        const product = products.find(p => p.id === exitForm.productId);
        if (!product) return;

        const quantity = parseInt(exitForm.quantity);

        // Actualizar el stock del producto
        const updatedProduct: Omit<Product, 'id'> = {
            ...product,
            stock: product.stock - quantity
        };

        onUpdateProduct(product.id, updatedProduct);

        // Registrar merma en la BD
        try {
            await onRegisterWaste({
                productId: product.id,
                productName: product.name,
                productCode: product.code,
                quantity,
                reason: exitReason,
                userId: currentUser.id,
                userName: currentUser.fullName,
                date: new Date().toISOString(),
            });
        } catch {
            toast.error('Error al registrar la merma en el historial');
        }

        const movement: InventoryMovement = {
            id: Date.now().toString(),
            type: 'salida',
            productId: product.id,
            productName: product.name,
            quantity,
            reason: exitReason,
            date: new Date().toLocaleString('es-MX')
        };

        setMovements([movement, ...movements]);
        toast.success('Salida por merma registrada exitosamente');
        setExitForm({ productId: '', quantity: '' });
        setExitReason('');
    };

    const handleAddProduct = (e: React.FormEvent) => {
        e.preventDefault();

        const isWeightBased = newProductForm.saleUnit === 'kg' || newProductForm.saleUnit === 'g';

        if (!newProductForm.code || !newProductForm.name || !newProductForm.category || !newProductForm.purchasePrice || !newProductForm.initialStock) {
            toast.error('Por favor complete todos los campos obligatorios');
            return;
        }

        if (isWeightBased && !newProductForm.pricePerKg) {
            toast.error('Por favor ingrese el precio por kilogramo');
            return;
        }

        if (!isWeightBased && !newProductForm.price) {
            toast.error('Por favor complete todos los campos obligatorios');
            return;
        }

        const purchasePrice = parseFloat(newProductForm.purchasePrice);

        if (!isWeightBased) {
            const salePrice = parseFloat(newProductForm.price);
            if (salePrice <= purchasePrice) {
                toast.error('El precio de venta debe ser mayor al precio de compra');
                return;
            }
        }

        processAddProduct();
    };

    const processAddProduct = () => {
        const initialStock = parseInt(newProductForm.initialStock);
        const isWeightBased = newProductForm.saleUnit === 'kg' || newProductForm.saleUnit === 'g';

        const newProduct: Omit<Product, 'id'> = {
            code: newProductForm.code,
            name: newProductForm.name,
            category: newProductForm.category,
            brand: newProductForm.brand || undefined,
            description: newProductForm.description || undefined,
            purchasePrice: parseFloat(newProductForm.purchasePrice),
            price: isWeightBased ? parseFloat(newProductForm.pricePerKg) : parseFloat(newProductForm.price),
            initialStock: initialStock,
            stock: initialStock,
            minStock: newProductForm.minStock ? parseInt(newProductForm.minStock) : 0,
            saleUnit: newProductForm.saleUnit,
            pricePerKg: isWeightBased ? parseFloat(newProductForm.pricePerKg) : undefined,
        };

        onAddProduct(newProduct);
        toast.success('Producto agregado exitosamente');
        setNewProductForm({
            code: '',
            name: '',
            brand: '',
            category: '',
            description: '',
            purchasePrice: '',
            price: '',
            initialStock: '',
            minStock: '',
            saleUnit: 'unidad',
            pricePerKg: ''
        });
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setEditForm({
            code: product.code,
            name: product.name,
            brand: product.brand || '',
            category: product.category,
            description: product.description || '',
            purchasePrice: product.purchasePrice.toString(),
            price: product.price.toString(),
            minStock: product.minStock.toString(),
            saleUnit: product.saleUnit ?? 'unidad',
            pricePerKg: product.pricePerKg?.toString() ?? ''
        });
        setShowEditDialog(true);
    };

    const handleSaveEdit = () => {
        if (currentUser.role === 'Cajero') {
            toast.error('No tienes permisos para editar productos');
            return;
        }
        if (!editingProduct) return;

        const isWeightBased = editForm.saleUnit === 'kg' || editForm.saleUnit === 'g';

        if (!editForm.code || !editForm.name || !editForm.category || !editForm.purchasePrice) {
            toast.error('Por favor complete todos los campos obligatorios');
            return;
        }

        if (isWeightBased && !editForm.pricePerKg) {
            toast.error('Por favor ingrese el precio por kilogramo');
            return;
        }

        if (!isWeightBased && !editForm.price) {
            toast.error('Por favor complete todos los campos obligatorios');
            return;
        }

        const purchasePrice = parseFloat(editForm.purchasePrice);
        const salePrice = isWeightBased ? parseFloat(editForm.pricePerKg) : parseFloat(editForm.price);

        if (!isWeightBased && salePrice <= purchasePrice) {
            toast.error('El precio de venta debe ser mayor al precio de compra');
            return;
        }

        const updatedProduct: Omit<Product, 'id'> = {
            code: editForm.code,
            name: editForm.name,
            brand: editForm.brand || undefined,
            category: editForm.category,
            description: editForm.description || undefined,
            purchasePrice: purchasePrice,
            price: salePrice,
            initialStock: editingProduct.initialStock,
            stock: editingProduct.stock,
            minStock: editForm.minStock ? parseInt(editForm.minStock) : 0,
            saleUnit: editForm.saleUnit,
            pricePerKg: isWeightBased ? parseFloat(editForm.pricePerKg) : undefined,
        };

        onUpdateProduct(editingProduct.id, updatedProduct);
        toast.success('Producto actualizado exitosamente');
        setShowEditDialog(false);
        setEditingProduct(null);
    };

    const handlePinAuthorized = () => {
        setShowPinAuth(false);

        if (pendingAction === 'addProduct') {
            processAddProduct();
            setPendingAction(null);
        } else if (pendingAction === 'exitProduct') {
            processProductExit();
            setPendingAction(null);
        }
    };

    const handlePinCancelled = () => {
        setShowPinAuth(false);
        setPendingAction(null);
    };

    const tabCols = currentUser.role !== 'Cajero' ? 'grid-cols-5' : 'grid-cols-4';

    return (
        <div className="space-y-6">
            <Tabs defaultValue="inventory" className="w-full">
                <TabsList className={`grid w-full max-w-4xl ${tabCols}`}>
                    <TabsTrigger value="inventory">Resumen de Inventario</TabsTrigger>
                    <TabsTrigger value="entry">Ingreso de Productos</TabsTrigger>
                    <TabsTrigger value="exit">Salida por Merma</TabsTrigger>
                    <TabsTrigger value="waste">Historial de Mermas</TabsTrigger>
                    {currentUser.role !== 'Cajero' && <TabsTrigger value="add">Registrar Producto</TabsTrigger>}
                </TabsList>

                <TabsContent value="inventory" className="space-y-6">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-blue-600">Total Productos</p>
                                        <p className="text-3xl text-blue-700">{totalProducts}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                                        <Package className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-green-600">Unidades Totales</p>
                                        <p className="text-3xl text-green-700">{totalUnits}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-purple-50 border-purple-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-purple-600">Valor de Inventario</p>
                                        <p className="text-3xl text-purple-700">${totalInventoryValue.toFixed(2)}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-orange-50 border-orange-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-orange-600">Productos con Stock Bajo</p>
                                        <p className="text-3xl text-orange-700">{lowStockProducts}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                                        <AlertCircle className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Inventory Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Inventario Actual</CardTitle>
                            <CardDescription>
                                Busque y visualice todos los productos en el inventario
                            </CardDescription>
                            <div className="mt-4 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    type="text"
                                    placeholder="Buscar por nombre, código de barras, marca o categoría..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {products.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No hay productos registrados
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No se encontraron productos que coincidan con la búsqueda
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 text-sm">Código de Barras</th>
                                                <th className="text-left py-3 px-4 text-sm">Producto</th>
                                                <th className="text-left py-3 px-4 text-sm">Marca</th>
                                                <th className="text-left py-3 px-4 text-sm">Categoría</th>
                                                <th className="text-left py-3 px-4 text-sm">Descripción</th>
                                                <th className="text-left py-3 px-4 text-sm">Tipo</th>
                                                {currentUser.role !== 'Cajero' && <th className="text-right py-3 px-4 text-sm">Precio Compra</th>}
                                                <th className="text-right py-3 px-4 text-sm">Precio Venta</th>
                                                <th className="text-right py-3 px-4 text-sm">Cantidad</th>
                                                <th className="text-center py-3 px-4 text-sm">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredProducts.map((product) => (
                                                <tr key={product.id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4 text-sm">{product.code}</td>
                                                    <td className="py-3 px-4 text-sm">{product.name}</td>
                                                    <td className="py-3 px-4 text-sm">{product.brand || '-'}</td>
                                                    <td className="py-3 px-4 text-sm">{product.category}</td>
                                                    <td className="py-3 px-4 text-sm max-w-xs truncate">{product.description || '-'}</td>
                                                    <td className="py-3 px-4 text-sm">
                                                        {product.saleUnit === 'unidad' && <Badge variant="outline">Por unidad</Badge>}
                                                        {product.saleUnit === 'kg' && <Badge variant="secondary">$/kg</Badge>}
                                                        {product.saleUnit === 'g' && <Badge variant="secondary">$/g</Badge>}
                                                    </td>
                                                    {currentUser.role !== 'Cajero' && <td className="py-3 px-4 text-sm text-right">${product.purchasePrice.toFixed(2)}</td>}
                                                    <td className="py-3 px-4 text-sm text-right">${product.price.toFixed(2)}</td>
                                                    <td className="py-3 px-4 text-sm text-right">{product.stock}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditClick(product)}
                                                            className="flex items-center gap-2"
                                                            disabled={currentUser.role === 'Cajero'}
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="entry">
                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle>Registrar Ingreso de Productos</CardTitle>
                            <CardDescription>
                                Registre las entradas de productos al inventario
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProductEntry} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="entry-product">Producto *</Label>
                                    <Select
                                        value={entryForm.productId}
                                        onValueChange={(value) => setEntryForm({ ...entryForm, productId: value })}
                                    >
                                        <SelectTrigger id="entry-product">
                                            <SelectValue placeholder="Seleccione un producto" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((product) => (
                                                <SelectItem key={product.id} value={product.id}>
                                                    {product.code} - {product.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="entry-quantity">Cantidad *</Label>
                                    <Input
                                        id="entry-quantity"
                                        type="number"
                                        min="1"
                                        placeholder="0"
                                        value={entryForm.quantity}
                                        onChange={(e) => setEntryForm({ ...entryForm, quantity: e.target.value })}
                                        required
                                    />
                                </div>

                                <Button type="submit" className="w-full">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Registrar Entrada
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="exit">
                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle>Registrar Salida por Merma</CardTitle>
                            <CardDescription>
                                Registre las salidas de productos por merma o pérdida
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProductExit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="exit-product">Producto *</Label>
                                    <Select
                                        value={exitForm.productId}
                                        onValueChange={(value) => {
                                            setExitForm({ ...exitForm, productId: value, quantity: '' });
                                            setExitQuantityError('');
                                        }}
                                    >
                                        <SelectTrigger id="exit-product">
                                            <SelectValue placeholder="Seleccione un producto" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((product) => (
                                                <SelectItem key={product.id} value={product.id}>
                                                    {product.code} - {product.name} (Stock: {product.stock})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedExitProduct && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-sm text-blue-700">
                                            Existencias disponibles: <span className="font-semibold">{selectedExitProduct.stock} unidades</span>
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="exit-quantity">Cantidad a eliminar por merma *</Label>
                                    <Input
                                        id="exit-quantity"
                                        type="number"
                                        min="1"
                                        placeholder="0"
                                        value={exitForm.quantity}
                                        onChange={handleExitQuantityChange}
                                        className={isExitQuantityInvalid ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                        required
                                    />
                                    {isExitQuantityInvalid && (
                                        <p className="text-red-500 text-sm mt-1">{exitQuantityError}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="exit-reason">Motivo de merma *</Label>
                                    <Input
                                        id="exit-reason"
                                        placeholder="Ej: Caducidad, daño, robo, etc."
                                        value={exitReason}
                                        onChange={(e) => setExitReason(e.target.value)}
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    variant="destructive"
                                    className="w-full"
                                    disabled={isExitQuantityInvalid || !exitForm.productId || !exitForm.quantity || !exitReason.trim()}
                                >
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Registrar Salida por Merma
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="waste" className="space-y-6">
                    {/* Filter controls */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Label>Mes:</Label>
                            <select
                                value={wasteFilterMonth}
                                onChange={(e) => setWasteFilterMonth(parseInt(e.target.value))}
                                className="rounded-md border border-gray-300 p-2 text-sm"
                            >
                                {MONTH_NAMES.map((name, i) => (
                                    <option key={i + 1} value={i + 1}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label>Año:</Label>
                            <select
                                value={wasteFilterYear}
                                onChange={(e) => setWasteFilterYear(parseInt(e.target.value))}
                                className="rounded-md border border-gray-300 p-2 text-sm"
                            >
                                {availableYears.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <Badge variant="outline" className="text-sm">
                            {totalWasteUnits} unidades mermadas en el período
                        </Badge>
                    </div>

                    {/* Top 5 summary */}
                    {top5Waste.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Top 5 productos con más mermas — {MONTH_NAMES[wasteFilterMonth - 1]} {wasteFilterYear}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {top5Waste.map((item, idx) => (
                                        <div key={item.code} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400 w-4">{idx + 1}.</span>
                                                <span>{item.name}</span>
                                                <span className="text-gray-400 text-xs">({item.code})</span>
                                            </div>
                                            <Badge variant="destructive">{item.total} uds.</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Waste table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Mermas</CardTitle>
                            <CardDescription>
                                {MONTH_NAMES[wasteFilterMonth - 1]} {wasteFilterYear} — {filteredWasteRecords.length} {filteredWasteRecords.length === 1 ? 'registro' : 'registros'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filteredWasteRecords.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No hay mermas registradas en este período
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 text-sm">Fecha</th>
                                                <th className="text-left py-3 px-4 text-sm">Producto</th>
                                                <th className="text-left py-3 px-4 text-sm">Código</th>
                                                <th className="text-right py-3 px-4 text-sm">Cantidad</th>
                                                <th className="text-left py-3 px-4 text-sm">Motivo</th>
                                                <th className="text-left py-3 px-4 text-sm">Usuario</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredWasteRecords.map((record) => (
                                                <tr key={record.id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {new Date(record.date).toLocaleDateString('es-MX', {
                                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm">{record.productName}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">{record.productCode}</td>
                                                    <td className="py-3 px-4 text-sm text-right">
                                                        <Badge variant="destructive">{record.quantity}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm">{record.reason}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">{record.userName}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {currentUser.role !== 'Cajero' && (
                    <TabsContent value="add">
                        <Card className="max-w-2xl">
                            <CardHeader>
                                <CardTitle>Agregar Nuevo Producto</CardTitle>
                                <CardDescription>
                                    Agregue un nuevo producto al inventario
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddProduct} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="add-code">Código de Barras *</Label>
                                        <Input
                                            id="add-code"
                                            placeholder="Ej: 7501234567890"
                                            value={newProductForm.code}
                                            onChange={(e) => setNewProductForm({ ...newProductForm, code: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="add-name">Nombre del Producto *</Label>
                                        <Input
                                            id="add-name"
                                            placeholder="Ej: Coca Cola 355ml"
                                            value={newProductForm.name}
                                            onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="add-category">Categoría *</Label>
                                        <Select
                                            value={newProductForm.category}
                                            onValueChange={(value) => setNewProductForm({ ...newProductForm, category: value })}
                                        >
                                            <SelectTrigger id="add-category">
                                                <SelectValue placeholder="Seleccione una categoría" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CATEGORIES.map((category) => (
                                                    <SelectItem key={category} value={category}>
                                                        {category}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="add-brand">Marca</Label>
                                        <Input
                                            id="add-brand"
                                            placeholder="Ej: Nescafé, Bimbo, La Costeña"
                                            value={newProductForm.brand}
                                            onChange={(e) => setNewProductForm({ ...newProductForm, brand: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="add-purchasePrice">Precio de Compra *</Label>
                                        <Input
                                            id="add-purchasePrice"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={newProductForm.purchasePrice}
                                            onChange={(e) => setNewProductForm({ ...newProductForm, purchasePrice: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {newProductForm.saleUnit === 'unidad' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="add-price">Precio de Venta *</Label>
                                            <Input
                                                id="add-price"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={newProductForm.price}
                                                onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="add-saleUnit">Tipo de venta *</Label>
                                        <Select
                                            value={newProductForm.saleUnit}
                                            onValueChange={(value) => setNewProductForm({
                                                ...newProductForm,
                                                saleUnit: value as 'unidad' | 'kg' | 'g'
                                            })}
                                        >
                                            <SelectTrigger id="add-saleUnit">
                                                <SelectValue placeholder="Seleccione tipo de venta" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unidad">Por unidad</SelectItem>
                                                <SelectItem value="kg">Por kilogramo (kg)</SelectItem>
                                                <SelectItem value="g">Por gramo (g)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {(newProductForm.saleUnit === 'kg' || newProductForm.saleUnit === 'g') && (
                                        <div className="space-y-2">
                                            <Label htmlFor="add-pricePerKg">Precio por kilogramo *</Label>
                                            <Input
                                                id="add-pricePerKg"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={newProductForm.pricePerKg}
                                                onChange={(e) => setNewProductForm({
                                                    ...newProductForm,
                                                    pricePerKg: e.target.value
                                                })}
                                            />
                                            <p className="text-xs text-gray-500">
                                                {newProductForm.saleUnit === 'g'
                                                    ? 'El precio por gramo se calculará automáticamente (precio/1000)'
                                                    : 'Precio base para calcular el costo según el peso'}
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="add-stock">Cantidad Inicial *</Label>
                                        <Input
                                            id="add-stock"
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={newProductForm.initialStock}
                                            onChange={(e) => setNewProductForm({ ...newProductForm, initialStock: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="add-minStock">Stock Mínimo</Label>
                                        <Input
                                            id="add-minStock"
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={newProductForm.minStock}
                                            onChange={(e) => setNewProductForm({ ...newProductForm, minStock: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="add-description">Descripción</Label>
                                        <Textarea
                                            id="add-description"
                                            placeholder=""
                                            value={newProductForm.description}
                                            onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full">
                                        <PlusCircle className="w-4 h-4 mr-2" />
                                        Agregar Producto
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Producto</DialogTitle>
                        <DialogDescription>
                            Modifique la información del producto
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-code">Código de Barras *</Label>
                            <Input
                                id="edit-code"
                                value={editForm.code}
                                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nombre del Producto *</Label>
                            <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-brand">Marca</Label>
                            <Input
                                id="edit-brand"
                                value={editForm.brand}
                                onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-category">Categoría *</Label>
                            <Select
                                value={editForm.category}
                                onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                            >
                                <SelectTrigger id="edit-category">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Descripción</Label>
                            <Textarea
                                id="edit-description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-purchasePrice">Precio de Compra *</Label>
                            <Input
                                id="edit-purchasePrice"
                                type="number"
                                step="0.01"
                                min="0"
                                value={editForm.purchasePrice}
                                onChange={(e) => setEditForm({ ...editForm, purchasePrice: e.target.value })}
                                required
                            />
                        </div>

                        {editForm.saleUnit === 'unidad' && (
                            <div className="space-y-2">
                                <Label htmlFor="edit-price">Precio de Venta *</Label>
                                <Input
                                    id="edit-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="edit-minStock">Stock Mínimo</Label>
                            <Input
                                id="edit-minStock"
                                type="number"
                                min="0"
                                value={editForm.minStock}
                                onChange={(e) => setEditForm({ ...editForm, minStock: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-saleUnit">Tipo de venta *</Label>
                            <Select
                                value={editForm.saleUnit}
                                onValueChange={(value) => setEditForm({
                                    ...editForm,
                                    saleUnit: value as 'unidad' | 'kg' | 'g'
                                })}
                            >
                                <SelectTrigger id="edit-saleUnit">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unidad">Por unidad</SelectItem>
                                    <SelectItem value="kg">Por kilogramo (kg)</SelectItem>
                                    <SelectItem value="g">Por gramo (g)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(editForm.saleUnit === 'kg' || editForm.saleUnit === 'g') && (
                            <div className="space-y-2">
                                <Label htmlFor="edit-pricePerKg">Precio por kilogramo *</Label>
                                <Input
                                    id="edit-pricePerKg"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={editForm.pricePerKg}
                                    onChange={(e) => setEditForm({
                                        ...editForm,
                                        pricePerKg: e.target.value
                                    })}
                                />
                                <p className="text-xs text-gray-500">
                                    {editForm.saleUnit === 'g'
                                        ? 'El precio por gramo se calculará automáticamente (precio/1000)'
                                        : 'Precio base para calcular el costo según el peso'}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2 justify-end pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancelar
                            </Button>
                            <Button type="button" onClick={handleSaveEdit}>
                                Guardar Cambios
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <PinAuthDialog
                open={showPinAuth}
                onOpenChange={setShowPinAuth}
                users={users}
                onAuthSuccess={handlePinAuthorized}
                onAuthCancel={handlePinCancelled}
            />
        </div>
    );
}
