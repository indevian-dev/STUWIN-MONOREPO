
"use client";

import { useRouter } from "next/navigation";
import { PiXCircleBold, PiArrowLeftBold, PiWarningBold } from "react-icons/pi";
import { useTranslations } from "next-intl";

export default function PaymentErrorPage() {
    const router = useRouter();
    const t = useTranslations('EnrollmentPage');

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6">
            <div className="max-w-md w-full bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl shadow-dark/5 border border-slate-100 text-center space-y-8">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center text-5xl mx-auto">
                    <PiXCircleBold />
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-dark tracking-tight">Payment Failed</h2>
                    <p className="text-neutral-500 font-medium leading-relaxed">
                        Something went wrong during the checkout process. No funds were charged from your account.
                    </p>
                </div>

                <div className="p-6 bg-orange-50 rounded-2xl border-2 border-orange-100 flex gap-4 text-left">
                    <PiWarningBold className="text-orange-500 text-2xl shrink-0" />
                    <div>
                        <h4 className="font-black text-orange-700 text-sm">Common reasons:</h4>
                        <ul className="text-xs font-bold text-orange-600/80 mt-1 list-disc ml-4 space-y-1">
                            <li>Insufficient funds on card</li>
                            <li>Incorrect card details entered</li>
                            <li>Connection timeout with bank</li>
                        </ul>
                    </div>
                </div>

                <div className="pt-4 space-y-3">
                    <button
                        onClick={() => router.back()}
                        className="w-full h-16 bg-dark text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <PiArrowLeftBold />
                        Try Again
                    </button>
                    <button
                        onClick={() => router.push("/workspaces")}
                        className="w-full h-16 bg-white text-dark font-black rounded-2xl border-2 border-slate-100 hover:bg-neutral-50 transition-all"
                    >
                        Cancel & Return
                    </button>
                </div>
            </div>

            <p className="mt-8 text-neutral-400 font-bold text-xs uppercase tracking-widest">
                Need help? Contact support@stuwin.ai
            </p>
        </div>
    );
}
