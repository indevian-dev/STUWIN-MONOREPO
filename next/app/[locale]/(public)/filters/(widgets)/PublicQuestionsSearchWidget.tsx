"use client";

import React, {
    useState
} from 'react';

interface PublicCardsSearchWidgetProps {
    placeholder?: string;
    className?: string;
    onSearchChange?: (value: string) => void;
}

export function PublicCardsSearchWidget({
    placeholder = "Search cards...",
    className = "",
    onSearchChange
}: PublicCardsSearchWidgetProps) {
    const [localSearchText, setLocalSearchText] = useState('');

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalSearchText(value);
        if (onSearchChange) onSearchChange(value);
    };

    // Handle search form submission
    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (onSearchChange) onSearchChange(localSearchText);
    };

    // Clear search
    const handleClearSearch = () => {
        setLocalSearchText('');
        if (onSearchChange) onSearchChange('');
    };


    return (
        <div className={`cards-search-widget w-full ${className}`}>
            <form onSubmit={handleSearchSubmit} className="rounded">
                <div className="relative w-full">
                    {/* Search Input */}
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={localSearchText}
                            onChange={handleSearchChange}
                            placeholder={placeholder}
                            className="w-full px-4 py-3 pr-20 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                        />

                        {/* Clear Button */}
                        {localSearchText && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                aria-label="Clear search"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}

                        {/* Search Button */}
                        <button
                            type="submit"
                            disabled={!localSearchText.trim()}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white px-3 py-1 rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            aria-label="Search"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
