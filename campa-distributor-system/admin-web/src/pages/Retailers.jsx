import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Retailers = () => {
    const [retailers, setRetailers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ shopName: '', ownerName: '', mobileNumber: '', address: '' });
    const [editingId, setEditingId] = useState(null);

    const fetchRetailers = async () => {
        try {
            const response = await api.get('/retailers');
            setRetailers(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRetailers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/retailers/${editingId}`, formData);
            } else {
                await api.post('/retailers', formData);
            }
            setIsModalOpen(false);
            setFormData({ shopName: '', ownerName: '', mobileNumber: '', address: '' });
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
        setFormData({ shopName: retailer.shopName, ownerName: retailer.ownerName, mobileNumber: retailer.mobileNumber, address: retailer.address });
        setEditingId(retailer.id);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Retailers</h1>
                <button
                    onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData({ shopName: '', ownerName: '', mobileNumber: '', address: '' }); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} /> Add Retailer
                </button>
            </div>

            {loading ? <div>Loading...</div> : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {retailers.map(retailer => (
                                <tr key={retailer.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{retailer.shopName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{retailer.ownerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{retailer.mobileNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{retailer.address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => startEdit(retailer)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(retailer.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Retailer' : 'New Retailer'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" placeholder="Shop Name" className="w-full border p-2 rounded" value={formData.shopName} onChange={e => setFormData({ ...formData, shopName: e.target.value })} required />
                            <input type="text" placeholder="Owner Name" className="w-full border p-2 rounded" value={formData.ownerName} onChange={e => setFormData({ ...formData, ownerName: e.target.value })} required />
                            <input type="text" placeholder="Mobile Number" className="w-full border p-2 rounded" value={formData.mobileNumber} onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })} required />
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
