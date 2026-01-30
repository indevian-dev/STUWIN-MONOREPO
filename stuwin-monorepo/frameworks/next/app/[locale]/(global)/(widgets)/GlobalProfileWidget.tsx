
"use client";

import React from 'react';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { Link } from '@/i18n/routing';
import Image from 'next/image';

export function GlobalProfileWidget() {
    const {
        userId,
        firstName,
        lastName,
        loading,
        avatarUrl,
        getInitials
    } = useGlobalAuthProfileContext();

    if (loading || !userId) {
        return (
            <div className="bg-light rounded-md p-4 animate-pulse">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        );
    }

    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'User';

    return (
        <Link
            href="/workspaces/profile"
            className="flex items-center space-x-3 p-4 bg-light rounded-md hover:bg-white transition-all group mb-4"
        >
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-brand/20 shadow-sm transition-transform group-hover:scale-105">
                {avatarUrl ? (
                    <Image src={avatarUrl} alt={fullName} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full bg-brand text-white flex items-center justify-center font-bold text-lg">
                        {getInitials(fullName)}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-dark truncate text-sm group-hover:text-brand transition-colors">
                    {fullName}
                </h3>
                <p className="text-[10px] text-dark/40 truncate uppercase tracking-wider font-medium">
                    View Profile
                </p>
            </div>
        </Link>
    );
}
