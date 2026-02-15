"use client";

import { useGlobalTwoFactorAuthContext } from '@/app/[locale]/(global)/(context)/GlobalTwoFactorAuthContext';
import { useEffect, useRef, useState } from 'react';
import { PiShieldCheck, PiEnvelope, PiPhone, PiSpinner, PiWarningCircle, PiX } from 'react-icons/pi';

/**
 * GlobalTwoFactorAuthModal — OTP verification modal.
 * Renders when `isModalOpen` is true in the 2FA context.
 * Automatically sends OTP when opened, then shows 6-digit input.
 */
export function GlobalTwoFactorAuthModal() {
    const {
        isModalOpen,
        isLoading,
        selectedMethod,
        otpCode,
        setOtpCode,
        error,
        hideTwoFactorModal,
        sendOtp,
        verifyOtp,
    } = useGlobalTwoFactorAuthContext();

    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSendOtp = async () => {
        setSendingOtp(true);
        const result = await sendOtp(selectedMethod);
        setSendingOtp(false);
        // Even if rate-limited, show the OTP input (they already have a code)
        if (result.success || result.rateLimited) {
            setOtpSent(true);
        }
    };

    // Auto-send OTP when modal opens
    useEffect(() => {
        if (isModalOpen && !otpSent) {
            handleSendOtp();
        }
        if (!isModalOpen) {
            setOtpSent(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isModalOpen]);

    // Focus input after OTP is sent
    useEffect(() => {
        if (otpSent && inputRef.current) {
            inputRef.current.focus();
        }
    }, [otpSent]);

    const handleVerify = async () => {
        await verifyOtp();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && otpCode.length === 6 && !isLoading) {
            handleVerify();
        }
    };

    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={hideTwoFactorModal}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative px-6 pt-6 pb-4">
                    <button
                        onClick={hideTwoFactorModal}
                        className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <PiX className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <PiShieldCheck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Verification Required
                            </h2>
                            <p className="text-sm text-gray-500">
                                Two-factor authentication
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 pb-6">
                    {!otpSent && sendingOtp ? (
                        /* Sending OTP state */
                        <div className="flex flex-col items-center gap-3 py-8">
                            <PiSpinner className="w-8 h-8 text-blue-500 animate-spin" />
                            <p className="text-sm text-gray-600">
                                Sending verification code to your {selectedMethod}...
                            </p>
                        </div>
                    ) : !otpSent ? (
                        /* Failed to send — retry */
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                                <PiWarningCircle className="w-6 h-6 text-amber-500" />
                            </div>
                            <p className="text-sm text-gray-600 text-center">
                                {error || 'Failed to send verification code'}
                            </p>
                            <button
                                onClick={handleSendOtp}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Retry Send
                            </button>
                        </div>
                    ) : (
                        /* OTP Input */
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                                {selectedMethod === 'email' ? (
                                    <PiEnvelope className="w-4 h-4 text-blue-600 shrink-0" />
                                ) : (
                                    <PiPhone className="w-4 h-4 text-blue-600 shrink-0" />
                                )}
                                <p className="text-sm text-blue-800">
                                    A 6-digit code has been sent to your {selectedMethod}.
                                    Please enter it below.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Verification Code
                                </label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtpCode(val);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="000000"
                                    className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-300"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Error display */}
                            {error && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm">
                                    <PiWarningCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-2">
                                <button
                                    onClick={handleSendOtp}
                                    disabled={sendingOtp || isLoading}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sendingOtp ? 'Sending...' : 'Resend Code'}
                                </button>

                                <button
                                    onClick={handleVerify}
                                    disabled={otpCode.length !== 6 || isLoading}
                                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <PiSpinner className="w-4 h-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <PiShieldCheck className="w-4 h-4" />
                                            Verify
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
