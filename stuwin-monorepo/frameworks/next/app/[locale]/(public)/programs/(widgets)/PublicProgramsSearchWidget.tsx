
"use client";

import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

interface PublicProgramsSearchWidgetProps {
    onSearch: (query: string) => void;
    initialValue?: string;
}

export function PublicProgramsSearchWidget({ onSearch, initialValue = '' }: PublicProgramsSearchWidgetProps) {
    const [value, setValue] = useState(initialValue);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(value);
    };

    return (
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-10">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Proqram və ya təşkilat axtarın..."
                    className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm group-hover:shadow-md"
                />
                <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 px-6 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-colors shadow-sm"
                >
                    Axtar
                </button>
            </div>
        </form>
    );
}
