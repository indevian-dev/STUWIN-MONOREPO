'use client';

import React, { useState, ReactNode } from 'react';
import { Main } from '@/app/primitives/Main.primitive';
import { Container } from '@/app/primitives/Container.primitive';
import {
    PiHouseLine,
    PiStackLight,
    PiMagnifyingGlassLight,
    PiCrownBold,
    PiEnvelope
} from 'react-icons/pi';
import { LuUser } from 'react-icons/lu';

// Layout Components
import { GlobalHeaderWidget } from '@/app/[locale]/(global)/(widgets)/GlobalHeader.widget';
import { GlobalFastNavigationWidget } from '@/app/[locale]/(global)/(widgets)/GlobalFastNavigation.widget';
import { GlobalFullNavigationWidget } from '@/app/[locale]/(global)/(widgets)/GlobalFullNavigation.widget';
import type { DomainNavConfig } from '@stuwin/shared/types/ui/Navigation.types';

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
                    { href: '/workspaces/invitations', icon: PiEnvelope, label: 'invitations' },
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

            <Main variant="app">
                <Container variant="7xl" className="flex items-start h-full max-w-7xl mx-auto gap-4 px-4">
                    <aside className="hidden lg:flex shrink-0 sticky top-[70px] min-h-[calc(100vh-70px)] overflow-hidden w-64 flex-col">
                        <GlobalFullNavigationWidget
                            config={navConfig}
                            isMenuOpen={isMenuOpen}
                            setIsMenuOpen={setIsMenuOpen}
                        />
                    </aside>
                    <div className="flex-1 min-w-0 w-full">
                        {children}
                    </div>
                </Container>
            </Main>
        </>
    );
}
