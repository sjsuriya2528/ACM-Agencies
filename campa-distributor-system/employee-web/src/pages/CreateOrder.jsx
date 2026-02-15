import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ArrowLeft, ShoppingCart, Search, MapPin, UserPlus, X, Box, Check, CreditCard, Banknote } from 'lucide-react';
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
                setRetailers(retailersRes.data);
                setProducts(productsRes.data);
            } catch (error) {
                console.error("Error loading data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter Retailers
    const filteredRetailers = retailers.filter(r =>
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
        const currentTotal = cart[productId] || 0;

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
            return { ...prev, [productId]: newTotal };
        });
    };

    const calculateTotal = () => {
        return Object.entries(cart).reduce((total, [productId, qty]) => {
            const product = products.find(p => p.id === parseInt(productId));
            return total + (product ? product.price * qty : 0);
        }, 0);
    };

    const itemsCount = Object.values(cart).reduce((a, b) => a + b, 0);

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

            const orderItems = Object.entries(cart).map(([productId, quantity]) => ({
                productId: parseInt(productId),
                quantity
            }));

            try {
                await api.post('/orders', {
                    retailerId: selectedRetailer.id,
                    items: orderItems,
                    totalAmount: calculateTotal(),
                    paymentMode, // Include selected mode
                    gpsLatitude: latitude,
                    gpsLongitude: longitude
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

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-44">
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm z-30 px-4 py-3 flex items-center gap-4 transition-all">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-slate-800">New Order</h1>
            </div>

            <div className="p-4 space-y-6 max-w-lg mx-auto">

                {/* Retailer Section */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <UserPlus size={14} /> Retailer
                    </h2>

                    {selectedRetailer ? (
                        <div className="relative group">
                            <div className="absolute inset-0 bg-blue-500 rounded-2xl opacity-5 group-hover:opacity-10 transition-opacity"></div>
                            <div className="flex justify-between items-center p-4 rounded-2xl border border-blue-100 bg-blue-50/50">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                            {selectedRetailer.shopName.charAt(0)}
                                        </div>
                                        <p className="font-bold text-slate-800">{selectedRetailer.shopName}</p>
                                    </div>
                                    <p className="text-sm text-slate-500 pl-10">{selectedRetailer.ownerName}</p>
                                    <p className="text-xs text-slate-400 pl-10 mt-1">{selectedRetailer.address}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedRetailer(null)}
                                    className="px-3 py-1.5 bg-white text-blue-600 text-xs font-bold rounded-lg shadow-sm border border-blue-100 hover:bg-blue-50 transition-colors"
                                >
                                    Change
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search Retailer..."
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            {searchTerm && (
                                <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-xl mt-2 max-h-60 overflow-y-auto z-20 border border-slate-100 animate-fade-in-up">
                                    {filteredRetailers.map(r => (
                                        <div
                                            key={r.id}
                                            onClick={() => handleSelectRetailer(r)}
                                            className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between group"
                                        >
                                            <div>
                                                <p className="font-bold text-slate-700 text-sm group-hover:text-blue-600 transition-colors">{r.shopName}</p>
                                                <p className="text-xs text-slate-500">{r.ownerName}</p>
                                            </div>
                                            <Check size={16} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                    {filteredRetailers.length === 0 && (
                                        <div className="p-4 text-center text-slate-400 text-sm">No retailers found</div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => setShowNewRetailerModal(true)}
                                className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-slate-200"
                            >
                                <UserPlus size={16} />
                                Add New Retailer
                            </button>
                        </div>
                    )}
                </div>

                {/* Payment Mode */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <CreditCard size={14} /> Payment Mode
                    </h2>
                    <div className="flex gap-4">
                        {['Credit', 'Cash'].map(mode => (
                            <label key={mode} className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${paymentMode === mode ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                                <input
                                    type="radio"
                                    name="paymentMode"
                                    value={mode}
                                    checked={paymentMode === mode}
                                    onChange={() => setPaymentMode(mode)}
                                    className="hidden"
                                />
                                <div className={`p-2 rounded-full ${paymentMode === mode ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400'}`}>
                                    {mode === 'Credit' ? <CreditCard size={20} /> : <Banknote size={20} />}
                                </div>
                                <span className={`font-bold text-sm ${paymentMode === mode ? 'text-blue-700' : 'text-slate-600'}`}>{mode}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Products Section */}
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 sticky top-16 z-10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search Products..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                                value={productSearchTerm}
                                onChange={(e) => setProductSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {products.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase())).map(product => {
                        const totalQty = cart[product.id] || 0;
                        const bottlesPerCrate = product.bottlesPerCrate || 24;
                        const crates = Math.floor(totalQty / bottlesPerCrate);
                        const pieces = totalQty % bottlesPerCrate;
                        const isActive = totalQty > 0;

                        return (
                            <div key={product.id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all duration-200 ${isActive ? 'border-blue-200 shadow-md ring-1 ring-blue-100' : 'border-slate-100'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{product.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">₹{product.price}</span>
                                            <span className="text-xs text-slate-400 font-medium">1 Crate = {bottlesPerCrate} btls</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-extrabold text-blue-600 text-lg">₹{(totalQty * product.price).toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">Crates</label>
                                        <div className="flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                            <Box size={16} className="text-slate-400 mr-2" />
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full bg-transparent py-2.5 focus:outline-none font-bold text-slate-700 text-center"
                                                value={crates || ''}
                                                placeholder="0"
                                                onChange={(e) => handleQuantityChange(product.id, 'crates', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">Pieces</label>
                                        <div className="flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                            <Check size={16} className="text-slate-400 mr-2" />
                                            <input
                                                type="number"
                                                min="0"
                                                max={bottlesPerCrate - 1}
                                                className="w-full bg-transparent py-2.5 focus:outline-none font-bold text-slate-700 text-center"
                                                value={pieces || ''}
                                                placeholder="0"
                                                onChange={(e) => handleQuantityChange(product.id, 'pieces', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sticky Bottom Summary */}
            <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] p-5 z-40 rounded-t-3xl transition-transform duration-300 ${itemsCount > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-lg mx-auto">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-900 rounded-xl text-white">
                                <ShoppingCart size={20} />
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Total Items</p>
                                <span className="font-extrabold text-slate-800 text-xl leading-none">{itemsCount} <span className="text-sm font-medium text-slate-400">Units</span></span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Total Amount</p>
                            <p className="text-2xl font-black text-blue-600 leading-none">₹{calculateTotal().toFixed(2)}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-200"
                    >
                        <MapPin size={20} />
                        Place Order Now
                    </button>
                </div>
            </div>

            {/* New Retailer Modal */}
            {showNewRetailerModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-extrabold text-slate-800">Add New Retailer</h2>
                            <button onClick={() => setShowNewRetailerModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRetailer} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Shop Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    value={newRetailer.shopName}
                                    onChange={(e) => setNewRetailer({ ...newRetailer, shopName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Owner Name</label>
                                <input
                                    type="text"
                                    className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    value={newRetailer.ownerName}
                                    onChange={(e) => setNewRetailer({ ...newRetailer, ownerName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                                <input
                                    type="text"
                                    className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    value={newRetailer.phone}
                                    onChange={(e) => setNewRetailer({ ...newRetailer, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Address</label>
                                <textarea
                                    className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    rows="3"
                                    value={newRetailer.address}
                                    onChange={(e) => setNewRetailer({ ...newRetailer, address: e.target.value })}
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 mt-2 shadow-lg transition-transform active:scale-95"
                            >
                                Create Retailer
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateOrder;
