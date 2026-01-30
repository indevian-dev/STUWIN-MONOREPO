import React from 'react';

interface GlobalPaginationTileProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function GlobalPaginationTile({ currentPage, totalPages, onPageChange }: GlobalPaginationTileProps) {
    return (
        <div>
            <h1>Global Pagination</h1>
            <div>
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
            </div>
            <div>
                <span>Page {currentPage} of {totalPages}</span>
            </div>
        </div>
    );
}