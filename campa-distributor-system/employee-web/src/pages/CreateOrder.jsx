import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ArrowLeft, ShoppingCart, Search, MapPin, UserPlus, X, Box, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateOrder = () => {
    const [retailers, setRetailers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState({}); // { productId: totalPieces }

    // Retailer Selection State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRetailer, setSelectedRetailer] = useState(null);
    const [showNewRetailerModal, setShowNewRetailerModal] = useState(false);

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

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-40">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-sm z-20 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-lg font-bold">New Order</h1>
            </div>

            <div className="p-4 space-y-6">

                {/* Retailer Section */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Retailer</h2>

                    {selectedRetailer ? (
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div>
                                <p className="font-bold text-gray-800">{selectedRetailer.shopName}</p>
                                <p className="text-sm text-gray-600">{selectedRetailer.ownerName}</p>
                                <p className="text-xs text-gray-500">{selectedRetailer.address}</p>
                            </div>
                            <button
                                onClick={() => setSelectedRetailer(null)}
                                className="text-blue-600 text-sm font-medium hover:underline"
                            >
                                Change
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search Retailer..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            {searchTerm && (
                                <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-lg mt-1 max-h-60 overflow-y-auto z-10 border border-gray-100">
                                    {filteredRetailers.map(r => (
                                        <div
                                            key={r.id}
                                            onClick={() => handleSelectRetailer(r)}
                                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                                        >
                                            <p className="font-medium text-gray-800">{r.shopName}</p>
                                            <p className="text-xs text-gray-500">{r.ownerName}</p>
                                        </div>
                                    ))}
                                    {filteredRetailers.length === 0 && (
                                        <div className="p-3 text-center text-gray-500 text-sm">No retailers found</div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => setShowNewRetailerModal(true)}
                                className="w-full mt-3 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                            >
                                <UserPlus size={18} />
                                Add New Retailer
                            </button>
                        </div>
                    )}
                </div>

                {/* Products Section */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase px-1">Products</h2>
                    {products.map(product => {
                        const totalQty = cart[product.id] || 0;
                        const bottlesPerCrate = product.bottlesPerCrate || 24;
                        const crates = Math.floor(totalQty / bottlesPerCrate);
                        const pieces = totalQty % bottlesPerCrate;

                        return (
                            <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{product.name}</h3>
                                        <p className="text-sm text-gray-500">Price: ₹{product.price} / bottle</p>
                                        <p className="text-xs text-gray-400">1 Crate = {bottlesPerCrate} bottles</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-blue-600">₹{(totalQty * product.price).toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 mb-1 block">Crates</label>
                                        <div className="flex items-center bg-gray-100 rounded-lg px-2">
                                            <Box size={16} className="text-gray-400 mr-2" />
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full bg-transparent py-2 focus:outline-none font-medium"
                                                value={crates || ''}
                                                placeholder="0"
                                                onChange={(e) => handleQuantityChange(product.id, 'crates', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 mb-1 block">Pieces</label>
                                        <div className="flex items-center bg-gray-100 rounded-lg px-2">
                                            <Check size={16} className="text-gray-400 mr-2" />
                                            <input
                                                type="number"
                                                min="0"
                                                max={bottlesPerCrate - 1}
                                                className="w-full bg-transparent py-2 focus:outline-none font-medium"
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
            {itemsCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] p-4 z-20 rounded-t-2xl pb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="text-gray-500 text-xs uppercase font-medium">Total Items</p>
                            <span className="font-bold text-gray-800 text-lg mr-4">{itemsCount} Units</span>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 text-xs uppercase font-medium">Total Amount</p>
                            <p className="text-2xl font-bold text-blue-600">₹{calculateTotal().toFixed(2)}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <MapPin size={18} />
                        Place Order
                    </button>
                </div>
            )}

            {/* New Retailer Modal */}
            {showNewRetailerModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">New Retailer</h2>
                            <button onClick={() => setShowNewRetailerModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRetailer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newRetailer.shopName}
                                    onChange={(e) => setNewRetailer({ ...newRetailer, shopName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newRetailer.ownerName}
                                    onChange={(e) => setNewRetailer({ ...newRetailer, ownerName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newRetailer.phone}
                                    onChange={(e) => setNewRetailer({ ...newRetailer, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    value={newRetailer.address}
                                    onChange={(e) => setNewRetailer({ ...newRetailer, address: e.target.value })}
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 mt-4"
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
