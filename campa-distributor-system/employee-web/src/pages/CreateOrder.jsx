import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ArrowLeft, ShoppingCart, Search, MapPin, UserPlus, X, Box, Check, CreditCard, Banknote, IndianRupee, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const CreateOrder = () => {
    const [retailers, setRetailers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState({}); // { productId: totalPieces }

    // Retailer Selection State
    const [searchTerm, setSearchTerm] = useState('');
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [selectedRetailer, setSelectedRetailer] = useState(null);
    const [showNewRetailerModal, setShowNewRetailerModal] = useState(false);
    const [paymentMode, setPaymentMode] = useState('Credit'); // Default to Credit
    const [isRounded, setIsRounded] = useState(false); // Round Off ToggleState

    // New Retailer Form State
    const [newRetailer, setNewRetailer] = useState({
        shopName: '',
        ownerName: '',
        phone: '',
        address: ''
    });

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [retailersRes, productsRes] = await Promise.all([
                    api.get('/retailers'),
                    api.get('/products')
                ]);
                setRetailers(Array.isArray(retailersRes.data) ? retailersRes.data : (Array.isArray(retailersRes.data?.data) ? retailersRes.data.data : []));
                setProducts(Array.isArray(productsRes.data) ? productsRes.data : (Array.isArray(productsRes.data?.data) ? productsRes.data.data : []));
            } catch (error) {
                console.error("Error loading data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter Retailers
    if (!Array.isArray(retailers)) {
        console.warn("Filter warning: 'retailers' is not an array in CreateOrder. Type:", typeof retailers, "Value:", retailers);
    }
    const filteredRetailers = (Array.isArray(retailers) ? retailers : []).filter(r =>
        r.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectRetailer = (retailer) => {
        setSelectedRetailer(retailer);
        setSearchTerm('');
    };

    const handleCreateRetailer = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/retailers', newRetailer);
            setRetailers([...retailers, res.data]);
            setSelectedRetailer(res.data);
            setShowNewRetailerModal(false);
            setNewRetailer({ shopName: '', ownerName: '', phone: '', address: '' });
        } catch (error) {
            console.error("Failed to create retailer", error);
            alert(error.response?.data?.message || "Failed to create retailer");
        }
    };

    const handleQuantityChange = (productId, type, value) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const bottlesPerCrate = product.bottlesPerCrate || 24;
        const currentData = cart[productId] || { quantity: 0, pricePerUnit: product.price };
        const currentTotal = currentData.quantity;

        let currentCrates = Math.floor(currentTotal / bottlesPerCrate);
        let currentPieces = currentTotal % bottlesPerCrate;

        if (type === 'crates') {
            currentCrates = parseInt(value) || 0;
        } else if (type === 'pieces') {
            currentPieces = parseInt(value) || 0;
        }

        const newTotal = (currentCrates * bottlesPerCrate) + currentPieces;

        setCart(prev => {
            if (newTotal <= 0) {
                const { [productId]: _, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [productId]: {
                    ...currentData,
                    quantity: newTotal
                }
            };
        });
    };

    const handlePriceChange = (productId, value) => {
        setCart(prev => ({
            ...prev,
            [productId]: {
                ...(prev[productId] || { quantity: 0 }),
                pricePerUnit: value
            }
        }));
    };

    const calculateTotal = () => {
        return Object.entries(cart).reduce((total, [productId, data]) => {
            const product = products.find(p => p.id === parseInt(productId));
            if (!product) return total;

            const price = parseFloat(data.pricePerUnit) || 0;
            const taxable = price * data.quantity;
            const gstRate = Number(product.gstPercentage || 18) / 100;
            return total + (taxable * (1 + gstRate));
        }, 0);
    };

    const itemsCount = Object.values(cart).reduce((a, b) => a + b.quantity, 0);

    const handleSubmit = async () => {
        if (!selectedRetailer) return alert("Please select a retailer");
        if (itemsCount === 0) return alert("Cart is empty");

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        const confirmOrder = window.confirm("Confirm order placement with current location?");
        if (!confirmOrder) return;

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            const orderItems = Object.entries(cart).map(([productId, data]) => ({
                productId: parseInt(productId),
                quantity: data.quantity,
                pricePerUnit: parseFloat(data.pricePerUnit) || 0
            }));

            try {
                const totalAmount = calculateTotal();
                const roundOffValue = isRounded ? (Math.round(totalAmount) - totalAmount) : 0;

                await api.post('/orders', {
                    retailerId: selectedRetailer.id,
                    items: orderItems,
                    totalAmount: totalAmount + roundOffValue,
                    paymentMode, // Include selected mode
                    gpsLatitude: latitude,
                    gpsLongitude: longitude,
                    roundOff: roundOffValue
                }, {
                    headers: { 'x-loading-term': 'Placing Order' }
                });
                alert("Order placed successfully!");
                navigate('/sales-dashboard');
            } catch (error) {
                console.error("Order failed", error);
                alert("Failed to place order");
            }
        }, (error) => {
            console.error("GPS Error", error);
            alert("Failed to get GPS location. Order not placed.");
        });
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-slate-50 relative pb-40">
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md shadow-sm z-30 px-4 py-4 flex items-center gap-4 border-b border-slate-100">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">New Order</h1>
            </div>

            <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">

                {/* Retailer Section */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100/60">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <UserPlus size={14} className="text-blue-500" /> Retailer Details
                    </h2>

                    {selectedRetailer ? (
                        <div className="relative group overflow-hidden rounded-2xl border-2 border-blue-100 bg-blue-50/30 transition-all hover:shadow-md hover:border-blue-200">
                            <div className="p-4 flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-blue-200 shadow-lg">
                                        {selectedRetailer.shopName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-lg leading-tight">{selectedRetailer.shopName}</p>
                                        <p className="text-sm text-slate-500 font-medium">{selectedRetailer.ownerName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedRetailer(null)}
                                    className="px-3 py-1.5 bg-white text-slate-500 text-xs font-bold rounded-lg shadow-sm border border-slate-200 hover:text-rose-500 hover:border-rose-200 transition-all"
                                >
                                    Change
                                </button>
                            </div>
                            <div className="px-4 pb-3 pt-0 text-xs text-slate-400 flex items-center gap-1.5">
                                <MapPin size={12} />
                                {selectedRetailer.address}
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search Retailer..."
                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            {searchTerm && (
                                <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-2xl mt-2 max-h-64 overflow-y-auto z-20 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                                    {filteredRetailers.map(r => (
                                        <div
                                            key={r.id}
                                            onClick={() => handleSelectRetailer(r)}
                                            className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between group transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                    {r.shopName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm group-hover:text-blue-700 transition-colors">{r.shopName}</p>
                                                    <p className="text-xs text-slate-400 font-medium">{r.ownerName}</p>
                                                </div>
                                            </div>
                                            <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-50 transition-all">
                                                <Check size={12} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    ))}
                                    {filteredRetailers.length === 0 && (
                                        <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                                            <Search size={24} className="opacity-50" />
                                            No retailers found
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => setShowNewRetailerModal(true)}
                                className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold text-sm transition-all active:scale-95 shadow-lg shadow-slate-200"
                            >
                                <UserPlus size={16} />
                                Add New Retailer
                            </button>
                        </div>
                    )}
                </div>

                {/* Payment Mode */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100/60">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CreditCard size={14} className="text-violet-500" /> Payment Mode
                    </h2>
                    <div className="flex p-1 bg-slate-100 rounded-xl">
                        {['Credit', 'Cash'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setPaymentMode(mode)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${paymentMode === mode
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {mode === 'Credit' ? <CreditCard size={16} /> : <Banknote size={16} />}
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Round Off Toggle */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100/60">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Check size={14} className="text-emerald-500" /> Round Off Total
                        </h2>
                        <button
                            onClick={() => setIsRounded(!isRounded)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isRounded ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRounded ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </div>

                {/* Products Section */}
                <div className="space-y-4">
                    <div className="sticky top-20 z-20 bg-slate-50 pt-2 pb-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search Products..."
                                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all shadow-sm"
                                value={productSearchTerm}
                                onChange={(e) => setProductSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {(() => {
                            if (!Array.isArray(products)) {
                                console.warn("Filter warning: 'products' is not an array in CreateOrder. Type:", typeof products, "Value:", products);
                            }
                            return (Array.isArray(products) ? products : []).filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase())).map(product => {
                                const cartData = cart[product.id] || { quantity: 0, pricePerUnit: product.price };
                                const totalQty = cartData.quantity;
                                const pricePerUnit = cartData.pricePerUnit;
                                const bottlesPerCrate = product.bottlesPerCrate || 24;
                                const crates = Math.floor(totalQty / bottlesPerCrate);
                                const pieces = totalQty % bottlesPerCrate;
                                const isActive = totalQty > 0;
                                const gstRate = Number(product.gstPercentage || 18);

                                return (
                                    <div key={product.id} className={`bg-white p-5 rounded-3xl shadow-sm border transition-all duration-300 ${isActive ? 'border-blue-500 ring-4 ring-blue-500/5 shadow-blue-100' : 'border-slate-100'}`}>
                                        <div className="flex justify-between items-start mb-5">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{product.name}</h3>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className="bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600">
                                                        ₹{product.price} <span className="text-slate-400 font-medium">/ bottle (Default)</span>
                                                    </div>
                                                    <div className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-lg">
                                                        GST: {gstRate}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`text-right transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total (inc. GST)</p>
                                                <p className="font-extrabold text-blue-600 text-xl leading-none">
                                                    ₹{((parseFloat(pricePerUnit) || 0) * totalQty * (1 + gstRate / 100)).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-slate-50 rounded-2xl p-1.5 border border-slate-200 focus-within:border-blue-500 focus-within:bg-blue-50/30 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block text-center mb-0.5">Price/Pc</label>
                                                <div className="flex items-center justify-center">
                                                    <IndianRupee size={14} className="text-slate-400 mr-1" />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-full bg-transparent text-center font-bold text-lg text-slate-700 outline-none p-0"
                                                        value={pricePerUnit}
                                                        onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-1.5 border border-slate-200 focus-within:border-blue-500 focus-within:bg-blue-50/30 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block text-center mb-0.5">Crates</label>
                                                <div className="flex items-center justify-center">
                                                    <Box size={14} className="text-slate-400 mr-1" />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="w-full bg-transparent text-center font-bold text-lg text-slate-700 outline-none p-0"
                                                        value={crates || ''}
                                                        placeholder="0"
                                                        onChange={(e) => handleQuantityChange(product.id, 'crates', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-1.5 border border-slate-200 focus-within:border-blue-500 focus-within:bg-blue-50/30 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block text-center mb-0.5">Pieces</label>
                                                <div className="flex items-center justify-center">
                                                    <Check size={14} className="text-slate-400 mr-1" />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={bottlesPerCrate - 1}
                                                        className="w-full bg-transparent text-center font-bold text-lg text-slate-700 outline-none p-0"
                                                        value={pieces || ''}
                                                        placeholder="0"
                                                        onChange={(e) => handleQuantityChange(product.id, 'pieces', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Summary */}
            <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-4 md:p-6 z-40 rounded-t-[2.5rem] border-t border-slate-100 transition-transform duration-300 ${itemsCount > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-2xl mx-auto">
                    <div className="flex justify-between items-end mb-4 px-2">
                        <div>
                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">
                                {isRounded ? 'Net Total (Rounded)' : 'Subtotal (Inc. Tax)'}
                            </p>
                            <span className="font-black text-slate-800 text-3xl leading-none tracking-tight">
                                ₹{isRounded ? Math.round(calculateTotal()).toLocaleString() : calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {isRounded && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Round off: ₹{(Math.round(calculateTotal()) - calculateTotal()).toFixed(2)}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold">
                                {itemsCount} Items
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-slate-200"
                    >
                        <span>Place Order</span>
                        <ArrowLeft size={20} className="rotate-180" />
                    </button>
                </div>
            </div>

            {/* New Retailer Modal */}
            {showNewRetailerModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl scale-100 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Add Retailer</h2>
                                <p className="text-slate-400 text-sm font-medium">Register a new shop</p>
                            </div>
                            <button onClick={() => setShowNewRetailerModal(false)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRetailer} className="space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Shop Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-300"
                                        placeholder="e.g. Laxmi General Store"
                                        value={newRetailer.shopName}
                                        onChange={(e) => setNewRetailer({ ...newRetailer, shopName: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Owner Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-300"
                                            placeholder="Name"
                                            value={newRetailer.ownerName}
                                            onChange={(e) => setNewRetailer({ ...newRetailer, ownerName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone</label>
                                        <input
                                            type="tel"
                                            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-300"
                                            placeholder="Number"
                                            value={newRetailer.phone}
                                            onChange={(e) => setNewRetailer({ ...newRetailer, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Address</label>
                                    <textarea
                                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-300 resize-none h-24"
                                        placeholder="Shop Address..."
                                        value={newRetailer.address}
                                        onChange={(e) => setNewRetailer({ ...newRetailer, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                            >
                                Save Retailer
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateOrder;
