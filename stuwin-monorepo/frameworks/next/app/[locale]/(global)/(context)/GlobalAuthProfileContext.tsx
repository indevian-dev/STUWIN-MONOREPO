
"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode
} from 'react';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import type { AuthContextPayload } from '@/types/auth/authContext';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';

// Extend Window interface for global auth context update
declare global {
    interface Window {
        __updateAuthContext?: (payload: AuthContextPayload) => void;
    }
}

// Type definitions

export interface Workspace {
    id: string;
    type: string;
    title: string;
    displayName?: string;
}

interface GlobalAuthProfileContextType {
    userId: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    subscriptionType: string | null;
    subscribedUntil: string | null;
    isLoading: boolean;
    loading: boolean; // Alias for backward compatibility
    error: any;
    getInitials: (name?: string) => string;
    clearProfile: () => void;
    refreshProfile: () => Promise<void>;
    isReady: boolean;
    isAuthenticated: boolean;
    subscriptions: ActiveSubscription[];
    getEffectiveSubscription: (workspaceId: string, workspaceType: string) => { type: string; until: Date | null; source: 'WORKSPACE' | 'WORKSPACE_TYPE' | 'NONE' } | null;
}

export interface ActiveSubscription {
    id: string;
    workspaceId: string;
    planType: string;
    startsAt: string; // ISO date string from JSON
    endsAt: string | null;
    status: string;
}

const GlobalAuthProfileContext = createContext<GlobalAuthProfileContextType | null>(null);

interface GlobalAuthProfileProviderProps {
    children: ReactNode;
}

