
"use client";

import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
import {
    useState,
    useEffect,
    useRef
} from 'react';
import {
    useRouter,
    useSearchParams
} from 'next/navigation';
import { toast } from 'react-toastify';
import { apiCall } from '@/lib/utils/http/SpaApiClient';
import { Link } from '@/i18n/routing';
import { GlobalLogoTile } from '@/app/[locale]/(global)/(tiles)/GlobalLogoTile';
import Image from 'next/image';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { loadClientSideCoLocatedTranslations } from '@/i18n/i18nClientSide';

/**
 * Unified Verification Widget
 * 
 * Handles both email and phone verification with OTP codes.
 */
interface AuthVerificationWidgetProps {
    type: 'email' | 'phone';
    redirectPath?: string;
    backPath?: string;
    onSuccess?: () => void;
    onBack?: () => void;
    showLogo?: boolean;
    showBackLink?: boolean;
    title?: string;
}

export function AuthVerificationWidget({
    type,
    redirectPath = '/workspaces',
    backPath = '/auth/register',
    onSuccess,
    onBack,
    showLogo = true,
    showBackLink = true,
    title
}: AuthVerificationWidgetProps) {
    const { t } = loadClientSideCoLocatedTranslations('AuthVerificationWidget');
    const router = useRouter();
    const searchParams = useSearchParams();
    const {
        // updateFromAuthPayload, // Removed
        refreshProfile,
        isReady,
        loading,
        email: userEmail,
        emailVerified,
        phone: userPhone,
        phoneVerified
    } = useGlobalAuthProfileContext();

    // Get redirect parameter from URL
    const redirectFromQuery = searchParams.get('redirect') || redirectPath;

    // Initialize state
    const [targetState, setTargetState] = useState('');
    const [otp, setOtp] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [hasCodeBeenSent, setHasCodeBeenSent] = useState(false);
    const hasVerifiedRef = useRef(false); // prevent redirect loop after verification

    const isEmail = type === 'email';
    const currentTargetValue = isEmail ? userEmail : userPhone;
    const isTargetVerified = isEmail ? emailVerified : phoneVerified;

    // Sync target value from auth context or URL params (runs once on mount per type, since key={type} remounts)
    useEffect(() => {
        if (targetState) return; // already set, don't overwrite
        // Priority: auth context value → URL query param
        if (currentTargetValue) {
            setTargetState(currentTargetValue);
        } else {
            const fromUrl = searchParams.get(type);
            if (fromUrl) setTargetState(fromUrl);
        }
    }, [currentTargetValue, isReady]);

    // Debug logging
    useEffect(() => {
        ConsoleLogger.log(`✨ UNIFIED ${type.toUpperCase()} VERIFICATION WIDGET STATE:`, {
            type,
            currentTargetValue,
            targetState,
            isReady,
            loading,
            isTargetVerified
        });
    }, [type, currentTargetValue, targetState, isReady, loading, isTargetVerified]);

    // Dynamic texts based on type
    const texts = {
        title: title || t(`title_${type}`),
        description: t(`description_${type}`),
        label: t(type),
        sendButton: t('send_button'),
        resendButton: t('resend_button'),
        verifyButton: t(`verify_button_${type}`),
        backText: t('back_text'),
        successMessage: t(`success_message_${type}`),
        sendingMessage: t('sending_message'),
        verifyingMessage: t('verifying_message')
    };

    function isValidTarget(value: string) {
        if (isEmail) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        } else {
            const digits = value.replace(/\D/g, '');
            return digits.length >= 7 && digits.length <= 15;
        }
    }

    async function handleSendCode() {
        try {
            if (!targetState || !isValidTarget(targetState)) {
                toast.error(t(`enter_valid_${type}`));
                return;
            }

            setIsSending(true);

            const response = await apiCall<any>({
                url: `/api/auth/verify?type=${type}&target=${encodeURIComponent(targetState.trim())}`,
                method: 'GET'
            });

            const result = await response;

            if (result.error) {
                toast.error(result.message || result.error || t('error_sending_code'));
                return;
            }

            if (result.alreadyVerified) {
                toast.info(result.message || t(`already_verified_${type}`));
                router.push('/workspaces/profile');
            } else {
                toast.success(result.message || t('code_sent'));
                if (result.devCode) toast.info(`Dev code: ${result.devCode}`);
            }

            setHasCodeBeenSent(true);
        } catch (err) {
            const error = err as { message?: string };
            toast.error(error?.message || t('failed_to_send'));
        } finally {
            setIsSending(false);
        }
    }

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        try {
            if (!otp || otp.length < 4) {
                toast.error(t('enter_verification_code'));
                return;
            }

            if (!targetState || !isValidTarget(targetState)) {
                toast.error(t(`enter_valid_${type}`));
                return;
            }

            setIsVerifying(true);

            const body = {
                type: type,
                target: targetState.trim(),
                otp
            };

            const response = await apiCall<any>({
                url: '/api/auth/verify',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const result = await response;

            if (result.error) {
                if (result.error === 'Invalid or expired OTP' || result.error === 'Invalid or expired code') {
                    toast.error(t('code_expired'));
                    setOtp('');
                    return;
                }

                toast.error(result.message || result.error || t('verification_error'));
                return;
            }

            toast.success(result.message || texts.successMessage);
            hasVerifiedRef.current = true; // prevent useEffect redirect loop

            await refreshProfile();

            if (onSuccess) {
                onSuccess();
            } else if (isEmail) {
                // After email verified → go to phone verification
                const phoneFromUrl = searchParams.get('phone') || '';
                const phoneParam = phoneFromUrl ? `&phone=${encodeURIComponent(phoneFromUrl)}` : '';
                router.push(`/auth/verify?type=phone${phoneParam}`);
            } else {
                // After phone verified → go to final destination
                router.push(redirectFromQuery);
            }
        } catch (err) {
            const error = err as { message?: string };
            toast.error(error?.message || t('verification_failed'));
        } finally {
            setIsVerifying(false);
        }
    }

    function handleOtpChange(e: React.ChangeEvent<HTMLInputElement>) {
        const numeric = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtp(numeric);
    }

    function handleBackClick() {
        if (onBack) {
            onBack();
        } else {
            router.push(backPath);
        }
    }

    return (
        <div className="w-full flex justify-center items-center min-h-screen px-4">
            <div className="w-full max-w-md">
                <form onSubmit={handleVerify} className="bg-white rounded-primary p-4 sm:p-8 space-y-6">
                    {showLogo && (
                        <Link href="/" className={`inline-flex flex-col ${isEmail ? 'items-start' : 'items-center'} gap-2 text-dark hover:text-brand transition-colors`}>
                            <GlobalLogoTile width={200} height={50} />
                            <span className="text-xs text-body">{t('back_to_home')}</span>
                        </Link>
                    )}

                    <div className={`space-y-2 ${isEmail ? 'text-left' : 'text-center'}`}>
                        <h1 className="text-3xl font-bold text-dark">{texts.title}</h1>
                        <p className="text-sm text-body">
                            {texts.description}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-dark" htmlFor="target">
                                {texts.label}
                            </label>
                            <input
                                id="target"
                                name="target"
                                type={isEmail ? "email" : "tel"}
                                inputMode={isEmail ? "email" : "tel"}
                                className="w-full rounded-lg bg-surface py-3 px-3 text-dark focus:outline-none focus:ring-1 focus:ring-brand-soft"
                                value={targetState}
                                onChange={(e) => setTargetState(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-dark" htmlFor="otp">
                                {t('verification_code')}
                            </label>
                            <input
                                className="w-full rounded-lg bg-white py-3 px-3 text-dark focus:outline-none focus:ring-1 focus:ring-brand-soft text-center text-2xl font-mono tracking-widest transition-all"
                                id="otp"
                                name="otp"
                                type="text"
                                placeholder="000000"
                                value={otp}
                                onChange={handleOtpChange}
                                maxLength={6}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <button
                            className="w-full rounded-primary bg-brand-soft hover:bg-brand/90 text-white font-semibold py-3 px-4 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={isVerifying}
                        >
                            {isVerifying ? texts.verifyingMessage : texts.verifyButton}
                        </button>

                        <button
                            type="button"
                            onClick={handleSendCode}
                            className="w-full rounded-primary bg-surface hover:bg-border text-dark font-semibold py-3 px-4 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSending}
                        >
                            {isSending ? texts.sendingMessage : (hasCodeBeenSent ? texts.resendButton : texts.sendButton)}
                        </button>

                        {showBackLink && (
                            <button
                                type="button"
                                onClick={handleBackClick}
                                className="w-full text-brand hover:text-brand/80 text-sm font-medium py-2 transition"
                            >
                                {texts.backText}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
