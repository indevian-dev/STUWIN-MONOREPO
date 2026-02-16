'use client';

import React, { useState, useEffect } from 'react';
import { PiSunBold, PiMoonBold } from 'react-icons/pi';

export function GlobalThemeSwitcherTile() {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
        }
        return 'light';
    });

    // Sync DOM classList with theme state on mount
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    const handleSwitch = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center bg-slate-50 border border-slate-100 p-1.5 rounded-xl w-full">
                <button
                    onClick={() => handleSwitch('light')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all font-bold text-sm ${theme === 'light'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                        : 'text-slate-400 hover:text-slate-600'
                        }`}
                    aria-label="Light Mode"
                >
                    <PiSunBold size={18} className={theme === 'light' ? 'text-brand' : ''} />
                    <span>Light</span>
                </button>
                <button
                    onClick={() => handleSwitch('dark')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all font-bold text-sm ${theme === 'dark'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                        : 'text-slate-400 hover:text-slate-600'
                        }`}
                    aria-label="Dark Mode"
                >
                    <PiMoonBold size={18} className={theme === 'dark' ? 'text-brand' : ''} />
                    <span>Dark</span>
                </button>
            </div>
        </div>
    );
}
