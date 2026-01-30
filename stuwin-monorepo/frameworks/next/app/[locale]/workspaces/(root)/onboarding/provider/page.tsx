"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiCallForSpaHelper } from "@/lib/helpers/apiCallForSpaHelper";
import { PiBuildings, PiArrowLeft, PiArrowRight, PiCheckCircle } from "react-icons/pi";
import { toast } from "react-toastify";

export default function ProviderOnboardingPage() {
    const router = useRouter();
    const t = useTranslations('ProviderOnboardingPage');
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: "",
        address: "",
        regNumber: "",
        contactPhone: "",
        website: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.address) {
            toast.warn(t('fill_fields_warn'));
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await apiCallForSpaHelper({
                url: "/api/workspaces/onboarding",
                method: "POST",
                body: {
                    type: "provider",
                    data: {
                        title: formData.title,
                        orgDetails: formData
                    }
                }
            } as any);

            const result = (response as any).data;
            if (result.success) {
                setStep(3);
            } else {
                toast.error(result.error || t('application_failed'));
            }
        } catch (error) {
            toast.error(t('failed_submit'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 3) {
        return (
            <div className="min-h-screen bg-neutral-50 p-6 flex flex-col items-center justify-center bg-section-gradient-brand">
                <div className="max-w-2xl w-full bg-white rounded-[3rem] p-16 text-center shadow-2xl animate-in zoom-in-95 duration-700">
                    <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8">
                        <PiCheckCircle />
                    </div>
                    <h1 className="text-4xl font-black text-dark mb-4 tracking-tight">{t('application_submitted')}</h1>
                    <p className="text-body font-medium text-lg leading-relaxed mb-10 opacity-70">
                        {t('review_message')}
                    </p>
                    <button
                        onClick={() => router.push("/workspaces")}
                        className="px-12 py-5 bg-dark text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all text-lg shadow-xl shadow-dark/20"
                    >
                        {t('back_to_home')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-6 flex flex-col items-center justify-center bg-section-gradient-brand">
            <div className="max-w-2xl w-full bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl space-y-12">
                <button
                    onClick={() => router.push("/workspaces/onboarding/welcome")}
                    className="flex items-center gap-2 text-neutral-400 hover:text-dark transition font-black uppercase tracking-widest text-xs"
                >
                    <PiArrowLeft /> {t('back')}
                </button>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-dark tracking-tight leading-none">
                        {t('register_as')} <span className="text-blue-600">{t('provider')}</span>
                    </h1>
                    <p className="text-body font-medium">
                        {t('provider_message')}
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-2">{t('org_name')}</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full h-16 px-6 bg-neutral-50 rounded-2xl border-2 border-border focus:border-blue-500 outline-none font-bold"
                                placeholder={t('org_name_placeholder')}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-2">{t('address')}</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="w-full h-16 px-6 bg-neutral-50 rounded-2xl border-2 border-border focus:border-blue-500 outline-none font-bold"
                                placeholder={t('address_placeholder')}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-2">{t('reg_number')}</label>
                                <input
                                    type="text"
                                    name="regNumber"
                                    value={formData.regNumber}
                                    onChange={handleInputChange}
                                    className="w-full h-16 px-6 bg-neutral-50 rounded-2xl border-2 border-border focus:border-blue-500 outline-none font-bold"
                                    placeholder={t('reg_number_placeholder')}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-2">{t('phone')}</label>
                                <input
                                    type="text"
                                    name="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={handleInputChange}
                                    className="w-full h-16 px-6 bg-neutral-50 rounded-2xl border-2 border-border focus:border-blue-500 outline-none font-bold"
                                    placeholder={t('phone_placeholder')}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full h-20 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20"
                    >
                        {isSubmitting ? t('submitting') : t('submit_for_approval')}
                        <PiArrowRight />
                    </button>
                </div>
            </div>
        </div>
    );
}
