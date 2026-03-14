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
                    api.get('/retailers?limit=1000'),
                    api.get('/products?limit=1000')
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 relative pb-40">
            {/* Immersive Sticky Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 z-50 px-6 py-6 rounded-b-2xl shadow-lg transition-all">
                <div className="max-w-7xl mx-auto flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all border border-white/5 shadow-inner active:scale-95"
                    >
                        <ArrowLeft size={22} strokeWidth={3} />
                    </button>
                    <div>
                        <p className="text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">New Transaction</p>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Create Order</h1>
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-10 space-y-10 max-w-2xl mx-auto">

                {/* Select Retailer */}
                <div className="bg-white dark:bg-white/5 backdrop-blur-3xl p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-blue-500/10 transition-all duration-1000"></div>
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <h2 className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-[0.3em] flex items-center gap-3">
                            <UserPlus size={16} className="text-blue-500" strokeWidth={3} /> Select Retailer
                        </h2>
                    </div>

                    {selectedRetailer ? (
                        <div className="relative group overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-500/5 transition-all hover:bg-blue-500/10 shadow-lg">
                            <div className="p-8 flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-3xl shadow-2xl border border-white/20 uppercase italic transition-transform group-hover:scale-110 group-hover:rotate-3">
                                        {selectedRetailer.shopName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white text-2xl leading-tight tracking-tighter uppercase italic group-hover:text-blue-400 transition-colors uppercase">{selectedRetailer.shopName}</h3>
                                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest mt-2">Owner: {selectedRetailer.ownerName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedRetailer(null)}
                                    className="px-6 py-3 bg-white/5 text-slate-400 text-[10px] font-black rounded-xl border border-white/10 hover:bg-white/10 hover:text-white transition-all uppercase tracking-[0.2em] active:scale-95 shadow-xl"
                                >
                                    Modify
                                </button>
                            </div>
                            <div className="px-8 pb-6 pt-0 text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-3 relative z-10 border-t border-white/5 mt-2 pt-4 mx-4">
                                <MapPin size={14} className="text-blue-500/50" strokeWidth={3} />
                                {selectedRetailer.address}
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 space-y-6">
                            <div className="relative group/input">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" size={20} strokeWidth={2.5} />
                                <input
                                    type="text"
                                    placeholder="SEARCH RETAILERS..."
                                    className="w-full pl-16 pr-8 py-6 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/30 font-black text-slate-900 dark:text-white transition-all shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-600 tracking-widest text-[11px] uppercase"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />

                                {searchTerm && (
                                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl rounded-2xl mt-4 max-h-[400px] overflow-y-auto z-40 border border-slate-200 dark:border-white/10">
                                        {filteredRetailers.map(r => (
                                            <div
                                                key={r.id}
                                                onClick={() => handleSelectRetailer(r)}
                                                className="p-6 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 flex items-center justify-between group/item transition-all"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-sm group-hover/item:bg-blue-600 group-hover/item:text-white transition-all uppercase italic">
                                                        {r.shopName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white text-[13px] group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors uppercase italic tracking-tight">{r.shopName}</p>
                                                        <p className="text-[9px] text-slate-500 dark:text-slate-600 font-bold uppercase tracking-widest mt-1">{r.ownerName}</p>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-center group-hover/item:border-blue-500 group-hover/item:bg-blue-500/10 transition-all shadow-inner">
                                                    <Check size={16} className="text-blue-500 opacity-20 group-hover/item:opacity-100 transition-opacity" strokeWidth={4} />
                                                </div>
                                            </div>
                                        ))}
                                        {filteredRetailers.length === 0 && (
                                            <div className="p-16 text-center space-y-4">
                                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                                    <Search size={32} className="text-slate-800" strokeWidth={1} />
                                                </div>
                                                <p className="font-black uppercase text-[10px] tracking-[0.4em] text-slate-600">No Retailers Found</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setShowNewRetailerModal(true)}
                                className="w-full flex items-center justify-center gap-4 py-6 bg-white text-slate-950 rounded-[2rem] hover:bg-slate-200 font-black text-[11px] uppercase tracking-[0.3em] transition-all active:scale-[0.98] shadow-2xl border border-white"
                            >
                                <UserPlus size={18} strokeWidth={3} />
                                Add New Retailer
                            </button>
                        </div>
                    )}
                </div>

                {/* Order Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-white/5 backdrop-blur-3xl p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl group">
                        <h2 className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                            <CreditCard size={16} className="text-blue-500" strokeWidth={3} /> Payment Mode
                        </h2>
                        <div className="flex p-2 bg-slate-100 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
                            {['Credit', 'Cash'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setPaymentMode(mode)}
                                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${paymentMode === mode
                                        ? 'bg-blue-600 text-white shadow-lg scale-[1.02] -translate-y-0.5'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                        }`}
                                >
                                    {mode === 'Credit' ? <CreditCard size={14} strokeWidth={3} /> : <Banknote size={14} strokeWidth={3} />}
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-white/5 backdrop-blur-3xl p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl flex items-center justify-between group">
                        <div className="space-y-1">
                            <h2 className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-[0.3em] flex items-center gap-3">
                                <Check size={16} className="text-emerald-500" strokeWidth={3} /> Round Off
                            </h2>
                            <p className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest pl-7">Round Total</p>
                        </div>
                        <button
                            onClick={() => setIsRounded(!isRounded)}
                            className={`relative inline-flex h-10 w-16 items-center rounded-full transition-all focus:outline-none shadow-inner ${isRounded ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-black/40 border border-slate-300 dark:border-white/10'}`}
                        >
                            <span
                                className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform duration-500 shadow-2xl ${isRounded ? 'translate-x-7' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </div>

                {/* Products */}
                <div className="space-y-8">
                    <div className="sticky top-28 z-40 bg-slate-50/80 dark:bg-slate-950/20 backdrop-blur-md pt-4 pb-10 px-2">
                        <div className="relative group/input">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" size={22} strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="SEARCH PRODUCTS..."
                                className="w-full pl-16 pr-8 py-6 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 font-black text-slate-900 dark:text-white transition-all shadow-xl placeholder:text-slate-400 dark:placeholder:text-slate-700 tracking-[0.2em] text-[11px] uppercase placeholder:uppercase"
                                value={productSearchTerm}
                                onChange={(e) => setProductSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
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
                                    <div key={product.id} className={`bg-white dark:bg-white/5 backdrop-blur-3xl p-10 rounded-3xl border transition-all duration-300 relative overflow-hidden group/product ${isActive ? 'bg-blue-50/50 dark:bg-white/10 border-blue-500/50 ring-4 ring-blue-500/5 shadow-xl -translate-y-2' : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'}`}>
                                        {isActive && <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -mr-24 -mt-24 blur-[80px] animate-pulse"></div>}
                                        
                                        <div className="flex justify-between items-start mb-10 relative z-10">
                                            <div className="flex-1 space-y-4">
                                                <h3 className="font-black text-slate-900 dark:text-white text-2xl leading-tight tracking-tighter uppercase italic group-hover/product:text-blue-500 transition-colors uppercase">{product.name}</h3>
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <div className="bg-slate-100 dark:bg-black/60 px-4 py-2 rounded-2xl text-[10px] font-black text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-white/5 shadow-inner">
                                                        FIXED: ₹{(parseFloat(product.price) || 0).toFixed(2)} <span className="text-slate-500 dark:text-slate-700 tracking-[0.2em] ml-1 uppercase">/ UNIT</span>
                                                    </div>
                                                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-black bg-blue-500/10 px-4 py-2 rounded-2xl border border-blue-500/20 uppercase tracking-[0.3em] shadow-inner">
                                                        TAX: {gstRate}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`text-right transition-all duration-500 transform translate-x-0 ${isActive ? 'opacity-100' : 'opacity-20'}`}>
                                                <p className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-[0.4em] mb-2 text-right">ITEM TOTAL</p>
                                                <p className={`font-black tracking-tighter italic drop-shadow-[0_0_15px_rgba(59,130,246,0.2)] text-4xl ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}>
                                                    ₹{((parseFloat(pricePerUnit) || 0) * totalQty * (1 + gstRate / 100)).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 relative z-10">
                                            <div className="bg-slate-100 dark:bg-black/40 rounded-2xl p-4 border border-slate-200 dark:border-white/5 focus-within:border-blue-500/50 focus-within:bg-blue-500/5 dark:focus-within:bg-blue-500/10 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all group/cell shadow-inner">
                                                <label className="text-[9px] font-black text-slate-800 dark:text-slate-300 uppercase block text-center mb-2 tracking-[0.3em] group-focus-within/cell:text-blue-500 transition-colors uppercase">Real-Time Price</label>
                                                <div className="flex items-center justify-center">
                                                    <IndianRupee size={16} className="text-slate-400 dark:text-slate-600 mr-2 group-focus-within/cell:text-blue-500 transition-colors" />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-full bg-transparent text-center font-black text-2xl text-slate-900 dark:text-white outline-none p-2 tracking-tighter"
                                                        value={pricePerUnit}
                                                        onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-slate-100 dark:bg-black/40 rounded-2xl p-4 border border-slate-200 dark:border-white/5 focus-within:border-blue-500/50 focus-within:bg-blue-500/5 dark:focus-within:bg-blue-500/10 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all group/cell shadow-inner">
                                                <label className="text-[9px] font-black text-slate-800 dark:text-slate-300 uppercase block text-center mb-2 tracking-[0.3em] group-focus-within/cell:text-blue-500 transition-colors uppercase">Load (Crates)</label>
                                                <div className="flex items-center justify-center">
                                                    <Box size={16} className="text-slate-400 dark:text-slate-600 mr-2 group-focus-within/cell:text-blue-500 transition-colors" />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="w-full bg-transparent text-center font-black text-3xl text-slate-900 dark:text-white outline-none p-2 tracking-tighter"
                                                        value={crates || ''}
                                                        placeholder="0"
                                                        onChange={(e) => handleQuantityChange(product.id, 'crates', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-slate-100 dark:bg-black/40 rounded-2xl p-4 border border-slate-200 dark:border-white/5 focus-within:border-blue-500/50 focus-within:bg-blue-500/5 dark:focus-within:bg-blue-500/10 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all group/cell shadow-inner">
                                                <label className="text-[9px] font-black text-slate-800 dark:text-slate-300 uppercase block text-center mb-2 tracking-[0.3em] group-focus-within/cell:text-blue-500 transition-colors uppercase">Fraction (Pcs)</label>
                                                <div className="flex items-center justify-center">
                                                    <Check size={16} className="text-slate-400 dark:text-slate-600 mr-2 group-focus-within/cell:text-blue-500 transition-colors" strokeWidth={4} />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={bottlesPerCrate - 1}
                                                        className="w-full bg-transparent text-center font-black text-3xl text-slate-900 dark:text-white outline-none p-2 tracking-tighter"
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

            {/* Order Summary */}
            <div className={`fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/90 backdrop-blur-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-50px_100px_rgba(0,0,0,0.8)] p-8 md:p-10 z-[60] rounded-t-3xl border-t border-slate-200 dark:border-white/10 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${itemsCount > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-2xl mx-auto space-y-8">
                    <div className="flex justify-between items-end px-4">
                        <div className="space-y-2">
                            <p className="text-slate-600 dark:text-slate-400 text-[10px] uppercase font-black tracking-[0.5em] flex items-center gap-3">
                                <IndianRupee size={12} strokeWidth={4} className="text-blue-500" />
                                {isRounded ? 'Final Total (Rounded)' : 'Final Total'}
                            </p>
                            <div className="flex items-baseline gap-4">
                                <span className="font-black text-slate-900 dark:text-white text-6xl leading-none tracking-tighter italic drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                                    ₹{isRounded ? Math.round(calculateTotal()).toLocaleString() : calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </span>
                            </div>
                            {isRounded && (
                                <p className="text-[10px] text-emerald-500/80 font-black uppercase tracking-[0.4em] flex items-center gap-2 mt-4 bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/10 w-fit">
                                    Rounding: <span className="text-white">₹{(Math.round(calculateTotal()) - calculateTotal()).toFixed(2)}</span>
                                </p>
                            )}
                        </div>
                        {itemsCount > 0 && (
                            <div className="bg-slate-100 dark:bg-white/5 px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 text-right shadow-inner">
                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Items Selected</p>
                                <p className="font-black text-slate-900 dark:text-white text-2xl italic tracking-tighter">{itemsCount} <span className="text-sm not-italic text-slate-400 ml-1">UNITS</span></p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-blue-600 hover:bg-blue-500 p-8 rounded-3xl font-black text-2xl uppercase tracking-[0.4em] flex items-center justify-center gap-6 transition-all active:scale-[0.97] shadow-xl transform-gpu group border border-blue-400/20 text-white"
                    >
                        <span>Place Order</span>
                        <ArrowLeft size={32} className="rotate-180 group-hover:translate-x-2 transition-transform" strokeWidth={4} />
                    </button>
                    <p className="text-center text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.6em]">Please review your order before placing...</p>
                </div>
            </div>

            {/* New Retailer Modal */}
            {showNewRetailerModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 transition-all">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-10 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                        
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Add Retailer</h2>
                                <p className="text-slate-500 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">New Retailer</p>
                            </div>
                            <button onClick={() => setShowNewRetailerModal(false)} className="p-4 bg-slate-100 dark:bg-white/5 hover:bg-red-500 hover:text-white rounded-2xl transition-all text-slate-500 border border-slate-200 dark:border-white/10 shadow-lg">
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRetailer} className="space-y-10">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-[0.4em] ml-4">Shop Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-6 bg-slate-100 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/30 font-black text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-800 tracking-widest text-[11px] shadow-inner uppercase"
                                        placeholder="ENTER SHOP NAME..."
                                        value={newRetailer.shopName}
                                        onChange={(e) => setNewRetailer({ ...newRetailer, shopName: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-[0.4em] ml-4">Owner Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-6 bg-slate-100 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/30 font-black text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-800 tracking-widest text-[11px] shadow-inner uppercase"
                                            placeholder="ENTER NAME..."
                                            value={newRetailer.ownerName}
                                            onChange={(e) => setNewRetailer({ ...newRetailer, ownerName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-[0.4em] ml-4">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="w-full p-6 bg-slate-100 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/30 font-black text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-800 tracking-widest text-[11px] shadow-inner"
                                            placeholder="MOBILE NUMBER"
                                            value={newRetailer.phone}
                                            onChange={(e) => setNewRetailer({ ...newRetailer, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-[0.4em] ml-4">Address</label>
                                    <textarea
                                        className="w-full p-8 bg-slate-100 dark:bg-black/40 rounded-3xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/30 font-black text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-800 tracking-widest text-[11px] shadow-inner resize-none h-36 uppercase"
                                        placeholder="STREET, AREA, CITY..."
                                        value={newRetailer.address}
                                        onChange={(e) => setNewRetailer({ ...newRetailer, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white p-8 rounded-3xl font-black text-xl uppercase tracking-[0.4em] transition-all shadow-xl active:scale-95 transform-gpu border border-blue-400/20"
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
