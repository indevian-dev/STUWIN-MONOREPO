
"use client";

import React from 'react';

interface GlobalLoaderTileProps {
  /**
   * If true, renders as a fixed full-page overlay with backdrop blur.
   * If false (default), renders as a block element centered in its container.
   */
  fullPage?: boolean;
  /**
   * Optional message to display under the spinner
   */
  message?: string;
}

/**
 * Global Loader Tile
 * A premium, consistent loading indicator used across the application.
 */
export function GlobalLoaderTile({ fullPage = false, message }: GlobalLoaderTileProps) {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full bg-brand/20 blur-xl animate-pulse"></div>

        {/* Main animated spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-brand/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-brand border-r-brand/50 rounded-full animate-spin"></div>
        </div>

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-brand rounded-full shadow-[0_0_10px_rgba(var(--brand-rgb),0.5)]"></div>
      </div>

      {message && (
        <p className="text-sm font-medium text-dark/60 animate-pulse tracking-wide uppercase">
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-md transition-all duration-300">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-12 min-h-[200px] w-full">
      {loaderContent}
    </div>
  );
}