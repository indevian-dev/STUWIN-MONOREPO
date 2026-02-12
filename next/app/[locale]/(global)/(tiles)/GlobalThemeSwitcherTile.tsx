'use client';

import React from 'react';
import { PiSunBold, PiMoonBold } from 'react-icons/pi';

export function GlobalThemeSwitcherTile() {
    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center bg-slate-50 border border-slate-100 p-1.5 rounded-xl w-full">
                <button
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white text-slate-900 shadow-sm border border-slate-100 transition-all font-bold text-sm"
                    aria-label="Light Mode"
                >
                    <PiSunBold size={18} className="text-brand" />
                    <span>Light</span>
                </button>
                <button
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-slate-400 hover:text-slate-600 transition-all font-bold text-sm"
                    aria-label="Dark Mode"
                >
                    <PiMoonBold size={18} />
                    <span>Dark</span>
                </button>
            </div>
        </div>
    );
}
