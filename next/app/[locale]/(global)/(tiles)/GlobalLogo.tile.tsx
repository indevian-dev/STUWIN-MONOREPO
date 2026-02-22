import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';

interface GlobalLogoTileProps {
    width?: number;
    height?: number;
    className?: string;
    href?: string;
}

/**
 * GlobalLogoTile
 * Renders the correct logo version based on the current theme:
 *  - Light mode → stuwinlogo.svg  (dark text / colored)
 *  - Dark mode  → stuwinlogowhite.svg (white)
 *
 * Both images are always rendered in the DOM; CSS hides the inactive one.
 * This avoids a flash-of-wrong-logo on hydration.
 */
export function GlobalLogoTile({
    width = 150,
    height = 40,
    className = '',
    href = '/',
}: GlobalLogoTileProps) {
    const shared = `object-contain transition-opacity hover:opacity-90 ${className}`;

    const logos = (
        <>
            {/* Light mode logo */}
            <Image
                src="/stuwinlogo.svg"
                alt="STUWIN.AI"
                width={width}
                height={height}
                className={`block dark:hidden ${shared}`}
                priority
            />
            {/* Dark mode logo */}
            <Image
                src="/stuwinlogowhite.svg"
                alt="STUWIN.AI"
                width={width}
                height={height}
                className={`hidden dark:block ${shared}`}
                priority
            />
        </>
    );

    if (href) {
        return (
            <Link href={href} className="inline-flex transition-opacity hover:opacity-90">
                {logos}
            </Link>
        );
    }

    return <>{logos}</>;
}
