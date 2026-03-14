import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Check for saved theme or system preference
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('acm-theme');
        if (saved) return saved;
        return window.matchMedia('(pre-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        
        // Remove old theme classes
        root.classList.remove('light', 'dark');
        
        // Add new theme class
        root.classList.add(theme);
        
        // Persist theme
        localStorage.setItem('acm-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
