'use client';

import React, { useState, ReactNode } from 'react';
import {
    PiHouseLine,
    PiStackLight,
    PiMagnifyingGlassLight,
    PiCrownBold
} from 'react-icons/pi';
import { LuUser } from 'react-icons/lu';

// Layout Components
import { GlobalHeaderWidget } from '@/app/[locale]/(global)/(widgets)/GlobalHeaderWidget';
import { GlobalFastNavigationWidget } from '@/app/[locale]/(global)/(widgets)/GlobalFastNavigationWidget';
import { GlobalFullNavigationWidget } from '@/app/[locale]/(global)/(widgets)/GlobalFullNavigationWidget';
import type { DomainNavConfig } from '@/types';

interface WorkspaceRootLayoutClientProps {
    children: ReactNode;
}

export function WorkspaceRootLayoutClient({ children }: WorkspaceRootLayoutClientProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navConfig: DomainNavConfig = {
        domain: 'workspaces',
        logoSrc: '/logo.svg',
        label: 'stuwin.ai',
        subtitle: 'Workspace Selection',
        fastNavLinks: [],
        menuGroups: {
            main: {
                label: 'main',
                items: [
                    { href: '/', icon: PiHouseLine, label: 'return_home' },
                    { href: '/workspaces', icon: PiStackLight, label: 'my_workspaces' },
                    { href: '/workspaces/billing', icon: PiCrownBold, label: 'billing' },
                    { href: '/workspaces/profile', icon: LuUser, label: 'profile' }
                ]
            },
            discover: {
                label: 'discover',
                items: [
                    { href: '/workspaces/discover', icon: PiMagnifyingGlassLight, label: 'find_organizations' }
                ]
            }
        },
        menuDisplayMode: {
            desktop: 'sidebar',
            mobile: 'mobile-modal'
        }
    };

    return (
        <>
            <GlobalHeaderWidget
                config={navConfig}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
            >
                <GlobalFastNavigationWidget
                    config={navConfig}
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                />
            </GlobalHeaderWidget>

            <main className="layout-main-grid">
                <nav className="relative col-span-5 md:col-span-1 rounded">
                    <GlobalFullNavigationWidget
                        config={navConfig}
                        isMenuOpen={isMenuOpen}
                        setIsMenuOpen={setIsMenuOpen}
                    />
                </nav>

                <div className="col-span-5 lg:col-span-4 rounded flex flex-col min-h-screen">
                    {children}
                </div>
            </main>
        </>
    );
}
