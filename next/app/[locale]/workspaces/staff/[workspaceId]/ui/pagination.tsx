'use client'

import { useState } from 'react';

interface PaginationProps {
    currentPage?: number;
    page?: number;
    totalPages?: number;
    totalItems?: number;
    itemsPerPage?: number;
    onPageChange?: (page: number) => void;
    setPage?: (page: number) => void;
}

const Pagination = ({ currentPage, page, totalPages, totalItems, itemsPerPage, onPageChange, setPage }: PaginationProps) => {
    // Use either currentPage or page prop
    const activePage = currentPage || page || 1;
    
    // Calculate total pages if not provided directly
    const calculatedTotalPages = totalPages || (totalItems && itemsPerPage ? Math.ceil(totalItems / itemsPerPage) : 1);
    
    // Handle page change using either callback
    const handlePageChange = (newPage: number) => {
        if (onPageChange) {
            onPageChange(newPage);
        } else if (setPage) {
            setPage(newPage);
        }
    };

    return (
        <div className="mt-10 flex justify-center">
            <nav className="flex items-center space-x-2">
                <button
                    onClick={() => handlePageChange(1)}
                    disabled={activePage === 1}
                    className={`px-4 py-2 rounded-md ${activePage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                >
                    First
                </button>
                <button
                    onClick={() => handlePageChange(activePage - 1)}
                    disabled={activePage === 1}
                    className={`px-4 py-2 rounded-md ${activePage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                >
                    Previous
                </button>
                
                {[...Array(calculatedTotalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    // Show first page, last page, and 2 pages before and after current page
                    if (
                        pageNumber === 1 ||
                        pageNumber === calculatedTotalPages ||
                        (pageNumber >= activePage - 2 && pageNumber <= activePage + 2)
                    ) {
                        return (
                            <button
                                key={pageNumber}
                                onClick={() => handlePageChange(pageNumber)}
                                className={`px-4 py-2 rounded-md ${
                                    pageNumber === activePage
                                        ? 'bg-semilight text-black'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                }`}
                            >
                                {pageNumber}
                            </button>
                        );
                    } else if (
                        pageNumber === activePage - 3 ||
                        pageNumber === activePage + 3
                    ) {
                        return <span key={pageNumber} className="px-2">...</span>;
                    }
                    return null;
                })}

                <button
                    onClick={() => handlePageChange(activePage + 1)}
                    disabled={activePage >= calculatedTotalPages}
                    className={`px-4 py-2 rounded-md ${activePage >= calculatedTotalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                >
                    Next
                </button>
                <button
                    onClick={() => handlePageChange(calculatedTotalPages)}
                    disabled={activePage === calculatedTotalPages}
                    className={`px-4 py-2 rounded-md ${activePage === calculatedTotalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                >
                    Last
                </button>
            </nav>
        </div>
    );
};

export default Pagination;