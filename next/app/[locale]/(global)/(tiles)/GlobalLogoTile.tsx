import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';

interface GlobalLogoTileProps {
    width?: number;
    height?: number;
    className?: string;
    href?: string;
    variant?: 'color' | 'white'; // In case we need variants later
}

export function GlobalLogoTile({
    width = 150,
    height = 40,
    className = '',
    href = '/',
    variant = 'color'
}: GlobalLogoTileProps) {
    const logoSrc = '/stuwinlogo.svg';

    const ImageComponent = (
        <Image
            src={logoSrc}
            alt="STUWIN.AI"
            width={width}
            height={height}
            className={`object-contain ${className}`}
            priority
        />
    );

    if (href) {
        return (
            <Link href={href} className="inline-block transition-opacity hover:opacity-90">
                {ImageComponent}
            </Link>
        );
    }

    return ImageComponent;
}
