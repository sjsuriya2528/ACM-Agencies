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
                const retailersData = Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.data) ? response.data.data : []);
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
        if (!Array.isArray(retailers)) {
            console.warn("Filter warning: 'retailers' is not an array in Retailers. Type:", typeof retailers, "Value:", retailers);
        }
        const filtered = (Array.isArray(retailers) ? retailers : []).filter(r =>
            r.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.ownerName && r.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (r.phone && r.phone.includes(searchTerm))
        );
        setFilteredRetailers(filtered);
    }, [searchTerm, retailers]);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 pb-32">
            {/* Header */}
            <div className="sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-20 px-6 py-6 border-b border-slate-200 dark:border-white/5 transition-all">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-slate-600 dark:text-slate-400 transition-all border border-slate-200 dark:border-white/5"
                    >
                        <ArrowLeft size={20} strokeWidth={3} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Retailers</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Retailer List</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search retailers..."
                        className="w-full pl-14 pr-6 py-4 bg-slate-100 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 font-black text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-w-2xl mx-auto min-h-[60vh]">
                {loading ? (
                    <div className="flex items-center justify-center pt-20">
                        <LoadingSpinner />
                    </div>
                ) : filteredRetailers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full pt-20 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-slate-100 dark:bg-white/5 p-8 rounded-[2.5rem] mb-6 border border-slate-200 dark:border-white/5">
                            <Store size={48} className="text-slate-800 dark:text-slate-400" strokeWidth={1} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">No Retailers Found</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] max-w-xs mx-auto">Try a different search term.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredRetailers.map((retailer, index) => (
                            <div
                                key={retailer.id}
                                className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-blue-500/50 transition-all duration-300 group relative overflow-hidden shadow-lg"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Glass Gradient Accent */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none group-hover:bg-blue-500/10 transition-all"></div>

                                <div className="flex items-start justify-between relative z-10">
                                    <div className="flex gap-5">
                                        {/* Avatar Node */}
                                        <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-black border border-slate-800 dark:border-white/10 flex items-center justify-center text-white text-2xl font-black uppercase italic shadow-2xl group-hover:border-blue-500/50 transition-colors">
                                            {retailer.shopName.charAt(0)}
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">{retailer.shopName}</h3>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[.2em]">
                                                    {retailer.ownerName || 'Unknown Entity'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Credit Exposure Module */}
                                    <div className={`p-4 rounded-[1.5rem] border transition-all ${parseFloat(retailer.creditBalance) > 0 ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'}`}>
                                        <div className="text-[9px] uppercase font-black tracking-[0.2em] mb-1 opacity-60">Credit Balance</div>
                                        <div className="text-lg font-black tracking-tighter italic leading-none">₹{parseFloat(retailer.creditBalance || 0).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="mt-8 grid grid-cols-1 gap-4 relative z-10">
                                    <a href={`tel:${retailer.phone}`} className="flex items-center gap-4 bg-slate-50 dark:bg-black/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-blue-500/30 transition-all group/comm">
                                        <div className="p-3 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl group-hover/comm:bg-blue-600/20 transition-all">
                                            <Phone size={18} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Phone</p>
                                            <span className="text-slate-900 dark:text-white font-black italic tracking-wider">{retailer.phone}</span>
                                        </div>
                                    </a>
                                    
                                    <div className="flex items-start gap-4 bg-slate-50 dark:bg-black/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                                        <div className="p-3 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                            <MapPin size={18} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Address</p>
                                            <span className="text-slate-600 dark:text-slate-400 text-[11px] font-bold uppercase tracking-tight leading-relaxed">{retailer.address}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Float Command Button */}
            <button
                className="fixed bottom-10 right-8 bg-slate-900 dark:bg-white text-white dark:text-slate-950 p-5 rounded-[2rem] shadow-2xl hover:bg-slate-800 dark:hover:bg-slate-200 hover:scale-105 active:scale-95 transition-all z-30 group border border-slate-800 dark:border-white"
                onClick={() => navigate('/create-order')}
            >
                <UserPlus size={28} strokeWidth={3} className="group-hover:rotate-12 transition-transform" />
            </button>
        </div>
    );
};

export default Retailers;
