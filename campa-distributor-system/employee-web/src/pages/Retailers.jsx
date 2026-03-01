import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ArrowLeft, UserPlus, Phone, MapPin, Search, Store } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
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
                const retailersData = response.data.data || [];
                setRetailers(retailersData);
                setFilteredRetailers(retailersData);
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
        <div className="min-h-screen bg-slate-50 pb-32">
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md shadow-sm z-20 px-4 py-4 border-b border-slate-100 transition-all">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">Retailers</h1>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by shop, owner, or phone..."
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium text-slate-700 transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 max-w-2xl mx-auto min-h-[60vh]">
                {loading ? (
                    <LoadingSpinner />
                ) : filteredRetailers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full pt-20 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-slate-100 p-6 rounded-full mb-6">
                            <Store size={48} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-2">No retailers found</h3>
                        <p className="text-slate-500 font-medium max-w-xs mx-auto">Try adjusting your search or add a new retailer to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredRetailers.map((retailer, index) => (
                            <div
                                key={retailer.id}
                                className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100/60 hover:shadow-lg hover:border-blue-100 transition-all duration-300 group relative overflow-hidden"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Gradient Accent */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-l-3xl"></div>
                                <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>

                                <div className="flex items-start justify-between relative z-10">
                                    <div className="flex gap-4">
                                        {/* Avatar */}
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-200">
                                            {retailer.shopName.charAt(0)}
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1 group-hover:text-blue-700 transition-colors">{retailer.shopName}</h3>
                                            <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> {retailer.ownerName || 'Owner'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-col gap-3 pl-[4.5rem] relative z-10">
                                    <a href={`tel:${retailer.mobileNumber} `} className="flex items-center gap-3 text-slate-600 text-sm font-bold hover:text-blue-600 transition-colors w-fit p-2 -ml-2 rounded-xl hover:bg-blue-50 group/phone">
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover/phone:scale-110 transition-transform shadow-sm">
                                            <Phone size={16} />
                                        </div>
                                        <span>{retailer.mobileNumber}</span>
                                    </a>
                                    <div className="flex items-start gap-3 text-slate-500 text-sm font-medium">
                                        <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg mt-0.5 shadow-sm">
                                            <MapPin size={16} />
                                        </div>
                                        <span className="leading-relaxed py-1">{retailer.address}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <button
                className="fixed bottom-8 right-6 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl shadow-slate-900/40 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all z-30 group"
                onClick={() => navigate('/create-order')}
            >
                <UserPlus size={24} className="group-hover:rotate-12 transition-transform" />
            </button>
        </div>
    );
};

export default Retailers;
