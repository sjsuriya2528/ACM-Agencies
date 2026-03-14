import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-[1.5rem] transition-all duration-500 border border-slate-200 dark:border-white/5 hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] active:scale-95 group relative overflow-hidden"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            <div className={`transform transition-all duration-500 ${theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0 opacity-0 absolute'}`}>
                <Sun size={26} strokeWidth={2.5} className="group-hover:rotate-45 transition-transform" />
            </div>
            <div className={`transform transition-all duration-500 ${theme === 'light' ? 'rotate-0 scale-100' : '-rotate-90 scale-0 opacity-0 absolute'}`}>
                <Moon size={26} strokeWidth={2.5} className="group-hover:-rotate-12 transition-transform" />
            </div>
        </button>
    );
};

export default ThemeToggle;
