
"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { PiPlusBold, PiTrashBold, PiToggleLeftFill, PiToggleRightFill, PiArrowsClockwiseBold, PiCheckCircleFill, PiTicketBold } from 'react-icons/pi';
import { apiCallForSpaHelper } from '@/lib/utils/http/SpaApiClient';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';

export function StaffCouponManagementClient() {
    const t = useTranslations('StaffCouponManagement');
    const { workspaceId } = useParams();

    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create form state
    const [formData, setFormData] = useState({
        code: '',
        discountPercent: 10,
        isActive: true,
        metadata: {}
    });

    useEffect(() => {
        fetchCoupons();
    }, [workspaceId]);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const response = await apiCallForSpaHelper({
                method: 'GET',
                url: `/api/workspaces/staff/${workspaceId}/payments/coupons`
            });
            if (response.data) {
                setCoupons(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch coupons", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading('create');
            const response = await apiCallForSpaHelper({
                method: 'POST',
                url: `/api/workspaces/staff/${workspaceId}/payments/coupons`,
                body: {
                    ...formData,
                    code: formData.code.toUpperCase()
                }
            });
            if (response.data?.success) {
                setShowCreateModal(false);
                setFormData({ code: '', discountPercent: 10, isActive: true, metadata: {} });
                fetchCoupons();
            }
        } catch (error: any) {
            alert(error.message || "Failed to create coupon");
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleStatus = async (coupon: any) => {
        try {
            setActionLoading(coupon.id);
            await apiCallForSpaHelper({
                method: 'PUT',
                url: `/api/workspaces/staff/${workspaceId}/payments/coupons/${coupon.id}`,
                body: { isActive: !coupon.isActive }
            });
            fetchCoupons();
        } catch (error: any) {
            alert(error.message || "Failed to update coupon");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;
        try {
            setActionLoading(id);
            await apiCallForSpaHelper({
                method: 'DELETE',
                url: `/api/workspaces/staff/${workspaceId}/payments/coupons/${id}`
            });
            fetchCoupons();
        } catch (error: any) {
            alert(error.message || "Failed to delete coupon");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <GlobalLoaderTile />;

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">{t('title')}</h1>
                    <p className="text-slate-500">{t('subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-brand-primary hover:text-slate-900 transition-all shadow-lg"
                >
                    <PiPlusBold /> {t('create_new')}
                </button>
            </div>

            {/* Coupons List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => (
                    <div
                        key={coupon.id}
                        className={`p-6 rounded-[2rem] bg-white border-2 transition-all ${coupon.isActive ? 'border-slate-100' : 'border-slate-50 opacity-60'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                <PiTicketBold className="text-2xl text-slate-400" />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleStatus(coupon)}
                                    disabled={!!actionLoading}
                                    className={`text-3xl transition-colors ${coupon.isActive ? 'text-emerald-500' : 'text-slate-300'}`}
                                >
                                    {actionLoading === coupon.id ? (
                                        <PiArrowsClockwiseBold className="animate-spin text-xl" />
                                    ) : coupon.isActive ? (
                                        <PiToggleRightFill />
                                    ) : (
                                        <PiToggleLeftFill />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleDelete(coupon.id)}
                                    disabled={!!actionLoading}
                                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <PiTrashBold />
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{coupon.code}</h3>
                            <p className="text-slate-500 text-sm font-bold">{t('discount')}: {coupon.discountPercent}%</p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>{t('created')}: {new Date(coupon.createdAt).toLocaleDateString()}</span>
                            <span>{coupon.isActive ? t('status_active') : t('status_inactive')}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-black text-slate-900 mb-6">{t('modal_title')}</h2>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('field_code')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="SUMMER20"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white outline-none font-black text-lg transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('field_discount')} (%)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="100"
                                    value={formData.discountPercent}
                                    onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white outline-none font-black text-lg transition-all"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black hover:bg-slate-200 transition-all"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={!!actionLoading}
                                    className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-brand-primary hover:text-slate-900 transition-all shadow-lg"
                                >
                                    {actionLoading === 'create' ? <PiArrowsClockwiseBold className="animate-spin mx-auto text-xl" /> : t('create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
