
"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { PiCheckCircleFill, PiCrownBold, PiArrowsClockwiseBold, PiCheckBold } from 'react-icons/pi';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';

export function SubscriptionManagementClient() {
    const t = useTranslations('StudentBillingPage'); // Reusing translations for now
    const { getEffectiveSubscription, loading: profileLoading } = useGlobalAuthProfileContext();
    const params = useParams();
    const workspaceId = params.workspaceId as string || 'root';

    // Determine effective subscription (Plan A: Workspace Specific, Plan B: Type Wide)
    const effectiveSubscription = getEffectiveSubscription(workspaceId, 'student'); // Assuming 'student' type for now, ideally fetch from workspace details

    const [tiers, setTiers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        const fetchTiers = async () => {
            try {
                const response = await apiCallForSpaHelper({
                    method: 'GET',
                    url: `/api/workspaces/root/billing/tiers`
                });

                // CRASH FIX: Ensure response.data is an array
                if (response.data && Array.isArray(response.data)) {
                    setTiers(response.data);
                } else {
                    console.error("Received non-array tiers data:", response.data);
                    setTiers([]);
                }
            } catch (error) {
                console.error("Failed to fetch tiers", error);
                setTiers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTiers();
    }, []);

    const handleUpgrade = (tierId: string) => {
        // Pass scope to checkout
        window.location.href = `/workspaces/billing/checkout?tierId=${tierId}&scope=WORKSPACE&scopeId=${workspaceId}`;
    };


    if (loading || profileLoading) return (
        <div className="flex items-center justify-center p-24">
            <PiArrowsClockwiseBold className="text-4xl text-brand-primary animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="mb-12">
                <h1 className="text-3xl font-black text-slate-900 mb-2">{t('title')}</h1>
                <p className="text-slate-500">{t('subtitle')}</p>
            </div>

            {/* Current Status */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                        <PiCrownBold className="text-3xl text-brand-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t('current_plan')}</p>
                        <h2 className="text-2xl font-black text-slate-900 uppercase">
                            {effectiveSubscription?.type || 'Free Account'}
                        </h2>
                        {effectiveSubscription?.source === 'WORKSPACE_TYPE' && (
                            <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md mt-1 inline-block">
                                Inherited from Workspace Type
                            </span>
                        )}
                    </div>
                </div>
                {effectiveSubscription?.until && (
                    <div className="px-6 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold">
                        {t('expires_on')}: {effectiveSubscription.until.toLocaleDateString()}
                    </div>
                )}
            </div>

            {/* Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {Array.isArray(tiers) && tiers.map((tier) => {
                    const isCurrent = effectiveSubscription?.type?.toLowerCase() === tier.type?.toLowerCase();

                    return (
                        <div
                            key={tier.id}
                            className={`p-8 rounded-[2.5rem] bg-white border-2 flex flex-col transition-all ${isCurrent ? 'border-brand-primary shadow-xl' : 'border-slate-100 hover:border-slate-200'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black uppercase tracking-tight">{tier.title}</h3>
                                {isCurrent && (
                                    <span className="px-3 py-1 rounded-full bg-brand-primary text-slate-900 text-[10px] font-black uppercase">
                                        {t('active')}
                                    </span>
                                )}
                            </div>

                            <div className="mb-8">
                                <span className="text-4xl font-black">
                                    {tier.price}
                                </span>
                                <span className="text-slate-500 text-sm font-bold ml-1">AZN / {t('month')}</span>
                            </div>

                            <button
                                onClick={() => handleUpgrade(tier.id)}
                                disabled={isCurrent || !!actionLoading}
                                className={`w-full py-4 rounded-2xl font-black transition-all mb-8 ${isCurrent
                                    ? 'bg-emerald-50 text-emerald-600 cursor-default'
                                    : 'bg-slate-900 text-white hover:bg-brand-primary hover:text-slate-900'
                                    }`}
                            >
                                {actionLoading === tier.id ? (
                                    <PiArrowsClockwiseBold className="animate-spin mx-auto text-xl" />
                                ) : isCurrent ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <PiCheckBold /> {t('current')}
                                    </div>
                                ) : (
                                    t('select_plan')
                                )}
                            </button>

                            <div className="space-y-4">
                                {tier.metadata?.features?.map((feature: string) => (
                                    <div key={feature} className="flex items-start gap-3">
                                        <PiCheckCircleFill className="text-emerald-500 mt-1 flex-shrink-0" />
                                        <span className="text-sm text-slate-600 font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
}
