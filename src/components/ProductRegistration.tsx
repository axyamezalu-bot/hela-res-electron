import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../App';

interface ProductRegistrationProps {
    onAddProduct: (product: Omit<Product, 'id'>) => void;
}

const CATEGORIES = [
    'Cerveza',
    'Vino',
    'Tequila',
    'Whisky',
    'Ron',
    'Vodka',
    'Brandy',
    'Ginebra',
    'Mezcal',
    'Licores',
    'Refrescos',
    'Agua',
    'Energizantes',
    'Botanas',
    'Cigarros',
    'Hielo',
    'Otros'
];

export function ProductRegistration({ onAddProduct }: ProductRegistrationProps) {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        brand: '',
        category: '',
        description: '',
        purchasePrice: '',
        price: '',
        initialStock: '',
        minStock: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.code || !formData.name || !formData.category || !formData.purchasePrice || !formData.price || !formData.initialStock) {
            toast.error('Por favor complete todos los campos obligatorios');
            return;
        }

        const purchasePrice = parseFloat(formData.purchasePrice);
        const salePrice = parseFloat(formData.price);

        if (salePrice <= purchasePrice) {
            toast.error('El precio de venta debe ser mayor al precio de compra');
            return;
        }

        const initialStock = parseInt(formData.initialStock);

        const product: Omit<Product, 'id'> = {
            code: formData.code,
            name: formData.name,
            brand: formData.brand || undefined,
            category: formData.category,
            description: formData.description || undefined,
            purchasePrice: purchasePrice,
            price: salePrice,
            initialStock: initialStock,
            stock: initialStock, // Stock inicial es el mismo que la cantidad inicial
            minStock: formData.minStock ? parseInt(formData.minStock) : 0
        };

        onAddProduct(product);
        toast.success('Producto registrado exitosamente');

        // Reset form
        setFormData({
            code: '',
            name: '',
            brand: '',
            category: '',
            description: '',
            purchasePrice: '',
            price: '',
            initialStock: '',
            minStock: ''
        });
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Card className="max-w-4xl">
            <CardHeader>
                <CardTitle>Registrar Nuevo Producto</CardTitle>
                <CardDescription>
                    Complete la información del producto que desea agregar al inventario
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Código de Barras */}
                        <div className="space-y-2">
                            <Label htmlFor="code">Código de Barras *</Label>
                            <Input
                                id="code"
                                placeholder="Ej: 7501234567890"
                                value={formData.code}
                                onChange={(e) => handleChange('code', e.target.value)}
                                required
                            />
                        </div>

                        {/* Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Producto *</Label>
                            <Input
                                id="name"
                                placeholder="Tecate Light 355ml"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                required
                            />
                        </div>

                        {/* Marca */}
                        <div className="space-y-2">
                            <Label htmlFor="brand">Marca</Label>
                            <Input
                                id="brand"
                                placeholder="Tecate"
                                value={formData.brand}
                                onChange={(e) => handleChange('brand', e.target.value)}
                            />
                        </div>

                        {/* Categoría */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría *</Label>
                            <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Precio de Compra */}
                        <div className="space-y-2">
                            <Label htmlFor="purchasePrice">Precio de Compra *</Label>
                            <Input
                                id="purchasePrice"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={formData.purchasePrice}
                                onChange={(e) => handleChange('purchasePrice', e.target.value)}
                                required
                            />
                        </div>

                        {/* Precio de Venta */}
                        <div className="space-y-2">
                            <Label htmlFor="price">Precio de Venta *</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => handleChange('price', e.target.value)}
                                required
                            />
                        </div>

                        {/* Cantidad Inicial */}
                        <div className="space-y-2">
                            <Label htmlFor="initialStock">Cantidad Inicial *</Label>
                            <Input
                                id="initialStock"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={formData.initialStock}
                                onChange={(e) => handleChange('initialStock', e.target.value)}
                                required
                            />
                        </div>

                        {/* Mínimo Recomendado */}
                        <div className="space-y-2">
                            <Label htmlFor="minStock">Mínimo Recomendado</Label>
                            <Input
                                id="minStock"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={formData.minStock}
                                onChange={(e) => handleChange('minStock', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción (Opcional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Cerveza tipo lager ligera, presentación 355ml en lata, ideal para venta al público."
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={3}
                        />
                    </div>

                    <Button type="submit" className="w-full">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Registrar Producto
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}