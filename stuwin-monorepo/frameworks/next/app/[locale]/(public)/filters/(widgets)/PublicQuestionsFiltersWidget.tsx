"use client";

import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    useMemo
} from 'react';
import { GlobalSelectWidget } from '@/app/[locale]/(global)/(widgets)/GlobalSelectWidget';


// Types
interface CategoryStat {
    category_id: string;
    public_cards_count: number;
}

interface CategoryFacet {
    id: string;
    count: number;
}

interface FilterOption {
    id: string;
    title: string;
    type: 'DYNAMIC' | 'SELECT';
    category_filter_options?: Array<{
        id: string;
        title: string;
    }>;
}

interface Subject {
    id: string;
    title?: string;
}

interface UserFilters {
    categories: string[];
    price: { min: number | null; max: number | null };
    [key: string]: any;
}

interface PublicCardsFiltersWidgetProps {
    withCategoriesStats?: boolean;
    categoriesStats?: CategoryStat[];
    showCategoryFilters?: boolean;
    className?: string;
    onFiltersChange?: (filters: UserFilters) => void;
}

export function PublicCardsFiltersWidget({
    withCategoriesStats = false,
    categoriesStats = [],
    showCategoryFilters = true,
    className = '',
    onFiltersChange
}: PublicCardsFiltersWidgetProps) {
    const [cardOptions, setCardOptions] = useState<FilterOption[]>([]);
    const [selectedCategoryPath, setSelectedCategoryPath] = useState<string[]>([]);
    const [categoryLevels, setCategoryLevels] = useState<Subject[][]>([]);
    const [userFilters, setUserFilters] = useState<UserFilters>({
        categories: [],
        price: { min: null, max: null }
    });
    const filterFacets = useMemo<FilterOption[]>(() => [], []);
    const categoryFacets = useMemo<CategoryFacet[]>(() => [], []);
    const initialProps = useMemo<{ categoryId?: string }>(() => ({}), []);

    // Mocking context data as GlobalSubjectsContext is removed
    const categoriesHierarchy: Subject[] = [];
    const categoriesLoading = false;

    // Refs for stable tracking
    const isInitialized = useRef(false);
    const categoriesStatsRef = useRef<CategoryStat[]>([]);

    // Update refs when props change
    useEffect(() => {
        categoriesStatsRef.current = categoriesStats;
    }, [categoriesStats]);

    // Sync selected filters
    useEffect(() => {
        if (userFilters.categories) {
            setSelectedCategoryPath(userFilters.categories);
        }
    }, [userFilters.categories]);

    const updateUserFilters = (newFilters: UserFilters) => {
        setUserFilters(newFilters);
        if (onFiltersChange) onFiltersChange(newFilters);
    };

    const applyFilters = () => {
        if (onFiltersChange) onFiltersChange(userFilters);
    };

    const clearFilters = () => {
        const emptyFilters = {
            categories: [],
            price: { min: null, max: null }
        };
        setUserFilters(emptyFilters);
        if (onFiltersChange) onFiltersChange(emptyFilters);
    };

    // Initialize component when hierarchy and props are ready
    useEffect(() => {
        if (categoriesLoading || categoriesHierarchy.length === 0) return;

        const initializeComponent = () => {

            // Filter categories based on available categories or stats
            let filteredCategories = [];

            if (categoryFacets.length > 0) {
                // Use dynamic faceted categories from current search results (highest priority)
                const availableCategoryIds = new Set(categoryFacets.map(cat => cat.id));
                filteredCategories = categoriesHierarchy.filter(cat =>
                    availableCategoryIds.has(cat.id)
                );
            } else if (withCategoriesStats && categoriesStatsRef.current.length > 0) {
                // Fall back to stats: show categories that have cards in this category page
                const validCategoryIds = new Set(
                    categoriesStatsRef.current
                        .filter(cat => cat.public_cards_count > 0)
                        .map(cat => cat.category_id)
                );
                filteredCategories = categoriesHierarchy.filter(cat =>
                    validCategoryIds.has(cat.id)
                );
            } else {
                // Default: show all parent categories when no filtering applied
                filteredCategories = categoriesHierarchy;
            }

            setCategoryLevels(filteredCategories.length > 0 ? [filteredCategories] : []);

            // Mark as initialized after everything is set up
            setTimeout(() => {
                isInitialized.current = true;
            }, 200);
        };

        initializeComponent();
    }, [categoriesHierarchy.length, categoriesLoading, withCategoriesStats, categoryFacets]);

    // Use filterFacets from search context, or fetch filters for initial/selected categories
    useEffect(() => {
        const fetchFiltersIfNeeded = async () => {
            // First priority: Use filterFacets from search context if available
            if (filterFacets && filterFacets.length > 0) {
                setCardOptions(filterFacets);
                return;
            }

            // TODO: Implement filter fetching when getCategoryFilters is available in context
            // For now, just use filterFacets or empty array
            setCardOptions([]);
        };

        fetchFiltersIfNeeded();
    }, [filterFacets, userFilters.categories, initialProps.categoryId]);

    const handleCategoryChange = useCallback(async (categoryId: string, level: number) => {
        let newPath: string[];

        if (!categoryId) {
            // Clear selection from this level onwards
            newPath = selectedCategoryPath.slice(0, level);
        } else {
            newPath = [...selectedCategoryPath.slice(0, level), categoryId];

            // TODO: Implement subcategory fetching when getSubCategories is available in context
            // For now, just update the path without fetching subcategories
        }

        // Update local state and context
        setSelectedCategoryPath(newPath);
        updateUserFilters({
            ...userFilters,
            categories: newPath
        });
    }, [selectedCategoryPath, categoryLevels, withCategoriesStats, userFilters, updateUserFilters]);

    const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = value === '' ? null : parseFloat(value);

        updateUserFilters({
            ...userFilters,
            price: {
                ...userFilters.price,
                [name === 'minPrice' ? 'min' : 'max']: numericValue
            }
        });
    }, [userFilters, updateUserFilters]);

    const handleFilterChange = useCallback((filterId: string, value: string | string[]) => {
        updateUserFilters({
            ...userFilters,
            [filterId]: value || undefined
        });
    }, [userFilters, updateUserFilters]);

    const handleDynamicFilterChange = useCallback((filterId: string, type: string, value: string) => {
        const numericValue = value === '' ? null : parseFloat(value);

        updateUserFilters({
            ...userFilters,
            [filterId]: {
                ...(userFilters[filterId] || {}),
                [type]: numericValue
            }
        });
    }, [userFilters, updateUserFilters]);

    const handleClearFilters = useCallback(() => {
        // Reset local UI state
        setSelectedCategoryPath([]);

        // Reset category levels to initial state (first level only)
        if (categoriesHierarchy.length > 0) {
            let filteredCategories = [];

            if (categoryFacets.length > 0) {
                // Use dynamic faceted categories from current search results (highest priority)
                const availableCategoryIds = new Set(categoryFacets.map(cat => cat.id));
                filteredCategories = categoriesHierarchy.filter(cat =>
                    availableCategoryIds.has(cat.id)
                );
            } else if (withCategoriesStats && categoriesStatsRef.current.length > 0) {
                // Fall back to stats: show categories that have cards in this category page
                const validCategoryIds = new Set(
                    categoriesStatsRef.current
                        .filter(cat => cat.public_cards_count > 0)
                        .map(cat => cat.category_id)
                );
                filteredCategories = categoriesHierarchy.filter(cat =>
                    validCategoryIds.has(cat.id)
                );
            } else {
                // Default: show all parent categories
                filteredCategories = categoriesHierarchy;
            }

            setCategoryLevels(filteredCategories.length > 0 ? [filteredCategories] : []);
        }

        // Clear filters in search context
        clearFilters();
    }, [categoriesHierarchy, withCategoriesStats, categoryFacets, clearFilters]);

    const handleApplyFilters = useCallback(() => {
        // Apply filters in search context
        applyFilters();
    }, [applyFilters]);

    const renderCategorySelectors = () => {
        // If category filters are disabled, return empty array
        if (!showCategoryFilters) {
            return [];
        }

        const selectors: React.ReactElement[] = [];

        categoryLevels.forEach((levelCategories, originalLevel) => {
            // Only process levels that have categories
            if (!levelCategories || levelCategories.length === 0) {
                return;
            }

            const selectedValue = selectedCategoryPath[originalLevel] ? String(selectedCategoryPath[originalLevel]) : '';
            const levelLabel = originalLevel === 0 ? 'Category' : `Subcategory Level ${originalLevel}`;

            const categoryOptions = levelCategories.map((category: Subject) => {
                let countText = '';

                if (withCategoriesStats) {
                    const statsCategory = categoriesStatsRef.current.find(stat => stat.category_id === category.id);
                    countText = statsCategory ? ` (${statsCategory.public_cards_count})` : '';
                } else {
                    const facetCategory = categoryFacets.find(facet => facet.id === category.id);
                    countText = facetCategory ? ` (${facetCategory.count})` : '';
                }

                return {
                    label: `${category.title}${countText}`,
                    value: String(category.id)
                };
            });

            selectors.push(
                <div key={`category-level-${originalLevel}`} className="col-span-12 w-full">
                    <div className="rounded space-y-2 w-full">
                        <div className="font-bold w-full">{levelLabel}</div>
                        <GlobalSelectWidget
                            options={[
                                { label: `Select ${levelLabel}`, value: '' },
                                ...categoryOptions
                            ]}
                            onChange={(value: string | string[]) => handleCategoryChange(value as string, originalLevel)}
                            value={selectedValue}
                            placeholder={`Select ${levelLabel}`}
                            isMulti={false}
                        />
                    </div>
                </div>
            );
        });

        return selectors;
    };

    return (
        <div className={`filter-section ${className} flex flex-col gap-4 mb-6 w-full text-dark text-md items-start`}>
            {/* Category Selection */}
            {renderCategorySelectors()}

            {/* Dynamic Category Filters */}
            {cardOptions.map((cardOption: FilterOption) => {
                const dynamicFilterValue = userFilters[cardOption.id] as { min?: number; max?: number } | undefined;
                const selectFilterValue = userFilters[cardOption.id] as string[] | string | undefined;

                return (
                    <div key={cardOption.id} className="col-span-12 flex items-stretch w-full">
                        <div className="rounded space-y-2 w-full">
                            <div className="font-bold w-full">{cardOption.title}</div>
                            {cardOption.type === 'DYNAMIC' ? (
                                <div className="flex items-center space-x-2 w-full">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        aria-label={`Minimum ${cardOption.title}`}
                                        className="form-input px-2 py-1 rounded border border-light w-full"
                                        value={dynamicFilterValue?.min ?? ''}
                                        onChange={(e) => handleDynamicFilterChange(cardOption.id, 'min', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        aria-label={`Maximum ${cardOption.title}`}
                                        className="form-input px-2 py-1 rounded border border-light w-full"
                                        value={dynamicFilterValue?.max ?? ''}
                                        onChange={(e) => handleDynamicFilterChange(cardOption.id, 'max', e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <GlobalSelectWidget
                                        options={(cardOption.category_filter_options || []).map((option: { id: string; title: string }) => ({
                                            label: option.title,
                                            value: option.id
                                        }))}
                                        onChange={(value: string | string[]) => handleFilterChange(cardOption.id, value)}
                                        value={selectFilterValue || []}
                                        isMulti={true}
                                    />
                                    <span className="text-xs text-gray-500">Multiple selection</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Price Filter Section */}
            <div className="col-span-12 flex items-stretch w-full">
                <div className="rounded space-y-2 w-full">
                    <div className="font-bold w-full">Price Range</div>
                    <div className="price-filter w-full flex gap-2 ">
                        <input
                            type="number"
                            id="minPrice"
                            name="minPrice"
                            value={userFilters.price?.min || ''}
                            onChange={handlePriceChange}
                            placeholder="Min Price"
                            className='w-full rounded border border-light p-2'
                        />
                        <input
                            type="number"
                            id="maxPrice"
                            name="maxPrice"
                            value={userFilters.price?.max || ''}
                            onChange={handlePriceChange}
                            placeholder="Max Price"
                            className='w-full rounded border border-light p-2'
                        />
                    </div>
                </div>
            </div>

            {/* Filter Action Buttons */}
            <div className="col-span-12 flex items-center justify-between gap-4 w-full mt-4">
                <button
                    type="button"
                    onClick={handleClearFilters}
                    className="flex-1 px-4 py-2 bg-dark hover:bg-dark/80 text-white font-medium rounded-lg transition-colors duration-200 border border-dark"
                >
                    Clear
                </button>
                <button
                    type="button"
                    onClick={handleApplyFilters}
                    className="flex-1 px-4 py-2 bg-brand hover:bg-brand/80 text-white font-medium rounded-lg transition-colors duration-200 border border-brand"
                >
                    Apply
                </button>
            </div>
        </div>
    );
};
