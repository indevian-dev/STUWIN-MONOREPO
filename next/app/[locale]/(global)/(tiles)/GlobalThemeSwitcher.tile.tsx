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
        <div
            className="flex items-center p-1 rounded-app gap-1
              bg-black/5 dark:bg-white/8 border border-black/8 dark:border-white/10"
        >
            {/* Light button */}
            <button
                onClick={() => handleSwitch('light')}
                aria-label="Light Mode"
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-app transition-all text-sm font-bold ${theme === 'light'
                        ? 'bg-white dark:bg-app-dark-blue shadow-sm border border-black/8 dark:border-white/10 text-app-dark-blue dark:text-white'
                        : 'text-app-dark-blue/40 dark:text-white/40 hover:text-app-dark-blue dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
            >
                <PiSunBold size={16} className={theme === 'light' ? 'text-app-bright-green' : ''} />
                <span>Light</span>
            </button>

            {/* Dark button */}
            <button
                onClick={() => handleSwitch('dark')}
                aria-label="Dark Mode"
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-app transition-all text-sm font-bold ${theme === 'dark'
                        ? 'bg-white dark:bg-app-dark-blue shadow-sm border border-black/8 dark:border-white/10 text-app-dark-blue dark:text-white'
                        : 'text-app-dark-blue/40 dark:text-white/40 hover:text-app-dark-blue dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
            >
                <PiMoonBold size={16} className={theme === 'dark' ? 'text-app-bright-green' : ''} />
                <span>Dark</span>
            </button>
        </div>
    );
}
