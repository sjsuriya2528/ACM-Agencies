import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit, Trash2, X } from 'lucide-react';

const Retailers = () => {
    const [retailers, setRetailers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ shopName: '', ownerName: '', phone: '', address: '', gstin: '' });
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [limit, setLimit] = useState(50);

    const fetchRetailers = async (signal) => {
        try {
            setLoading(true);
            const params = {
                page,
                limit,
                search: activeSearch
            };
            const response = await api.get('/retailers', { params, signal });
            setRetailers(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotalResults(response.data.total);
        } catch (error) {
            if (error.name === 'CanceledError' || error.name === 'AbortError') return;
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            setActiveSearch(searchTerm);
            setPage(1);
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
        setActiveSearch('');
        setPage(1);
    };

    // Auto-search if empty
    useEffect(() => {
        if (searchTerm === '' && activeSearch !== '') {
            setActiveSearch('');
            setPage(1);
        }
    }, [searchTerm]);

    useEffect(() => {
        const controller = new AbortController();
        fetchRetailers(controller.signal);
        return () => controller.abort();
    }, [page, activeSearch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/retailers/${editingId}`, formData);
            } else {
                await api.post('/retailers', formData);
            }
            setIsModalOpen(false);
            setFormData({ shopName: '', ownerName: '', phone: '', address: '' });
            setEditingId(null);
            fetchRetailers();
        } catch (error) {
            console.error(error);
            alert("Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/retailers/${id}`);
            fetchRetailers();
        } catch (error) {
            console.error(error);
        }
    };

    const startEdit = (retailer) => {
        setFormData({
            shopName: retailer.shopName,
            ownerName: retailer.ownerName,
            phone: retailer.phone,
            address: retailer.address,
            gstin: retailer.gstin || ''
        });
        setEditingId(retailer.id);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Retailers</h1>
                    <div className="h-1 w-20 bg-purple-600 rounded mt-1"></div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64 group">
                        <input
                            type="text"
                            placeholder="Search retailers... (Enter)"
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-400"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                        <svg className="w-5 h-5 text-gray-400 dark:text-slate-500 absolute left-3 top-2.5 transition-colors group-focus-within:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-purple-100 dark:hover:bg-slate-700 rounded-full text-gray-400 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData({ shopName: '', ownerName: '', phone: '', address: '', gstin: '' }); }}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 shadow-md transition-all transform hover:scale-105"
                    >
                        <Plus size={20} /> <span className="hidden sm:inline">Add Retailer</span>
                    </button>
                </div>
            </div>

            {loading ? <LoadingSpinner /> : (
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                        <thead className="bg-gray-50/50 dark:bg-slate-800/50 transition-colors">
                            <tr>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider">Shop Name</th>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider">Owner / GSTIN</th>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider">Mobile</th>
                                <th className="px-3 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider">Address</th>
                                <th className="px-3 py-3 text-right text-[11px] font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider">Credit Balance</th>
                                <th className="px-3 py-3 text-right text-[11px] font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800 transition-colors">
                            {retailers.map(retailer => (
                                <tr key={retailer.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors duration-150">
                                    <td className="px-3 py-3">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-extrabold text-sm shadow-inner transition-colors">
                                                {retailer.shopName?.charAt(0).toUpperCase() || 'R'}
                                            </div>
                                            <div className="ml-3">
                                                <Link to={`/retailers/${retailer.id}`} className="text-[13px] font-bold text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 hover:underline transition-all block break-words min-w-[100px] leading-tight">
                                                    {retailer.shopName}
                                                </Link>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="text-[13px] text-gray-900 dark:text-slate-200 font-bold leading-tight break-words">{retailer.ownerName}</div>
                                        <div className="text-[10px] text-gray-400 dark:text-slate-500 font-mono tracking-tighter mt-0.5 bg-gray-50 dark:bg-slate-700 w-fit px-1 rounded border border-gray-100 dark:border-slate-600">{retailer.gstin || 'NO GSTIN'}</div>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="px-2 py-0.5 inline-flex text-[11px] leading-5 font-bold rounded-md bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-200 shadow-sm">
                                            {retailer.phone}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-[12px] text-gray-500 dark:text-slate-400 break-words max-w-[180px] leading-snug" title={retailer.address}>{retailer.address}</td>
                                    <td className="px-3 py-3 whitespace-nowrap text-right">
                                        <span className={`px-2 py-1 inline-flex text-[12px] font-black rounded-lg ${parseFloat(retailer.creditBalance) > 0 ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50'}`}>
                                            ₹{parseFloat(retailer.creditBalance || 0).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => startEdit(retailer)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors shadow-sm"><Edit size={16} strokeWidth={2.5} /></button>
                                            <button onClick={() => handleDelete(retailer.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/30 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors shadow-sm"><Trash2 size={16} strokeWidth={2.5} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800">
                        <div className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                            Showing <span className="text-gray-900 dark:text-slate-100 font-bold">{Math.min(totalResults, (page - 1) * limit + 1)}</span> to{' '}
                            <span className="text-gray-900 dark:text-slate-100 font-bold">{Math.min(totalResults, page * limit)}</span> of{' '}
                            <span className="text-black dark:text-white font-black">{totalResults}</span> retailers
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={page === 1}
                                className="p-2 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white dark:bg-slate-800 shadow-sm"
                            >
                                <svg className="w-5 h-5 text-gray-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                            </button>

                            <div className="flex items-center gap-1">
                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (page <= 3) pageNum = i + 1;
                                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = page - 2 + i;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${page === pageNum ? 'bg-purple-600 text-white shadow-lg shadow-purple-100 dark:shadow-purple-900/20' : 'hover:bg-white dark:hover:bg-slate-700 bg-transparent text-gray-600 dark:text-slate-400 border border-transparent hover:border-gray-200 dark:hover:border-slate-700'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={page === totalPages}
                                className="p-2 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white dark:bg-slate-800 shadow-sm text-slate-600 dark:text-slate-400"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-transparent dark:border-slate-800">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">{editingId ? 'Edit Retailer' : 'New Retailer'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" placeholder="Shop Name" className="w-full border border-gray-300 dark:border-slate-700 p-2 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500" value={formData.shopName} onChange={e => setFormData({ ...formData, shopName: e.target.value })} required />
                            <input type="text" placeholder="Owner Name" className="w-full border border-gray-300 dark:border-slate-700 p-2 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500" value={formData.ownerName} onChange={e => setFormData({ ...formData, ownerName: e.target.value })} required />
                            <input type="text" placeholder="GSTIN (Optional)" className="w-full border border-gray-300 dark:border-slate-700 p-2 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500" value={formData.gstin || ''} onChange={e => setFormData({ ...formData, gstin: e.target.value })} />
                            <input type="text" placeholder="Mobile Number" className="w-full border border-gray-300 dark:border-slate-700 p-2 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                            <input type="text" placeholder="Address" className="w-full border border-gray-300 dark:border-slate-700 p-2 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required />
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-all font-bold">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md font-bold transition-all">Save Retailer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Retailers;
