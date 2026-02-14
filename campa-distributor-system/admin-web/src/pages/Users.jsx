import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Users = () => {
    const [users, setUsers] = useState([]); // In a real app we'd fetch from /users endpoint if it exists or filter generic user endpoint
    // For now, let's assume there is a way to get users. The backend has standard user routes?
    // backend/routes/userRoutes.js exists.
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'sales_rep', phone: '' });
    const [editingId, setEditingId] = useState(null);

    const fetchUsers = async () => {
        try {
            // Need to check if there is a get all users endpoint. Usually GET /api/users
            // backend/routes/userRoutes.js: router.route('/').post(registerUser).get(protect, admin, getAllUsers) ??
            // We need to verify that logic, assuming yes.
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Determine update endpoint. PUT /api/users/:id or /api/users/profile/:id
                // Likely PUT /api/users/:id if implemented
                await api.put(`/users/${editingId}`, formData);
            } else {
                await api.post('/users', formData); // Should be register user
            }
            setIsModalOpen(false);
            setFormData({ name: '', email: '', password: '', role: 'sales_rep', phone: '' });
            setEditingId(null);
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert("Operation failed: " + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            console.error(error);
        }
    };

    const startEdit = (user) => {
        setFormData({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' });
        setEditingId(user.id);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Users</h1>
                <button
                    onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData({ name: '', email: '', password: '', role: 'sales_rep', phone: '' }); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} /> Add User
                </button>
            </div>

            {loading ? <div>Loading...</div> : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                user.role === 'sales_rep' ? 'bg-green-100 text-green-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => startEdit(user)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
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
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit User' : 'New User'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" placeholder="Name" className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            <input type="email" placeholder="Email" className="w-full border p-2 rounded" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            {!editingId && <input type="password" placeholder="Password" className="w-full border p-2 rounded" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />}
                            <select
                                className="w-full border p-2 rounded"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="sales_rep">Sales Rep</option>
                                <option value="driver">Driver</option>
                                <option value="collection_agent">Collection Agent</option>
                                <option value="admin">Admin</option>
                            </select>
                            <input type="text" placeholder="Phone" className="w-full border p-2 rounded" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
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

export default Users;
