
"use client";

import React, { useState, useEffect } from 'react';
import { PublicProgramsListItemWidget } from './PublicProgramsListItem.widget';
import { PublicProgramsSearchWidget } from './PublicProgramsSearch.widget';
import { Program, fetchProgramsClient } from '../PublicProgramsService';

interface PublicProgramsListWidgetProps {
    initialPrograms?: Program[];
    initialTotal?: number;
    initialPage?: number;
    pageSize?: number;
}

export function PublicProgramsListWidget({
    initialPrograms = [],
    initialTotal = 0,
    initialPage = 1,
    pageSize = 24
}: PublicProgramsListWidgetProps) {
    const [programs, setPrograms] = useState<Program[]>(initialPrograms);
    const [total, setTotal] = useState(initialTotal);
    const [page, setPage] = useState(initialPage);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialPrograms.length === 0) {
            handleFetch(initialPage, '');
        }
    }, []);

    const handleFetch = async (pageNum: number, searchQuery: string) => {
        setLoading(true);
        const result = await fetchProgramsClient({
            page: pageNum,
            pageSize,
            search: searchQuery
        });

        if (result.success) {
            setPrograms(result.programs);
            setTotal(result.total);
            setPage(pageNum);
        }
        setLoading(false);
        // Scroll to top of list
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSearch = (query: string) => {
        setSearch(query);
        handleFetch(1, query);
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="w-full">
            {/* Search Widget */}
            <PublicProgramsSearchWidget onSearch={handleSearch} initialValue={search} />

            {/* Results Status */}
            <div className="mb-6 flex items-center justify-between">
                <p className="text-gray-600 font-medium">
                    {loading ? 'Axtarılır...' : `${total} proqram tapıldı`}
                </p>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-[320px] bg-gray-100 rounded-app" />
                    ))}
                </div>
            ) : programs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {programs.map((program) => (
                        <PublicProgramsListItemWidget key={program.id} program={program} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-app border border-dashed border-gray-300">
                    <p className="text-gray-400 text-lg">Heç bir proqram tapılmadı.</p>
                    <button
                        onClick={() => handleSearch('')}
                        className="mt-4 text-app-bright-green font-semibold hover:underline"
                    >
                        Bütün proqramları göstər
                    </button>
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-12 pb-10">
                    <button
                        onClick={() => handleFetch(page - 1, search)}
                        disabled={page === 1}
                        className="px-6 py-2.5 bg-white border border-gray-200 rounded-app text-gray-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-app/30 transition-all shadow-sm"
                    >
                        Əvvəlki
                    </button>

                    <div className="flex items-center gap-2">
                        {[...Array(totalPages)].map((_, i) => {
                            const p = i + 1;
                            // Show only current, first, last and neighbors if too many
                            if (
                                p === 1 ||
                                p === totalPages ||
                                (p >= page - 1 && p <= page + 1)
                            ) {
                                return (
                                    <button
                                        key={p}
                                        onClick={() => handleFetch(p, search)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-app font-semibold transition-all ${page === p
                                            ? 'bg-app-bright-green text-white shadow-md'
                                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            }
                            if (p === 2 || p === totalPages - 1) {
                                return <span key={p} className="text-gray-400">...</span>;
                            }
                            return null;
                        })}
                    </div>

                    <button
                        onClick={() => handleFetch(page + 1, search)}
                        disabled={page === totalPages}
                        className="px-6 py-2.5 bg-white border border-gray-200 rounded-app text-gray-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-app/30 transition-all shadow-sm"
                    >
                        Növbəti
                    </button>
                </div>
            )}
        </div>
    );
}
