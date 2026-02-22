"use client";

import { ConsoleLogger } from '@/lib/logging/Console.logger';

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    ReactNode
} from 'react';

interface GlobalTwoFactorAuthContextType {
    isModalOpen: boolean;
    isLoading: boolean;
    selectedMethod: string;
    isMethodForced: boolean;
    otpCode: string;
    setOtpCode: (code: string) => void;
    error: string;
    showTwoFactorModal: (requiredMethod?: string, forced?: boolean) => void;
    hideTwoFactorModal: () => void;
    sendOtp: (method: string) => Promise<{ success: boolean; rateLimited?: boolean; nextAvailableIn?: number; message?: string }>;
    verifyOtp: () => Promise<{ success: boolean }>;
}

const GlobalTwoFactorAuthContext = createContext<GlobalTwoFactorAuthContextType | null>(null);

export function GlobalTwoFactorAuthProvider({ children }: { children: ReactNode }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('email'); // 'email' or 'phone'
    const [isMethodForced, setIsMethodForced] = useState(false); // true when method is required by API (no choice)
    const [otpCode, setOtpCode] = useState('');
    const [error, setError] = useState('');

    // Function to show the 2FA modal (no request queuing - user will manually retry)
    const showTwoFactorModal = useCallback((requiredMethod = 'email', forced = true) => {
        setSelectedMethod(requiredMethod); // Set the method based on API response
        setIsMethodForced(forced); // Lock method when forced by API (428/429)
        setIsModalOpen(true);
        setError('');
        setOtpCode('');
    }, []);


    // Function to hide the modal and clear state
    const hideTwoFactorModal = useCallback(() => {
        setIsModalOpen(false);
        setError('');
        setOtpCode('');
        setSelectedMethod('email');
        setIsMethodForced(false);
    }, []);

    // Function to send OTP via selected method
    const sendOtp = useCallback(async (method: string) => {
        setIsLoading(true);
        setError('');

        try {
            // Use direct fetch to avoid 428/429 handling interference
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            const fetchResponse = await fetch(`${baseUrl}/api/auth/2fa/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies
                body: JSON.stringify({ method })
            });

            const response = {
                status: fetchResponse.status,
                data: await fetchResponse.json().catch(() => ({}))
            };

            if (response && response.status === 200) {
                setSelectedMethod(method);
                return { success: true };
            } else if (response && response.status === 429) {
                // OTP already sent - show input fields with rate limit info
                setSelectedMethod(method);
                const errorMessage = response?.data?.error || 'OTP already sent recently';
                const nextAvailableIn = response?.data?.nextAvailableIn || 0;
                setError(errorMessage);
                return {
                    success: false,
                    rateLimited: true,
                    nextAvailableIn,
                    message: errorMessage
                };
            } else {
                const errorMessage = response?.data?.error || response?.data?.message || 'Failed to send OTP';
                ConsoleLogger.error('OTP send failed:', errorMessage);
                setError(errorMessage);
                return { success: false };
            }
        } catch (error: any) {
            ConsoleLogger.error('Error sending OTP:', error);
            setError(error.message || 'Failed to send OTP. Please try again.');
            return { success: false };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Function to verify OTP (no automatic retry - user must manually retry their action)
    const verifyOtp = useCallback(async () => {
        if (!otpCode.trim()) {
            setError('Please enter the OTP code');
            return { success: false };
        }

        setIsLoading(true);
        setError('');

        try {
            // Use direct fetch to avoid 428/429 handling interference
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            const fetchResponse = await fetch(`${baseUrl}/api/auth/2fa/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies
                body: JSON.stringify({
                    code: otpCode,
                    method: selectedMethod
                })
            });

            const response = {
                status: fetchResponse.status,
                data: await fetchResponse.json().catch(() => ({}))
            };

            if (response.status === 200) {
                // OTP verified successfully - close modal (user must manually retry their action)
                hideTwoFactorModal();
                return { success: true };
            } else {
                setError(response.data?.error || 'Invalid OTP code');
                return { success: false };
            }
        } catch (error: any) {
            ConsoleLogger.error('Error verifying OTP:', error);
            setError('Failed to verify OTP. Please try again.');
            return { success: false };
        } finally {
            setIsLoading(false);
        }
    }, [otpCode, selectedMethod, hideTwoFactorModal]);

    // Listen for 2FA required events from API helper
    useEffect(() => {
        const handleTwoFactorRequired = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { requiredMethod = 'email' } = customEvent.detail || {};
            showTwoFactorModal(requiredMethod);
        };

        // Add event listener for 2FA required events
        if (typeof window !== 'undefined') {
            window.addEventListener('2fa-required', handleTwoFactorRequired);

            return () => {
                window.removeEventListener('2fa-required', handleTwoFactorRequired);
            };
        }
    }, [showTwoFactorModal]);

    const contextValue: GlobalTwoFactorAuthContextType = {
        isModalOpen,
        isLoading,
        selectedMethod,
        isMethodForced,
        otpCode,
        setOtpCode,
        error,
        showTwoFactorModal,
        hideTwoFactorModal,
        sendOtp,
        verifyOtp
    };

    return (
        <GlobalTwoFactorAuthContext.Provider value={contextValue}>
            {children}
        </GlobalTwoFactorAuthContext.Provider>
    );
}

export function useGlobalTwoFactorAuthContext() {
    const context = useContext(GlobalTwoFactorAuthContext);
    if (!context) {
        throw new Error('useGlobalTwoFactorAuthContext must be used within a GlobalTwoFactorAuthProvider');
    }
    return context;
}
