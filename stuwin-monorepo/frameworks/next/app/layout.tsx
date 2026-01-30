import React from 'react';
import './globals.css';

/**
 * Root Layout - Server Component (Public)
 * Provides HTML structure
 * This is a public layout - no auth required
 */


async function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export default RootLayout;
