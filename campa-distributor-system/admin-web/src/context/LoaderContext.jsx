import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const LoaderContext = createContext();

export const useLoader = () => {
    const context = useContext(LoaderContext);
    if (!context) {
        throw new Error('useLoader must be used within a LoaderProvider');
    }
    return context;
};

export const LoaderProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('Processing...');
    const timeoutRef = useRef(null);

    const showLoader = useCallback((msg = 'Processing...') => {
        setMessage(msg);
        setIsLoading(true);

        // Safety timeout to auto-hide after 15 seconds if something fails
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setIsLoading(false);
        }, 15000);
    }, []);

    const hideLoader = useCallback(() => {
        setIsLoading(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    return (
        <LoaderContext.Provider value={{ isLoading, message, showLoader, hideLoader }}>
            {children}
        </LoaderContext.Provider>
    );
};
