import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <h1 className="text-4xl font-bold text-red-600 mb-4">Unauthorized</h1>
            <p className="text-gray-600 mb-8">You do not have permission to view this page.</p>
            <Link to="/" className="text-blue-600 hover:underline">
                Go Home
            </Link>
        </div>
    );
};

export default Unauthorized;
