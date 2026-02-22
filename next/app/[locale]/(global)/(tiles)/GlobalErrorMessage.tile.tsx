import React from 'react';

interface GlobalErrorMessageTileProps {
    message: string;
}

export function GlobalErrorMessageTile({ message }: GlobalErrorMessageTileProps) {
    return (
        <div className="text-rose-500 bg-rose-50 border border-rose-200 rounded p-2 my-2 text-sm">
            {message}
        </div>
    );
}