
"use client"
import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { FiMapPin, FiCheckCircle, FiDollarSign } from 'react-icons/fi';
import { Program, getProgramLogoUrl } from '../PublicProgramsService';

type PublicProgramsListItemWidgetProps = {
    program: Program;
};

export function PublicProgramsListItemWidget({ program }: PublicProgramsListItemWidgetProps): React.JSX.Element | null {
    if (!program) return null;

    const logoUrl = getProgramLogoUrl(program);
    const profile = program.profile || {};

    // Extract price details
    const price = profile.providerSubscriptionPrice || profile.monthlyPrice;
    const period = profile.providerSubscriptionPeriod || 'month';
    const currency = profile.currency || 'AZN';

    return (
        <Link
            href={`/programs/${program.id}`}
            className="block h-full bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
        >
            {/* Logo/Image Container */}
            <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                <Image
                    src={logoUrl}
                    alt={program.title || 'Educational Program'}
                    fill
                    className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                {program.isActive && (
                    <div className="absolute top-3 right-3 bg-brand text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-sm">
                        <FiCheckCircle size={14} />
                        Aktiv
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col h-[calc(100%-16/10*w)] min-h-[160px]">
                {/* Title */}
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-brand transition-colors">
                    {program.title || 'Educational Program'}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">
                    {profile.providerProgramDescription || 'No description available for this program.'}
                </p>

                {/* Footer info: Location & Price */}
                <div className="mt-auto space-y-2 pt-4 border-t border-gray-100">
                    {profile.location && (
                        <div className="flex items-start gap-2 text-xs text-gray-400">
                            <FiMapPin className="flex-shrink-0 mt-0.5" size={14} />
                            <span className="line-clamp-1">
                                {profile.location.address || profile.location.city || 'Location available'}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-brand">
                            <FiDollarSign size={16} />
                            {price ? (
                                <span>
                                    {price} {currency} <span className="text-xs font-normal text-gray-400">/ {period}</span>
                                </span>
                            ) : (
                                <span className="text-gray-400 font-medium">Qiymət qeyd olunmayıb</span>
                            )}
                        </div>

                        <span className="text-xs font-medium text-brand hover:underline">
                            Ətraflı →
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
