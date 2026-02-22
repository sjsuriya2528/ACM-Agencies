import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 48, className = "" }) => {
    const numericSize = {
        sm: 16,
        md: 32,
        lg: 48
    }[size] || (typeof size === 'number' ? size : 48);

    const containerStyle = size === 'sm' ? "min-h-fit" : "min-h-[50vh]";

    return (
        <div className={`flex flex-col items-center justify-center ${containerStyle} ${className}`}>
            <Loader2 size={numericSize} className={`animate-spin text-blue-600 ${size !== 'sm' ? 'mb-4' : ''}`} />
            {size !== 'sm' && <p className="text-gray-500 font-medium animate-pulse">Loading...</p>}
        </div>
    );
};

export default LoadingSpinner;
