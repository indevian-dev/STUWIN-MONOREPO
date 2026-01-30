
'use client'

import React, {
    useState,
    useRef
} from 'react';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { PiSignInLight } from "react-icons/pi";

interface GlobalProfileAvatarTileProps {
    variant?: 'dark' | 'light';
}

export function GlobalProfileAvatarTile({ variant = 'dark' }: GlobalProfileAvatarTileProps) {
    const { userId, firstName, lastName, loading, getInitials } = useGlobalAuthProfileContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const avatarRef = useRef<HTMLButtonElement>(null);

    // Color classes based on variant
    const colorClasses = variant === 'light'
        ? {
            bg: 'bg-dark hover:bg-dark/80',
            text: 'text-white',
            border: 'border-gray-200'
        }
        : {
            bg: 'bg-brand hover:bg-brand-dark',
            text: 'text-brand-secondary',
            border: 'border-brand-secondary'
        };

    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'User';

    // Show loading state
    if (loading) {
        return (
            <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
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
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${colorClasses.bg} transition-colors`}
                >
                    <PiSignInLight className={`${colorClasses.text} text-xl`} />
                </button>
            </>
        );
    }

    // Authenticated state - show initials avatar
    return (
        <>
            <button
                ref={avatarRef}
                onClick={() => setIsModalOpen(true)}
                key={userId || 'no-profile'} // Force re-render on user change
                className={`flex items-center justify-center w-8 h-8 rounded-full ${colorClasses.bg} transition-colors overflow-hidden border-2 ${colorClasses.border}`}
            >
                <span className={`${colorClasses.text} text-xs font-semibold select-none`}>
                    {getInitials(fullName)}
                </span>
            </button>
        </>
    );
}
