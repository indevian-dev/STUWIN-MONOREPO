
"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { PiCheckCircleFill, PiCrownBold, PiLightningBold, PiStarBold, PiArrowsClockwiseBold, PiCheckBold } from 'react-icons/pi';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';

export function StudentBillingPageClient() {
    const t = useTranslations('StudentBillingPage');
    const { workspaceId } = useParams();
    const { subscriptionType, subscribedUntil, refreshProfile } = useGlobalAuthProfileContext();

    const [tiers, setTiers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

    useEffect(() => {
        const fetchTiers = async () => {
            try {
                const response = await apiCallForSpaHelper({
                    method: 'GET',
                    url: `/api/workspaces/student/${workspaceId}/billing/tiers`
                });
                if (response.data) {
                    setTiers(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch tiers", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTiers();
    }, [workspaceId]);

    const handleUpgrade = async (tierId: string) => {
        try {
            setActionLoading(tierId);
            const response = await apiCallForSpaHelper({
                method: 'POST',
                url: `/api/workspaces/student/${workspaceId}/billing/pay`,
                body: {
                    tierId,
                    couponCode: appliedCoupon?.code,
                    language: 'az' // We can get this from next-intl if needed
                }
            });

            if (response.data && response.data.redirectUrl) {
                window.location.href = response.data.redirectUrl;
            } else {
                alert("Failed to initiate payment. Please try again.");
            }
        } catch (error: any) {
            console.error("Upgrade error:", error);
            alert(error.message || "Something went wrong");
        } finally {
            setActionLoading(null);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        try {
            setActionLoading('coupon');
            const response = await apiCallForSpaHelper({
                method: 'POST',
                url: `/api/workspaces/student/${workspaceId}/billing/coupon`,
                body: { code: couponCode }
            });
            if (response.data) {
                setAppliedCoupon(response.data);
            }
        } catch (error: any) {
            alert(error.message || "Invalid coupon");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading || isLoading) return <GlobalLoaderTile />;

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
                            {subscriptionType || 'Free Account'}
                        </h2>
                    </div>
                </div>
                {subscribedUntil && (
                    <div className="px-6 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold">
                        {t('expires_on')}: {new Date(subscribedUntil).toLocaleDateString()}
                    </div>
                )}
            </div>

            {/* Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {tiers.map((tier) => {
                    const isCurrent = subscriptionType?.toLowerCase() === tier.type?.toLowerCase();
                    const discount = appliedCoupon?.discountPercent || 0;
                    const finalPrice = tier.price * (1 - discount / 100);

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
                                    {appliedCoupon ? finalPrice.toFixed(2) : tier.price}
                                </span>
                                <span className="text-slate-500 text-sm font-bold ml-1">AZN / {t('month')}</span>
                                {appliedCoupon && (
                                    <p className="text-xs text-emerald-600 font-bold mt-1">
                                        {discount}% discount applied!
                                    </p>
                                )}
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

            {/* Coupons */}
            <div className="mt-16 p-8 bg-slate-50 rounded-[2.5rem] max-w-2xl mx-auto border border-slate-200">
                <h3 className="text-lg font-black text-slate-900 mb-4">{t('have_coupon')}</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="SUMMER2026"
                        className="flex-1 px-6 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary uppercase font-bold"
                    />
                    <button
                        onClick={handleApplyCoupon}
                        disabled={!!actionLoading}
                        className="px-8 py-3 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                        {actionLoading === 'coupon' ? <PiArrowsClockwiseBold className="animate-spin" /> : t('apply')}
                    </button>
                </div>
                {appliedCoupon && (
                    <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-sm">
                        <PiCheckCircleFill />
                        {t('coupon_applied', { percent: appliedCoupon.discountPercent })}
                    </div>
                )}
            </div>
        </div>
    );
}
