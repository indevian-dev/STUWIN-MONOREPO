
'use client'

import React, {
    useState,
    useRef
} from 'react';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import Image from 'next/image';
import { PiSignInLight } from "react-icons/pi";

interface GlobalProfileAvatarTileProps {
    variant?: 'dark' | 'light';
}

export function GlobalProfileAvatarTile({ variant = 'dark' }: GlobalProfileAvatarTileProps) {
    const { userId, firstName, lastName, loading, getInitials } = useGlobalAuthProfileContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imageError, setImageError] = useState(false);
    const avatarRef = useRef<HTMLButtonElement>(null);

    const avatarUrl = userId ? `${process.env.NEXT_PUBLIC_S3_PREFIX}${userId}/avatar/avatar.webp` : null;

    // Color classes based on variant
    const colorClasses = variant === 'light'
        ? {
            bg: 'bg-app-bright-green-dark hover:bg-app-bright-green-dark/80',
            text: 'text-app-dark-blue',
            border: 'border-gray-200'
        }
        : {
            bg: 'bg-app-bright-green hover:bg-app-bright-green-dark',
            text: 'text-app-dark-blue',
            border: 'border-app-secondary'
        };

    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'User';

    // Show loading state
    if (loading) {
        return (
            <div className="w-8 h-8 rounded-app-full bg-gray-300 animate-pulse flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-400 rounded-app-full"></div>
            </div>
        );
    }

    const isAuthenticated = !!userId;

    // Unauthenticated state - show login icon
    if (!isAuthenticated) {
        return (
            <>
                <button
                    ref={avatarRef}
                    onClick={() => setIsModalOpen(true)}
                    className={`flex items-center justify-center w-8 h-8 rounded-app-full ${colorClasses.bg} transition-colors`}
                >
                    <PiSignInLight className={`${colorClasses.text} text-xl`} />
                </button>
            </>
        );
    }

    // Authenticated state - show image if available, else initials
    return (
        <>
            <button
                ref={avatarRef}
                onClick={() => setIsModalOpen(true)}
                key={userId || 'no-profile'} // Force re-render on user change
                className={`flex items-center justify-center w-8 h-8 rounded-app-full ${colorClasses.bg} transition-colors overflow-hidden border-2 ${colorClasses.border} relative`}
            >
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
                    <span className={`${colorClasses.text} text-xs font-semibold select-none`}>
                        {getInitials(fullName)}
                    </span>
                )}
            </button>
        </>
    );
}
