import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Metadata, Viewport } from 'next';

// 1. Separate Viewport export to fix the warnings
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
};

export const metadata: Metadata = {
    title: 'Forbidden',
    description: 'You are not authorized to access this page.',
};

export default function PublicForbiddenPage() {
    const t = useTranslations('Auth.Forbidden');

    return (
        <div className="flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white p-10 py-24">
            {/* ... rest of your UI ... */}
        </div>
    );
}

export function generateStaticParams() {
    return [{ locale: 'en' }, { locale: 'az' }, { locale: 'ru' }];
}