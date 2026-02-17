import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 48, className = "" }) => {
    return (
        <div className={`flex flex-col items-center justify-center min-h-[50vh] ${className}`}>
            <Loader2 size={size} className="animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">Loading...</p>
        </div>
    );
};

export default LoadingSpinner;