export function GlobalAuthProfileProvider({ children }: GlobalAuthProfileProviderProps) {
    // Try to load initial state from localStorage synchronously
    const [userId, setUserId] = useState<string | null>(null);
    const [firstName, setFirstName] = useState<string | null>(null);
    const [lastName, setLastName] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [phone, setPhone] = useState<string | null>(null);
    const [emailVerified, setEmailVerified] = useState<boolean>(false);
    const [phoneVerified, setPhoneVerified] = useState<boolean>(false);
    const [subscriptionType, setSubscriptionType] = useState<string | null>(null);
    const [subscribedUntil, setSubscribedUntil] = useState<string | null>(null);
    const [subscriptions, setSubscriptions] = useState<ActiveSubscription[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const getInitialState = () => {
            if (typeof window === 'undefined') return null;
            try {
                const saved = localStorage.getItem('stuwin.ai_profile');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // Only use if less than 60 minutes old for initial snap
                    if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
                        ConsoleLogger.log('🔄 Loading initial state from localStorage');
                        return parsed;
                    }
                }
            } catch (e) {
                ConsoleLogger.warn('Failed to load initial state from localStorage:', e);
            }
            return null;
        };

        const initialState = getInitialState();
        if (initialState) {
            setUserId(initialState.userId);
            setFirstName(initialState.firstName);
            setLastName(initialState.lastName);
            setEmail(initialState.email);
            setPhone(initialState.phone);
            setEmailVerified(initialState.emailVerified || false);
            setPhoneVerified(initialState.phoneVerified || false);
            setSubscriptionType(initialState.subscriptionType || null);
            setSubscribedUntil(initialState.subscribedUntil || null);
            setSubscriptions(initialState.subscriptions || []);
        }
    }, []);

    const clearProfile = useCallback(() => {
        setUserId(null);
        setFirstName(null);
        setLastName(null);
        setEmail(null);
        setPhone(null);
        setEmailVerified(false);
        setPhoneVerified(false);
        setSubscriptionType(null);
        setSubscribedUntil(null);
        setSubscriptions([]);
        localStorage.removeItem('stuwin.ai_profile');
    }, []);

    // Create a ref to always have the latest state values without triggering dependency updates
    const stateRef = React.useRef({ userId, firstName, lastName, email, phone, subscriptionType, subscribedUntil, subscriptions });
    useEffect(() => {
        stateRef.current = { userId, firstName, lastName, email, phone, subscriptionType, subscribedUntil, subscriptions };
    }, [userId, firstName, lastName, email, phone, subscriptionType, subscribedUntil, subscriptions]);

    const updateFromAuthPayload = useCallback((payload: AuthContextPayload) => {
        try {
            ConsoleLogger.log('🔄 ========== UPDATING AUTH CONTEXT (MINIMAL) ==========');

            if (payload.action === 'logout') {
                clearProfile();
                return;
            }

            const newUserId = payload.user?.id || null;
            const newFirstName = payload.user?.firstName || null;
            const newLastName = payload.user?.lastName || null;
            const newEmail = payload.user?.email || null;
            const newPhone = payload.user?.phone || null;
            const newEmailVerified = payload.user?.emailVerified || false;
            const newPhoneVerified = payload.user?.phoneVerified || false;
            const newSubscribedUntil = (payload.account as any)?.subscribedUntil || (payload.account as any)?.workspaceSubscribedUntil || null;
            const newSubscriptionType = (payload.account as any)?.subscriptionType || (payload.account as any)?.workspaceSubscriptionType || null;
            const newSubscriptions = (payload as any).subscriptions || [];

            if (newUserId) setUserId(newUserId);
            if (newFirstName) setFirstName(newFirstName);
            if (newLastName) setLastName(newLastName);
            if (newEmail) setEmail(newEmail);
            if (newPhone) setPhone(newPhone);
            setEmailVerified(newEmailVerified);
            setPhoneVerified(newPhoneVerified);
            setSubscribedUntil(newSubscribedUntil);
            setSubscriptionType(newSubscriptionType);
            setSubscriptions(newSubscriptions);

            // Update localStorage using latest values (fallback to current state if payload missing field)
            const dataToStore = {
                userId: newUserId || stateRef.current.userId,
                firstName: newFirstName || stateRef.current.firstName,
                lastName: newLastName || stateRef.current.lastName,
                email: newEmail || stateRef.current.email,
                phone: newPhone || stateRef.current.phone,
                emailVerified: newEmailVerified,
                phoneVerified: newPhoneVerified,
                subscriptionType: newSubscriptionType || stateRef.current.subscriptionType,
                subscribedUntil: newSubscribedUntil || stateRef.current.subscribedUntil,
                subscriptions: newSubscriptions.length > 0 ? newSubscriptions : stateRef.current.subscriptions,
                timestamp: Date.now()
            };
            localStorage.setItem('stuwin.ai_profile', JSON.stringify(dataToStore));

            setLoading(false);
            setError(null);
        } catch (error) {
            ConsoleLogger.error('❌ AUTH CONTEXT UPDATE FAILED', error);
            setError('Failed to update auth context');
        }
    }, [clearProfile]); // Removed state dependencies

    const loadProfileData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiCallForSpaHelper({
                method: 'GET',
                url: '/api/auth'
            });

            if (response.data) {
                updateFromAuthPayload({
                    action: 'initial',
                    ...response.data
                });
            }
        } catch (error) {
            ConsoleLogger.error('Error loading profile data:', error);
            setError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    }, [updateFromAuthPayload]);

    // Initial load - run only once on mount
    useEffect(() => {
        loadProfileData();
    }, []); // Explicitly empty dependency array to break loop

    // Set up window global for sync
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.__updateAuthContext = updateFromAuthPayload;
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete window.__updateAuthContext;
            }
        };
    }, [updateFromAuthPayload]);

    const getInitials = (name?: string): string => {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const getEffectiveSubscription = useCallback((workspaceId: string, workspaceType: string) => {
        const now = new Date();

        // Check if there is an active subscription for this workspace
        const workspaceSub = subscriptions.find(s =>
            s.workspaceId === workspaceId &&
            s.status === 'active' &&
            (!s.endsAt || new Date(s.endsAt) > now)
        );

        if (workspaceSub) {
            return {
                type: workspaceSub.planType,
                until: workspaceSub.endsAt ? new Date(workspaceSub.endsAt) : null,
                source: 'WORKSPACE' as const
            };
        }

        return null;
    }, [subscriptions]);

    const value = {
        userId,
        firstName,
        lastName,
        email,
        phone,
        emailVerified,
        phoneVerified,
        subscriptionType,
        subscribedUntil,
        subscriptions,
        loading,
        isLoading: loading, // Alias for consistency
        error,
        getInitials,
        clearProfile,
        refreshProfile: loadProfileData,
        isReady: !loading,
        isAuthenticated: !!userId,
        getEffectiveSubscription
    };

    return (
        <GlobalAuthProfileContext.Provider value={value}>
            {children}
        </GlobalAuthProfileContext.Provider>
    );
}

export function useGlobalAuthProfileContext(): GlobalAuthProfileContextType {
    const context = useContext(GlobalAuthProfileContext);
    if (!context) {
        throw new Error('useGlobalAuthProfileContext must be used within an GlobalAuthProfileProvider');
    }
    return context;
}
