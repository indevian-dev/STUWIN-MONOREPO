
"use client";

import React from 'react';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Image from 'next/image';

export function GlobalProfileWidget() {
    const t = useTranslations('GlobalProfileWidget');
    const {
        userId,
        firstName,
        lastName,
        loading,
        getInitials
    } = useGlobalAuthProfileContext();

    const avatarUrl = userId ? `${process.env.NEXT_PUBLIC_S3_PREFIX}${userId}/avatar/avatar.webp` : null;

    const [imageError, setImageError] = React.useState(false);

    if (loading || !userId) {
        return (
            <div className="bg-app-bright-green-light rounded-app p-4 animate-pulse">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-app-full"></div>
                    <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        );
    }

    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || t('fallback_name');

    return (
        <Link
            href="/workspaces"
            className="flex items-center space-x-3 p-4 bg-app-bright-green-light rounded-app hover:bg-white transition-all group mb-4"
        >
            <div className="relative w-12 h-12 rounded-app-full overflow-hidden border-2 border-app/20 shadow-sm transition-transform group-hover:scale-105">
                {avatarUrl && !imageError ? (
                    <Image
                        src={avatarUrl}
                        alt={fullName}
                        fill
                        unoptimized
                        className="object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-app-bright-green text-app-dark-blue flex items-center justify-center font-bold text-lg">
                        {getInitials(fullName)}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-app-dark-blue dark:text-white truncate text-sm group-hover:text-app-bright-green transition-colors">
                    {fullName}
                </h3>
                <p className="text-[10px] text-app-dark-blue dark:text-white/40 truncate uppercase tracking-wider font-medium">
                    {t('view_workspace')}
                </p>
            </div>
        </Link>
    );
}
