import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ArrowLeft, UserPlus, Phone, MapPin, Search, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Retailers = () => {
    const [retailers, setRetailers] = useState([]);
    const [filteredRetailers, setFilteredRetailers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRetailers = async () => {
            try {
                const response = await api.get('/retailers');
                setRetailers(response.data);
                setFilteredRetailers(response.data);
            } catch (error) {
                console.error("Failed to fetch retailers", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRetailers();
    }, []);

    useEffect(() => {
        const filtered = retailers.filter(r =>
            r.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.ownerName && r.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (r.mobileNumber && r.mobileNumber.includes(searchTerm))
        );
        setFilteredRetailers(filtered);
    }, [searchTerm, retailers]);

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-24">
            {/* Header */}
            <div className="sticky top-0 bg-slate-50 z-10 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-extrabold text-slate-800">Retailers</h1>
                    <div className="w-10"></div> {/* Spacer for alignment */}
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by shop, owner, or phone..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 transition-all focus:shadow-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredRetailers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                    <Store size={48} className="text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">No retailers found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredRetailers.map((retailer) => (
                        <div key={retailer.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative overflow-hidden">
                            {/* Gradient Accent */}
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600"></div>

                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 text-lg font-bold shadow-sm">
                                        {retailer.shopName.charAt(0)}
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{retailer.shopName}</h3>
                                        <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-slate-300"></span> {retailer.ownerName || 'Owner'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-col gap-2 pl-16">
                                <a href={`tel:${retailer.mobileNumber}`} className="flex items-center gap-2.5 text-slate-600 text-sm font-medium hover:text-blue-600 transition-colors w-fit p-1 -ml-1 rounded-lg hover:bg-blue-50">
                                    <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                                        <Phone size={14} />
                                    </div>
                                    <span>{retailer.mobileNumber}</span>
                                </a>
                                <div className="flex items-start gap-2.5 text-slate-600 text-sm">
                                    <div className="p-1.5 bg-rose-50 text-rose-500 rounded-lg mt-0.5">
                                        <MapPin size={14} />
                                    </div>
                                    <span className="leading-snug">{retailer.address}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Floating Action Button */}
            <button
                className="fixed bottom-24 right-6 bg-slate-900 text-white p-4 rounded-full shadow-lg shadow-slate-900/30 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all z-20"
                onClick={() => {/* Logic to open add retailer (or create-order) */ alert('Use Create Order to add new retailer instantly!') }}
            >
                <UserPlus size={24} />
            </button>
        </div>
    );
};

export default Retailers;
