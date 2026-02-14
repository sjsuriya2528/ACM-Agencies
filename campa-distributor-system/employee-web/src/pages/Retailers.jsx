import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ArrowLeft, UserPlus, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Retailers = () => {
    const [retailers, setRetailers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRetailers = async () => {
            try {
                const response = await api.get('/retailers');
                setRetailers(response.data);
            } catch (error) {
                console.error("Failed to fetch retailers", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRetailers();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">Retailers</h1>
                <button className="p-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700">
                    <UserPlus size={20} />
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading...</div>
            ) : (
                <div className="space-y-4">
                    {retailers.map((retailer) => (
                        <div key={retailer.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800">{retailer.shopName}</h3>
                            <p className="text-gray-500 text-sm mb-2">{retailer.ownerName}</p>

                            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                                <Phone size={16} className="text-blue-500" />
                                <span>{retailer.mobileNumber}</span>
                            </div>
                            <div className="flex items-start gap-2 text-gray-600 text-sm">
                                <MapPin size={16} className="text-red-500 mt-0.5" />
                                <span>{retailer.address}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Retailers;
