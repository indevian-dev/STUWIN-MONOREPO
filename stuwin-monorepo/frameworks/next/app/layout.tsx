import React from 'react';
import './globals.css';

/**
 * Root Layout - Server Component (Public)
 * Provides HTML structure
 * This is a public layout - no auth required
 */


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
