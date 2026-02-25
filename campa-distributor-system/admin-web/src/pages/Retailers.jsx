import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Edit, Trash2 } from 'lucide-react';

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

    useEffect(() => {
        const timer = setTimeout(() => {
            setActiveSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
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
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative">
                    <h1 className="text-2xl font-bold text-gray-800">Retailers</h1>
                    <div className="h-1 w-20 bg-purple-600 rounded mt-1"></div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Search retailers..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    <button
                        onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData({ shopName: '', ownerName: '', phone: '', address: '' }); }}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 shadow-md transition-all transform hover:scale-105"
                    >
                        <Plus size={20} /> <span className="hidden sm:inline">Add Retailer</span>
                    </button>
                </div>
            </div>

            {loading ? <LoadingSpinner /> : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner / GSTIN</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {retailers.map(retailer => (
                                <tr key={retailer.id} className="hover:bg-purple-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-lg">
                                                {retailer.shopName?.charAt(0).toUpperCase() || 'R'}
                                            </div>
                                            <div className="ml-4">
                                                <Link to={`/retailers/${retailer.id}`} className="text-sm font-medium text-purple-600 hover:text-purple-900 hover:underline transition-all">
                                                    {retailer.shopName}
                                                </Link>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-bold">{retailer.ownerName}</div>
                                        <div className="text-[10px] text-gray-400 font-mono tracking-tighter">{retailer.gstin || 'NO GSTIN'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                            {retailer.phone}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={retailer.address}>{retailer.address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => startEdit(retailer)} className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 hover:bg-indigo-50 rounded-full transition-colors"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(retailer.id)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-gray-50 border-t border-gray-100">
                        <div className="text-sm text-gray-500 font-medium">
                            Showing <span className="text-gray-900 font-bold">{Math.min(totalResults, (page - 1) * limit + 1)}</span> to{' '}
                            <span className="text-gray-900 font-bold">{Math.min(totalResults, page * limit)}</span> of{' '}
                            <span className="text-black font-black">{totalResults}</span> retailers
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={page === 1}
                                className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${page === pageNum ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'hover:bg-white bg-transparent text-gray-600 border border-transparent hover:border-gray-200'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={page === totalPages}
                                className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Retailer' : 'New Retailer'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" placeholder="Shop Name" className="w-full border p-2 rounded" value={formData.shopName} onChange={e => setFormData({ ...formData, shopName: e.target.value })} required />
                            <input type="text" placeholder="Owner Name" className="w-full border p-2 rounded" value={formData.ownerName} onChange={e => setFormData({ ...formData, ownerName: e.target.value })} required />
                            <input type="text" placeholder="GSTIN (Optional)" className="w-full border p-2 rounded" value={formData.gstin || ''} onChange={e => setFormData({ ...formData, gstin: e.target.value })} />
                            <input type="text" placeholder="Mobile Number" className="w-full border p-2 rounded" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                            <input type="text" placeholder="Address" className="w-full border p-2 rounded" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required />
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Retailers;
