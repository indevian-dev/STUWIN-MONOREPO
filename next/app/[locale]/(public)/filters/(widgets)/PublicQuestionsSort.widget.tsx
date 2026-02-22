"use client";

import React, {
    useState
} from 'react';
import { GlobalSelectWidget } from '@/app/[locale]/(global)/(widgets)/GlobalSelect.widget';

interface PublicCardsSortWidgetProps {
    defaultSort?: string;
    className?: string;
    showSortLabel?: boolean;
    onSortChange?: (value: string) => void;
}

interface QuickSortButtonProps {
    sortValue: string;
    icon?: string;
    label: string;
}

export function PublicCardsSortWidget({
    defaultSort = 'newest',
    className = "",
    showSortLabel = true,
    onSortChange
}: PublicCardsSortWidgetProps) {
    const [selectedSort, setSelectedSort] = useState(defaultSort);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Sort options with proper labels and valuSes
    const sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'price_low', label: 'Price: Low to High' },
        { value: 'price_high', label: 'Price: High to Low' },
        { value: 'title_asc', label: 'Title: A to Z' },
        { value: 'title_desc', label: 'Title: Z to A' },
        { value: 'rating_high', label: 'Highest Rated' },
        { value: 'rating_low', label: 'Lowest Rated' },
        { value: 'random', label: 'Random' },
        { value: 'featured', label: 'Featured' }
    ];

    // Handle sort change
    const handleSortChange = (value: string | string[]) => {
        const sortValue = Array.isArray(value) ? value[0] : value;
        setSelectedSort(sortValue);
        if (onSortChange) onSortChange(sortValue);
    };

    // Reset sort to default
    const handleResetSort = () => {
        setSelectedSort(defaultSort);
        if (onSortChange) onSortChange(defaultSort);
    };

    // Get current sort label for button display
    const getCurrentSortLabel = () => {
        const currentOption = sortOptions.find(option => option.value === selectedSort);
        return currentOption ? currentOption.label : 'Sort';
    };

    // Quick sort buttons for common options
    const QuickSortButton = ({ sortValue, icon, label }: QuickSortButtonProps) => {
        const isActive = selectedSort === sortValue;
        return (
            <button
                onClick={() => handleSortChange(sortValue)}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-app text-sm font-medium 
                    transition-all duration-200 border
                    ${isActive
                        ? 'bg-app-bright-green text-white border-app shadow-sm'
                        : 'bg-white text-app-dark-blue dark:text-white border-app-light hover:bg-app-bright-green-light hover:border-semilight'
                    }
                `}
                aria-label={`Sort by ${label}`}
            >
                {icon && <span className="text-base">{icon}</span>}
                <span>{label}</span>
            </button>
        );
    };

    return (
        <>
            {/* Sort Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className={`
                    flex items-center gap-2 px-1 py-1 rounded-app text-xs font-medium 
                    transition-all duration-200 border bg-white text-app-dark-blue dark:text-white border-app-light 
                    hover:bg-app-bright-green-light hover:border-semilight ${className}
                `}
                aria-label="Open sort options"
            >
                <span className="text-base">⚡</span>
                <span className="hidden sm:inline"></span>
                <span className="font-semibold">{getCurrentSortLabel()}</span>
                <span className="text-xs">▼</span>
            </button>

            {/* Sort Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-app p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="space-y-6">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-app-dark-blue dark:text-white">Sort Options</h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                                    aria-label="Close modal"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Main Sort Dropdown */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-app-dark-blue dark:text-white">
                                    Select Sort Option
                                </label>
                                <GlobalSelectWidget
                                    options={sortOptions}
                                    onChange={handleSortChange}
                                    value={selectedSort}
                                    placeholder="Select sorting option..."
                                    isMulti={false}
                                />
                            </div>

                            {/* Quick Sort Buttons */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-app-dark-blue dark:text-white">
                                    Quick Sort
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <QuickSortButton
                                        sortValue="newest"
                                        icon="🕐"
                                        label="Latest"
                                    />
                                    <QuickSortButton
                                        sortValue="price_low"
                                        icon="💰"
                                        label="Low Price"
                                    />
                                    <QuickSortButton
                                        sortValue="rating_high"
                                        icon="⭐"
                                        label="Top Rated"
                                    />
                                    <QuickSortButton
                                        sortValue="random"
                                        icon="🎲"
                                        label="Random"
                                    />
                                </div>
                            </div>

                            {/* Sort Direction Toggle for supported sorts */}
                            {(selectedSort.includes('price') || selectedSort.includes('title') || selectedSort.includes('rating')) && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-app-dark-blue dark:text-white">
                                        Sort Direction
                                    </label>
                                    <button
                                        onClick={() => {
                                            const isAsc = selectedSort.includes('_low') || selectedSort.includes('_asc');
                                            const baseSort = selectedSort.split('_')[0];
                                            const newDirection = isAsc ?
                                                (baseSort === 'price' ? '_high' : '_desc') :
                                                (baseSort === 'price' ? '_low' : '_asc');
                                            handleSortChange(baseSort + newDirection);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-app-bright-green-light hover:bg-semilight rounded-app text-sm font-medium transition-colors duration-200"
                                    >
                                        <span className="text-lg">
                                            {selectedSort.includes('_low') || selectedSort.includes('_asc') ? '↑' : '↓'}
                                        </span>
                                        <span>Reverse Order</span>
                                    </button>
                                </div>
                            )}

                            {/* Modal Actions */}
                            <div className="flex gap-3 pt-4 border-t">
                                {selectedSort !== defaultSort && (
                                    <button
                                        onClick={handleResetSort}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-app-bright-green border border-app rounded-app hover:bg-app-bright-green hover:text-white transition-colors duration-200"
                                    >
                                        Reset to Default
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium bg-app-bright-green text-white rounded-app hover:bg-app-bright-green/90 transition-colors duration-200"
                                >
                                    Apply Sort
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
