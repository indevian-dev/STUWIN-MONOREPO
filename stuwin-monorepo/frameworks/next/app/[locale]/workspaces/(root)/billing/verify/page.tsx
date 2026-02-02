
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";
import { PiCheckCircleBold, PiXCircleBold, PiSpinnerBold, PiLightningBold } from "react-icons/pi";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";

export default function PaymentVerifyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('EnrollmentPage');

    const transactionId = searchParams.get('order_id');
    const [status, setStatus] = useState<'loading' | 'pending' | 'success' | 'error'>('pending');
    const [isVerifying, setIsVerifying] = useState(false);
    const [message, setMessage] = useState("");

    const verifyPayment = async () => {
        if (!transactionId) {
            toast.error("Transaction ID missing");
            return;
        }

        setIsVerifying(true);
        setStatus('loading');
        try {
            const response = await apiCallForSpaHelper({
                url: `/api/workspaces/billing/verify/${transactionId}`,
                method: "POST"
            });

            const result = (response as any).data || response;
            if (result.success) {
                setStatus('success');
                toast.success(t('enrollment_success'));
                setTimeout(() => router.push("/workspaces"), 3000);
            } else {
                setStatus('error');
                setMessage(result.message || "Payment not yet confirmed. Please try again in a moment.");
            }
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || "Verification failed");
        } finally {
            setIsVerifying(false);
        }
    };

    useEffect(() => {
        if (transactionId) {
            // Auto-verify once on load
            verifyPayment();
        }
    }, [transactionId]);

    if (!transactionId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6">
                <PiXCircleBold className="text-red-500 text-6xl mb-4" />
                <h1 className="text-2xl font-black text-dark mb-2">Invalid Access</h1>
                <p className="text-neutral-500 mb-6 text-center">We couldn't find a transaction ID to verify. Please contact support if you have already paid.</p>
                <button onClick={() => router.push("/workspaces")} className="px-8 py-3 bg-dark text-white rounded-2xl font-bold">Go to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6">
            <div className="max-w-md w-full bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl shadow-dark/5 border border-slate-100 text-center space-y-8">
                {status === 'loading' && (
                    <div className="space-y-6 animate-pulse">
                        <div className="w-20 h-20 bg-teal-50 text-teal-500 rounded-3xl flex items-center justify-center text-4xl mx-auto">
                            <PiSpinnerBold className="animate-spin" />
                        </div>
                        <h2 className="text-2xl font-black text-dark">Verifying Payment...</h2>
                        <p className="text-neutral-400 font-medium italic">Communicating with Epoint.az</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6 animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center text-5xl mx-auto">
                            <PiCheckCircleBold />
                        </div>
                        <h2 className="text-2xl font-black text-dark">{t('enrollment_success')}</h2>
                        <p className="text-neutral-500 font-medium">Your subscription is now active. Redirecting you to your dashboard...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center text-4xl mx-auto">
                            <PiLightningBold />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-dark">Almost there!</h2>
                            <p className="text-neutral-500 font-medium text-sm leading-relaxed">{message}</p>
                        </div>
                        <div className="pt-4 space-y-3">
                            <button
                                onClick={verifyPayment}
                                disabled={isVerifying}
                                className="w-full h-16 bg-dark text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isVerifying ? <PiSpinnerBold className="animate-spin" /> : <PiCheckCircleBold />}
                                Check Again & Activate
                            </button>
                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                                Transaction ID: {transactionId}
                            </p>
                        </div>
                    </div>
                )}

                {status === 'pending' && !isVerifying && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center text-4xl mx-auto">
                            <PiLightningBold />
                        </div>
                        <h2 className="text-2xl font-black text-dark text-balance">Verify Your Enrollment</h2>
                        <button
                            onClick={verifyPayment}
                            className="w-full h-16 bg-dark text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                        >
                            <PiCheckCircleBold />
                            Complete Activation
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
