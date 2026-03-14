import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-3 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 active:scale-95 group"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            <div className={`transform transition-all duration-500 ${theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0 opacity-0 absolute'}`}>
                <Sun size={20} strokeWidth={2.5} />
            </div>
            <div className={`transform transition-all duration-500 ${theme === 'light' ? 'rotate-0 scale-100' : '-rotate-90 scale-0 opacity-0 absolute'}`}>
                <Moon size={20} strokeWidth={2.5} />
            </div>
        </button>
    );
};

export default ThemeToggle;
