
"use client";

import React, { useState, useEffect } from 'react';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { useTranslations } from 'next-intl';
import { PiCrownBold, PiClockBold } from 'react-icons/pi';
import { Link } from '@/i18n/routing';
import { useParams } from 'next/navigation';

export function GlobalSubscriptionStatusWidget() {
    const { subscriptionType, subscribedUntil, isAuthenticated, loading } = useGlobalAuthProfileContext();
    const t = useTranslations('GlobalSubscriptionStatusWidget');
    const [timeLeft, setTimeLeft] = useState<string>('');
    const params = useParams();
    const workspaceId = params?.workspaceId as string;

    useEffect(() => {
        if (!subscribedUntil) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            const end = new Date(subscribedUntil);
            const diff = end.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('expired');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h`);
            } else {
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${minutes}m`);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [subscribedUntil]);

    if (loading || !isAuthenticated) return null;

    if (!subscriptionType || timeLeft === 'expired') {
        return (
            <div className="mx-2 mb-4 p-3 rounded-app bg-orange-50 border border-orange-100 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-orange-700 font-bold text-xs uppercase tracking-wider">
                    <PiCrownBold className="text-sm" />
                    {t('free_plan')}
                </div>
                <p className="text-[10px] text-orange-600/80 leading-tight">
                    {t('upgrade_text')}
                </p>
                <Link
                    href={`/workspaces/student/${workspaceId}/billing`}
                    className="text-[10px] text-center font-bold bg-orange-500 text-white rounded py-1.5 px-3 hover:bg-orange-600 transition-colors"
                >
                    {t('upgrade_btn')}
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-2 mb-4 p-3 rounded-app bg-emerald-50 border border-emerald-100 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                    <PiCrownBold className="text-sm" />
                    {subscriptionType}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-100/50 px-2 py-0.5 rounded-app-full">
                    <PiClockBold />
                    {timeLeft}
                </div>
            </div>
            <div className="w-full bg-emerald-200/50 rounded-app-full h-1 mt-1">
                <div className="bg-emerald-500 h-1 rounded-app-full transition-all duration-1000" style={{ width: '75%' }}></div>
            </div>
        </div>
    );
}
