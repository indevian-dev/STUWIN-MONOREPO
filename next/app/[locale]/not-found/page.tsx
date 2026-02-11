import React from 'react';
import Link from 'next/link';
import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
};

export const metadata: Metadata = {
    title: 'Page Not Found',
    description: 'The requested page could not be found.',
};


export default async function NotFound() {

    return (
        <div className="flex flex-col items-center justify-center min-h-auto bg-gradient-to-br from-gray-50 to-gray-100 p-4 py-24">
            <div className="text-center space-y-6 max-w-2xl">
                <h1 className="text-9xl font-bold text-gray-800">404</h1>
                <h2 className="text-3xl font-semibold text-gray-700">Səhifə tapılmadı</h2>
                <p className="text-lg text-gray-600">Səhifə tapılmadı</p>
                <div className="flex gap-4 justify-center">
                    <Link
                        href="/blog"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        Bütün postlar
                    </Link>
                    <Link
                        href="/"
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                        Ana səhifəyə keç
                    </Link>
                </div>
            </div>
        </div>
    )
}

export function generateStaticParams() {
    return [{ locale: 'en' }, { locale: 'az' }, { locale: 'ru' }];
}