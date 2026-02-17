import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLoader } from '../context/LoaderContext';

const GlobalLoader = () => {
    const { isLoading, message } = useLoader();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/20 backdrop-blur-md transition-all animate-fade-in">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-white/50 flex flex-col items-center gap-4 max-w-xs w-full mx-4 animate-scale-in">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-50 animate-pulse"></div>
                    <Loader2
                        size={64}
                        className="absolute inset-0 animate-spin text-blue-600"
                    />
                </div>
                <div className="text-center">
                    <p className="text-slate-800 font-bold text-lg">{message}</p>
                    <p className="text-slate-400 text-sm mt-1 font-medium italic">Please wait a moment</p>
                </div>
            </div>
        </div>
    );
};

export default GlobalLoader;
