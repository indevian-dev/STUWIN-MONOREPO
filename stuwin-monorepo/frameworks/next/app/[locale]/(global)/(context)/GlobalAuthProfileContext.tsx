
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
    avatarUrl: string | null;
    subscriptionType: string | null;
    subscribedUntil: string | null;
    loading: boolean;
    error: any;
    getInitials: (name?: string) => string;
    clearProfile: () => void;
    // updateFromAuthPayload: (payload: AuthContextPayload) => void; // Removed from public interface
    refreshProfile: () => Promise<void>;
    isReady: boolean;
    isAuthenticated: boolean;
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
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [subscriptionType, setSubscriptionType] = useState<string | null>(null);
    const [subscribedUntil, setSubscribedUntil] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const getInitialState = () => {
            if (typeof window === 'undefined') return null;
            try {
                const saved = localStorage.getItem('shagguide_profile');
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
            setAvatarUrl(initialState.avatarUrl || null);
            setSubscriptionType(initialState.subscriptionType || null);
            setSubscribedUntil(initialState.subscribedUntil || null);
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
        setAvatarUrl(null);
        setSubscriptionType(null);
        setSubscribedUntil(null);
        localStorage.removeItem('shagguide_profile');
    }, []);

    // Create a ref to always have the latest state values without triggering dependency updates
    const stateRef = React.useRef({ userId, firstName, lastName, email, phone, avatarUrl, subscriptionType, subscribedUntil });
    useEffect(() => {
        stateRef.current = { userId, firstName, lastName, email, phone, avatarUrl, subscriptionType, subscribedUntil };
    }, [userId, firstName, lastName, email, phone, avatarUrl, subscriptionType, subscribedUntil]);

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
            const newAvatarUrl = payload.user?.avatarUrl || null;
            const newSubscribedUntil = (payload.account as any)?.subscribedUntil || (payload.account as any)?.workspaceSubscribedUntil || null;
            const newSubscriptionType = (payload.account as any)?.subscriptionType || (payload.account as any)?.workspaceSubscriptionType || null;

            if (newUserId) setUserId(newUserId);
            if (newFirstName) setFirstName(newFirstName);
            if (newLastName) setLastName(newLastName);
            if (newEmail) setEmail(newEmail);
            if (newPhone) setPhone(newPhone);
            setEmailVerified(newEmailVerified);
            setPhoneVerified(newPhoneVerified);
            setAvatarUrl(newAvatarUrl);
            setSubscribedUntil(newSubscribedUntil);
            setSubscriptionType(newSubscriptionType);

            // Update localStorage using latest values (fallback to current state if payload missing field)
            const dataToStore = {
                userId: newUserId || stateRef.current.userId,
                firstName: newFirstName || stateRef.current.firstName,
                lastName: newLastName || stateRef.current.lastName,
                email: newEmail || stateRef.current.email,
                phone: newPhone || stateRef.current.phone,
                emailVerified: newEmailVerified,
                phoneVerified: newPhoneVerified,
                avatarUrl: newAvatarUrl || stateRef.current.avatarUrl,
                subscriptionType: newSubscriptionType || stateRef.current.subscriptionType,
                subscribedUntil: newSubscribedUntil || stateRef.current.subscribedUntil,
                timestamp: Date.now()
            };
            localStorage.setItem('shagguide_profile', JSON.stringify(dataToStore));

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

    const value = {
        userId,
        firstName,
        lastName,
        email,
        phone,
        emailVerified,
        phoneVerified,
        avatarUrl,
        subscriptionType,
        subscribedUntil,
        loading,
        error,
        getInitials,
        clearProfile,
        // updateFromAuthPayload, // Removed from public value
        refreshProfile: loadProfileData,
        isReady: !loading,
        isAuthenticated: !!userId,
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