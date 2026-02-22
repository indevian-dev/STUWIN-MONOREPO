
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
  /**
   * Optional progress percentage (0-100)
   */
  progress?: number;
  /**
   * Whether to show the progress bar
   */
  showProgress?: boolean;
}

/**
 * Global Loader Tile
 * A premium, consistent loading indicator used across the application.
 */
export function GlobalLoaderTile({
  fullPage = false,
  message,
  progress = 0,
  showProgress = false
}: GlobalLoaderTileProps) {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto">
      <div className="relative">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-app-full bg-app-bright-green/20 blur-xl animate-pulse"></div>

        {/* Main animated spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-app/10 rounded-app-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-app border-r-app/50 rounded-app-full animate-spin"></div>
        </div>

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-app-bright-green rounded-app-full shadow-[0_0_10px_rgba(var(--brand-rgb),0.5)]"></div>
      </div>

      <div className="text-center space-y-3 w-full">
        {message && (
          <p className="text-sm font-semibold text-app-dark-blue dark:text-white/70 animate-pulse tracking-wide uppercase">
            {message}
          </p>
        )}

        {showProgress && (
          <div className="space-y-2 w-full">
            <div className="w-full bg-app-bright-green/10 rounded-app-full h-2 overflow-hidden">
              <div
                className="bg-app-bright-green h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(var(--brand-rgb),0.3)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs font-bold text-app-bright-green/80 tabular-nums">
              {progress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-xl transition-all duration-500 animate-in fade-in">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-12 min-h-[250px] w-full animate-in fade-in duration-500">
      {loaderContent}
    </div>
  );
}