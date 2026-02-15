import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', cratePrice: '', stock: '', category: '', bottlesPerCrate: 24 });
    const [editingId, setEditingId] = useState(null);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            const mappedProducts = response.data.map(p => ({
                ...p,
                stock: p.stockQuantity,
                category: p.groupName
            }));
            setProducts(mappedProducts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const bpc = parseInt(formData.bottlesPerCrate) || 24;
            const pricePerBottle = (parseFloat(formData.cratePrice) / bpc).toFixed(2);

            const payload = {
                name: formData.name,
                price: pricePerBottle,
                stock: formData.stock,
                groupName: formData.category, // Backend expects groupName
                bottlesPerCrate: bpc
            };

            if (editingId) {
                await api.put(`/products/${editingId}`, payload);
            } else {
                await api.post('/products', payload);
            }
            setIsModalOpen(false);
            setFormData({ name: '', cratePrice: '', stock: '', category: '', bottlesPerCrate: 24 });
            setEditingId(null);
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert("Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (error) {
            console.error(error);
        }
    };

    const startEdit = (product) => {
        const bpc = product.bottlesPerCrate || 24;
        setFormData({
            name: product.name,
            cratePrice: (product.price * bpc).toFixed(2),
            stock: product.stock,
            category: product.category,
            bottlesPerCrate: bpc
        });
        setEditingId(product.id);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Products</h1>
                <button
                    onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData({ name: '', cratePrice: '', stock: '', category: '', bottlesPerCrate: 24 }); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} /> Add Product
                </button>
            </div>

            {loading ? <div>Loading...</div> : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {products.map(product => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900">
                                                ₹{(product.price * (product.bottlesPerCrate || 24)).toFixed(2)} <span className="text-xs text-slate-500 font-normal">/ crate</span>
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                ₹{product.price} <span className="text-[10px] text-slate-400">/ unit</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => startEdit(product)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Product' : 'New Product'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                                <input type="text" className="w-full border p-2 rounded mt-1" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Price Per Crate</label>
                                    <input type="number" step="0.01" className="w-full border p-2 rounded mt-1" value={formData.cratePrice} onChange={e => setFormData({ ...formData, cratePrice: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bottles/Crate</label>
                                    <input type="number" className="w-full border p-2 rounded mt-1" value={formData.bottlesPerCrate} onChange={e => setFormData({ ...formData, bottlesPerCrate: e.target.value })} required />
                                </div>
                            </div>

                            {formData.cratePrice && formData.bottlesPerCrate && (
                                <p className="text-xs text-gray-500 text-right">
                                    Calculated: ₹{(parseFloat(formData.cratePrice) / parseInt(formData.bottlesPerCrate)).toFixed(2)} / bottle
                                </p>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                                <input type="number" className="w-full border p-2 rounded mt-1" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} required />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <input type="text" className="w-full border p-2 rounded mt-1" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
