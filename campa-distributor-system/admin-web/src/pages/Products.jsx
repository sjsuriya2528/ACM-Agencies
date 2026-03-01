import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2, Loader2, Package, Minus } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', purchaseCratePrice: '', sellingCratePrice: '', stock: '', category: '', bottlesPerCrate: 24, gstPercentage: 18.00 });
    const [editingId, setEditingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Stock Adjustment (Add/Reduce) State
    const [isStockAdjModalOpen, setIsStockAdjModalOpen] = useState(false);
    const [stockAdjData, setStockAdjData] = useState({ id: null, name: '', currentStock: 0, crates: '', bottles: '', bpc: 24, type: 'Addition', remarks: '' });

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            const mappedProducts = response.data.map(p => ({
                ...p,
                stock: p.stockQuantity,
                category: p.groupName
            })).sort((a, b) => a.id - b.id);
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
        setIsSubmitting(true);
        try {
            const bpc = parseInt(formData.bottlesPerCrate) || 24;
            const purchasePricePerBottle = (parseFloat(formData.purchaseCratePrice) / bpc).toFixed(4);
            const sellingPricePerBottle = formData.sellingCratePrice
                ? (parseFloat(formData.sellingCratePrice) / bpc).toFixed(4)
                : null;

            const payload = {
                name: formData.name,
                price: purchasePricePerBottle,
                sellingPrice: sellingPricePerBottle,
                stockQuantity: formData.stock,
                groupName: formData.category,
                bottlesPerCrate: bpc,
                gstPercentage: parseFloat(formData.gstPercentage) || 18.00
            };

            if (editingId) {
                await api.put(`/products/${editingId}`, payload);
            } else {
                await api.post('/products', payload);
            }
            setIsModalOpen(false);
            setFormData({ name: '', purchaseCratePrice: '', sellingCratePrice: '', stock: '', category: '', bottlesPerCrate: 24, gstPercentage: 18.00 });
            setEditingId(null);
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert("Operation failed");
        } finally {
            setIsSubmitting(false);
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
            purchaseCratePrice: (product.price * bpc).toFixed(2),
            sellingCratePrice: product.sellingPrice ? (product.sellingPrice * bpc).toFixed(2) : '',
            stock: product.stock,
            crates: (product.stock / bpc).toFixed(1),
            category: product.category,
            bottlesPerCrate: bpc,
            gstPercentage: product.gstPercentage || 18.00
        });
        setEditingId(product.id);
        setIsModalOpen(true);
    };

    const handleStockAdjClick = (product, type = 'Addition') => {
        setStockAdjData({
            id: product.id,
            name: product.name,
            currentStock: product.stock,
            crates: '',
            bottles: '',
            bpc: product.bottlesPerCrate || 24,
            type: type,
            remarks: ''
        });
        setIsStockAdjModalOpen(true);
    };

    const submitStockAdj = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const addedCrates = parseInt(stockAdjData.crates) || 0;
            const addedBottles = parseInt(stockAdjData.bottles) || 0;
            const totalToAdj = (addedCrates * stockAdjData.bpc) + addedBottles;

            if (totalToAdj === 0) {
                alert("Please enter a quantity");
                setIsSubmitting(false);
                return;
            }

            if (stockAdjData.type === 'Reduction' && !stockAdjData.remarks) {
                alert("Remarks are mandatory for stock reduction");
                setIsSubmitting(false);
                return;
            }

            await api.post(`/products/${stockAdjData.id}/adjust-stock`, {
                type: stockAdjData.type,
                quantity: totalToAdj,
                remarks: stockAdjData.remarks || (stockAdjData.type === 'Addition' ? 'Manual Addition' : '')
            });

            setIsStockAdjModalOpen(false);
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Failed to adjust stock");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative">
                    <h1 className="text-2xl font-bold text-gray-800">Products</h1>
                    <div className="h-1 w-20 bg-blue-600 rounded mt-1"></div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    <button
                        onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData({ name: '', purchaseCratePrice: '', sellingCratePrice: '', stock: '', category: '', bottlesPerCrate: 24, gstPercentage: 18.00 }); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-md transition-all transform hover:scale-105"
                    >
                        <Plus size={20} /> <span className="hidden sm:inline">Add Product</span>
                    </button>
                </div>
            </div>

            {loading ? <LoadingSpinner /> : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <span className="text-orange-600">Purchase Price</span>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <span className="text-emerald-600">Selling Price</span>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                                if (!Array.isArray(products)) {
                                    console.warn("Filter warning: 'products' is not an array in Products.jsx. Type:", typeof products, "Value:", products);
                                }
                                return (Array.isArray(products) ? products : []).filter(p =>
                                    (p.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                                    (p.category && p.category.toLowerCase().includes((searchTerm || '').toLowerCase()))
                                ).map(product => {
                                    const isSingle = product.name.toUpperCase().includes('SINGLE') || product.name.toUpperCase().includes('BOTTLE');
                                    const bpc = product.bottlesPerCrate || 24;

                                    // Stock is now always stored as Bottles
                                    const bottles = product.stock;
                                    const crates = isSingle ? '-' : Math.ceil(product.stock / bpc);

                                    return (
                                        <tr key={product.id} className="hover:bg-slate-50 transition-colors duration-150">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{product.id}</td>
                                            <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">{product.name}</td>
                                            {/* Purchase Price */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-orange-700">
                                                        ₹{(product.price * bpc).toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ crate</span>
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        ₹{Number(product.price).toFixed(4)} <span className="text-[10px]">/ btl</span>
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Selling Price */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {product.sellingPrice ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-emerald-700">
                                                            ₹{(product.sellingPrice * bpc).toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ crate</span>
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            ₹{Number(product.sellingPrice).toFixed(4)} <span className="text-[10px]">/ btl</span>
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-300 italic">Not set</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${bottles > 100 ? 'bg-green-100 text-green-800' :
                                                        bottles > 0 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>{bottles} btls</span>
                                                    <span className="text-xs text-slate-400 mt-0.5">{isSingle ? '—' : `${crates} crates`}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                                                    {product.category || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-medium bg-orange-50 text-orange-600 rounded-md border border-orange-100">
                                                    {product.gstPercentage}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => handleStockAdjClick(product, 'Addition')} className="text-emerald-600 hover:text-emerald-900 p-1.5 hover:bg-emerald-50 rounded-lg transition-colors" title="Add Stock"><Plus size={16} /></button>
                                                    <button onClick={() => handleStockAdjClick(product, 'Reduction')} className="text-orange-600 hover:text-orange-900 p-1.5 hover:bg-orange-50 rounded-lg transition-colors" title="Reduce Stock"><Minus size={16} /></button>
                                                    <button onClick={() => startEdit(product)} className="text-indigo-600 hover:text-indigo-900 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit"><Edit size={16} /></button>
                                                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })()
                            }
                        </tbody>
                    </table>
                </div>
            )
            }

            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all my-auto">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    {editingId ? <Edit size={20} /> : <Plus size={20} />}
                                    {editingId ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="e.g. Campa Cola 200ml"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    {/* Purchase Price */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Purchase Price / Crate <span className="text-orange-500 text-xs">(from trader)</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-400">₹</span>
                                            <input
                                                type="number" step="0.01"
                                                className="w-full pl-7 pr-4 py-2 border border-orange-200 bg-orange-50/30 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all outline-none"
                                                placeholder="0.00"
                                                value={formData.purchaseCratePrice}
                                                onChange={e => setFormData({ ...formData, purchaseCratePrice: e.target.value })}
                                                required
                                            />
                                        </div>
                                        {formData.purchaseCratePrice && formData.bottlesPerCrate && (
                                            <p className="text-xs text-orange-600 mt-1">
                                                ₹{(parseFloat(formData.purchaseCratePrice) / (parseInt(formData.bottlesPerCrate) || 24)).toFixed(4)}/btl
                                            </p>
                                        )}
                                    </div>
                                    {/* Selling Price */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Selling Price / Crate <span className="text-emerald-500 text-xs">(to retailers)</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-400">₹</span>
                                            <input
                                                type="number" step="0.01"
                                                className="w-full pl-7 pr-4 py-2 border border-emerald-200 bg-emerald-50/30 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all outline-none"
                                                placeholder="0.00"
                                                value={formData.sellingCratePrice}
                                                onChange={e => setFormData({ ...formData, sellingCratePrice: e.target.value })}
                                            />
                                        </div>
                                        {formData.sellingCratePrice && formData.bottlesPerCrate && (
                                            <p className="text-xs text-emerald-600 mt-1">
                                                ₹{(parseFloat(formData.sellingCratePrice) / (parseInt(formData.bottlesPerCrate) || 24)).toFixed(4)}/btl
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {/* Bottles per crate + price summary */}
                                <div className="grid grid-cols-2 gap-5 items-start">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bottles per Crate</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                            value={formData.bottlesPerCrate}
                                            onChange={e => setFormData({ ...formData, bottlesPerCrate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    {/* Margin preview */}
                                    {formData.purchaseCratePrice && formData.sellingCratePrice && (
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
                                            <p className="font-semibold text-slate-600 mb-1">Margin / Crate</p>
                                            <p className={`font-bold text-base ${parseFloat(formData.sellingCratePrice) >= parseFloat(formData.purchaseCratePrice)
                                                ? 'text-emerald-700' : 'text-red-600'
                                                }`}>
                                                ₹{(parseFloat(formData.sellingCratePrice) - parseFloat(formData.purchaseCratePrice)).toFixed(2)}
                                            </p>
                                            <p className="text-slate-400">
                                                {((parseFloat(formData.sellingCratePrice) - parseFloat(formData.purchaseCratePrice)) / parseFloat(formData.purchaseCratePrice) * 100).toFixed(1)}% margin
                                            </p>
                                        </div>
                                    )}
                                </div>



                                <div className="border-t border-gray-100 pt-4">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Initial Stock</h3>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Crates</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                                placeholder="0"
                                                value={formData.crates || ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    const bpc = parseInt(formData.bottlesPerCrate) || 24;
                                                    setFormData({
                                                        ...formData,
                                                        crates: val,
                                                        stock: val ? Math.round(val * bpc) : formData.stock
                                                    });
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Total Bottles</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                                placeholder="0"
                                                value={formData.stock}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    const bpc = parseInt(formData.bottlesPerCrate) || 24;
                                                    setFormData({
                                                        ...formData,
                                                        stock: val,
                                                        crates: val ? (val / bpc).toFixed(1) : ''
                                                    });
                                                }}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="e.g. Soft Drinks"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Percentage (%)</label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                                placeholder="18.00"
                                                value={formData.gstPercentage}
                                                onChange={e => setFormData({ ...formData, gstPercentage: e.target.value })}
                                                required
                                            />
                                            <span className="absolute right-3 top-2 text-gray-400">%</span>
                                        </div>
                                        <div className="flex gap-3 text-xs">
                                            <div className="bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-md">
                                                <span className="text-orange-600 block font-semibold">CGST</span>
                                                <span className="text-orange-700">{(parseFloat(formData.gstPercentage || 0) / 2).toFixed(2)}%</span>
                                            </div>
                                            <div className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-md">
                                                <span className="text-blue-600 block font-semibold">SGST</span>
                                                <span className="text-blue-700">{(parseFloat(formData.gstPercentage || 0) / 2).toFixed(2)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400">Total GST = CGST + SGST</p>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={isSubmitting}
                                        className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md shadow-blue-200 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                {editingId ? <Edit size={18} /> : <Package size={18} />}
                                                <span>{editingId ? 'Save Changes' : 'Create Product'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {
                isStockAdjModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
                            <div className={`bg-gradient-to-r ${stockAdjData.type === 'Addition' ? 'from-emerald-600 to-emerald-700' : 'from-orange-600 to-orange-700'} px-6 py-4 flex justify-between items-center`}>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Manual Stock {stockAdjData.type}</h2>
                                    <p className="text-white/80 text-sm opacity-90">{stockAdjData.name}</p>
                                </div>
                                <button onClick={() => setIsStockAdjModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>

                            <form onSubmit={submitStockAdj} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{stockAdjData.type === 'Addition' ? 'Add' : 'Reduce'} Crates</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                autoFocus
                                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${stockAdjData.type === 'Addition' ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-orange-500 focus:border-orange-500'} transition-all outline-none`}
                                                value={stockAdjData.crates}
                                                onChange={e => setStockAdjData({ ...stockAdjData, crates: e.target.value })}
                                                placeholder="0"
                                            />
                                            <span className="absolute right-2 top-2.5 text-xs text-gray-400">crts</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{stockAdjData.type === 'Addition' ? 'Add' : 'Reduce'} Bottles</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${stockAdjData.type === 'Addition' ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-orange-500 focus:border-orange-500'} transition-all outline-none`}
                                                value={stockAdjData.bottles}
                                                onChange={e => setStockAdjData({ ...stockAdjData, bottles: e.target.value })}
                                                placeholder="0"
                                            />
                                            <span className="absolute right-2 top-2.5 text-xs text-gray-400">btls</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks {stockAdjData.type === 'Reduction' && <span className="text-red-500">*</span>}</label>
                                    <textarea
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${stockAdjData.type === 'Addition' ? 'focus:ring-emerald-500' : 'focus:ring-orange-500'} transition-all outline-none`}
                                        rows="2"
                                        placeholder={stockAdjData.type === 'Addition' ? 'Manual stock addition' : 'Reason for reduction (e.g. Breakage, Return)'}
                                        value={stockAdjData.remarks}
                                        onChange={e => setStockAdjData({ ...stockAdjData, remarks: e.target.value })}
                                        required={stockAdjData.type === 'Reduction'}
                                    />
                                </div>

                                <div className={`rounded-xl p-4 space-y-2 border ${stockAdjData.type === 'Addition' ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Current Stock:</span>
                                        <span className="font-medium">{stockAdjData.currentStock} btls</span>
                                    </div>
                                    <div className={`flex justify-between text-sm ${stockAdjData.type === 'Addition' ? 'text-emerald-700' : 'text-orange-700'}`}>
                                        <span>{stockAdjData.type === 'Addition' ? 'Adding' : 'Reducing'}:</span>
                                        <span className="font-medium">{stockAdjData.type === 'Addition' ? '+' : '-'}{((parseInt(stockAdjData.crates) || 0) * stockAdjData.bpc) + (parseInt(stockAdjData.bottles) || 0)} btls</span>
                                    </div>
                                    <div className={`pt-2 mt-1 border-t flex justify-between items-center ${stockAdjData.type === 'Addition' ? 'border-emerald-200' : 'border-orange-200'}`}>
                                        <span className="text-sm font-bold text-gray-800">New Total:</span>
                                        <span className={`text-lg font-bold ${stockAdjData.type === 'Addition' ? 'text-emerald-800' : 'text-orange-800'}`}>
                                            {stockAdjData.type === 'Addition'
                                                ? stockAdjData.currentStock + ((parseInt(stockAdjData.crates) || 0) * stockAdjData.bpc) + (parseInt(stockAdjData.bottles) || 0)
                                                : stockAdjData.currentStock - ((parseInt(stockAdjData.crates) || 0) * stockAdjData.bpc) - (parseInt(stockAdjData.bottles) || 0)
                                            }
                                            <span className="text-xs font-normal ml-1">btls</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsStockAdjModalOpen(false)}
                                        disabled={isSubmitting}
                                        className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`px-6 py-2 text-white rounded-lg font-medium shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 ${stockAdjData.type === 'Addition' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-200'}`}
                                    >
                                        {isSubmitting ? <><Loader2 size={18} className="animate-spin" /><span>Saving...</span></> : <span>Confirm {stockAdjData.type}</span>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Products;
