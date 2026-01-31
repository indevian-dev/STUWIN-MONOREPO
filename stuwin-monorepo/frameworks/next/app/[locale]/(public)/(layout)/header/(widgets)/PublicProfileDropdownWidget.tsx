
'use client'

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo
} from 'react';
import { useParams } from 'next/navigation';
import {
    Link,
    useRouter
} from '@/i18n/routing';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import {
    PiUserCircleLight,
    PiCaretDownLight,
    PiSignOutLight,
    PiUserLight,
    PiStorefrontLight,
    PiSignInLight,
    PiUserPlusLight
} from "react-icons/pi";
import AuthLogoutButtonWidget from '@/app/[locale]/auth/logout/AuthLogoutButtonWidget';

interface DropdownPosition {
    top?: number;
    right: number;
    bottom?: number;
}

function PublicProfileDropdownWidget() {
    const {
        userId,
        firstName,
        lastName,
        isAuthenticated,
        loading: contextLoading,
        getInitials
    } = useGlobalAuthProfileContext();

    const workspaces: any[] = [];

    const router = useRouter();
    const params = useParams() as { tenantKey?: string };
    const currentWorkspaceId = params.tenantKey;

    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, right: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'User';

    // Check if mobile screen
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Calculate dropdown position when opened
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const viewportHeight = window.innerHeight;

            if (isMobile) {
                const bottomPosition = viewportHeight - rect.top + 8;
                setDropdownPosition({
                    bottom: bottomPosition,
                    right: window.innerWidth - rect.right,
                    top: undefined
                });
            } else {
                const topPosition = rect.bottom + scrollY + 8;
                setDropdownPosition({
                    top: topPosition,
                    right: window.innerWidth - rect.right,
                    bottom: undefined
                });
            }
        }
    }, [isOpen, isMobile]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleDropdownClick = useCallback(() => {
        setIsOpen(!isOpen);
    }, [isOpen]);

    const handleAccountSwitch = (workspace: any) => {
        if (workspace.id === currentWorkspaceId) {
            setIsOpen(false);
            return;
        }

        ConsoleLogger.log('🔄 Switching to workspace:', workspace.id, workspace.type);

        const type = workspace.type || 'personal';
        const targetUrl = `/workspaces/${type}/${workspace.id}`;

        router.push(targetUrl);
        setIsOpen(false);
    };

    const alternativeWorkspaces = useMemo(() => {
        return workspaces.filter(ws => ws.id !== currentWorkspaceId);
    }, [workspaces, currentWorkspaceId]);

    const dropdownStyle = useMemo(() => ({
        position: 'fixed' as const,
        ...(isMobile
            ? { bottom: `${dropdownPosition.bottom}px` }
            : { top: `${dropdownPosition.top}px` }
        ),
        right: `${dropdownPosition.right}px`,
        width: isMobile ? '256px' : '288px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        zIndex: 9999999,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxHeight: isMobile ? '60vh' : '80vh',
        overflowY: 'auto' as const
    }), [isMobile, dropdownPosition]);

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={handleDropdownClick}
                className="flex items-center gap-2 p-2 hover:bg-brand rounded-md transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs border border-white/20">
                    {getInitials(fullName)}
                </div>
                <PiCaretDownLight className={`text-white text-lg transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    ref={dropdownRef}
                    className={`sticky bg-white border border-gray-200 rounded-lg shadow-xl z-50 ${isMobile ? 'w-64' : 'w-72'}`}
                    style={dropdownStyle}
                >
                    {contextLoading && workspaces.length === 0 && (
                        <div className="p-4 text-center">
                            <p className="text-sm text-gray-500">Loading...</p>
                        </div>
                    )}

                    {isAuthenticated && (
                        <>
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-bold text-lg border border-brand/20">
                                        {getInitials(fullName)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate text-sm">
                                            {fullName}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            User ID: {userId}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {alternativeWorkspaces.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Switch Workspace
                                        </p>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {alternativeWorkspaces.map((workspace) => (
                                            <button
                                                key={workspace.id}
                                                onClick={() => handleAccountSwitch(workspace)}
                                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs border border-gray-200">
                                                    {getInitials(workspace.title || workspace.displayName || 'W')}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate text-sm">
                                                        {workspace.title || workspace.displayName || 'Workspace'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate italic">
                                                        {workspace.type}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-gray-100">
                                <Link
                                    href="/workspaces/student/me"
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left text-sm"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <PiUserLight className="text-gray-500 text-lg flex-shrink-0" />
                                    <span className="text-gray-700">Profile Settings</span>
                                </Link>
                                <AuthLogoutButtonWidget />
                            </div>
                        </>
                    )}

                    {!isAuthenticated && !contextLoading && (
                        <div className="p-4">
                            <p className="text-sm text-gray-600 mb-4 text-center">
                                Sign in to access your account
                            </p>
                            <div className="space-y-2">
                                <Link
                                    href="/auth/login"
                                    className="w-full px-4 py-3 flex items-center justify-center gap-3 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors text-sm font-medium"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <PiSignInLight className="text-lg flex-shrink-0" />
                                    <span>Sign In</span>
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="w-full px-4 py-3 flex items-center justify-center gap-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <PiUserPlusLight className="text-lg flex-shrink-0" />
                                    <span>Sign Up</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default PublicProfileDropdownWidget;