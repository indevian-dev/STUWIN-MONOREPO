"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { loadClientSideCoLocatedTranslations } from '@/i18n/i18nClientSide';
import Image from 'next/image';
import { PiCamera, PiUser, PiEnvelope, PiPhone, PiShieldCheckBold } from 'react-icons/pi';
import { AuthVerificationWidget } from '@/app/[locale]/auth/verify/(widgets)/AuthVerificationWidget';

export function AuthProfileEditWidget() {
    const { t } = loadClientSideCoLocatedTranslations('AuthProfileEditWidget');
    const router = useRouter();
    const {
        userId,
        email,
        phone,
        firstName: initialFirstName,
        lastName: initialLastName,
        avatarUrl,
        getInitials,
        refreshProfile
    } = useGlobalAuthProfileContext();

    const [firstName, setFirstName] = useState(initialFirstName || '');
    const [lastName, setLastName] = useState(initialLastName || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // 2FA Flow state
    const [showVerification, setShowVerification] = useState(false);
    const [verificationType, setVerificationType] = useState<'email' | 'phone'>('email');
    const [newContactValue, setNewContactValue] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync state with context when context loads
    useEffect(() => {
        if (initialFirstName) setFirstName(initialFirstName);
        if (initialLastName) setLastName(initialLastName);
    }, [initialFirstName, initialLastName]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            const response = await apiCallForSpaHelper({
                url: '/api/auth/profile',
                method: 'PATCH',
                body: JSON.stringify({ firstName, lastName }),
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.data;
            if (result.error) throw new Error(result.error);

            toast.success(t('profile_updated_success'));
            refreshProfile();
        } catch (error: any) {
            toast.error(error.message || t('profile_update_failed'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // basic validation
        if (!file.type.startsWith('image/')) {
            toast.error(t('invalid_image_type'));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('image_too_large'));
            return;
        }

        try {
            setIsUploading(true);

            // 1. Get presigned URL
            const urlResponse = await apiCallForSpaHelper({
                url: `/api/auth/avatar?fileName=avatar.webp&contentType=image/webp`,
                method: 'GET'
            });

            const { uploadUrl } = await urlResponse.data;

            if (!uploadUrl) throw new Error("Could not get upload URL");

            // 2. Upload directly to S3/Tebi
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': 'image/webp'
                }
            });

            if (!uploadResponse.ok) throw new Error("Upload failed");

            toast.success(t('avatar_updated_success'));

            // 3. Refresh profile to get new signed URL
            setTimeout(() => {
                refreshProfile();
            }, 1000); // Small delay to allow S3 to process

        } catch (error: any) {
            toast.error(error.message || t('avatar_upload_failed'));
        } finally {
            setIsUploading(false);
        }
    };

    const initiateContactChange = (type: 'email' | 'phone') => {
        setVerificationType(type);
        setNewContactValue(type === 'email' ? email || '' : phone || '');
        setShowVerification(true);
    };

    if (showVerification) {
        return (
            <div className="max-w-2xl mx-auto py-10">
                <div className="mb-6">
                    <button
                        onClick={() => setShowVerification(false)}
                        className="text-brand font-semibold hover:underline flex items-center gap-2"
                    >
                        ← {t('back_to_profile')}
                    </button>
                </div>
                <AuthVerificationWidget
                    type={verificationType}
                    onSuccess={() => {
                        setShowVerification(false);
                        refreshProfile();
                    }}
                />
            </div>
        );
    }

    const fullName = `${firstName} ${lastName}`.trim() || 'User';

    return (
        <div className="w-full mx-auto space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-white p-8 rounded border border-border/50 ">
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-surface flex items-center justify-center border-4 border-white shadow-md transition-transform group-hover:scale-105">
                        {avatarUrl ? (
                            <Image src={avatarUrl} alt={fullName} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full bg-brand text-white flex items-center justify-center font-bold text-4xl">
                                {getInitials(fullName)}
                            </div>
                        )}
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg border border-border group-hover:bg-brand group-hover:text-white transition-colors">
                        <PiCamera size={20} />
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>

                <div className="flex-1 space-y-1">
                    <h1 className="text-3xl font-black text-dark tracking-tight">{fullName}</h1>
                    <p className="text-body font-medium opacity-60 uppercase tracking-widest text-xs">{t('personal_profile')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Form */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSaveProfile} className="bg-white p-8 rounded border border-border/50  space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-dark">{t('first_name')}</label>
                                <div className="relative">
                                    <PiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-body" />
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full bg-surface border-none rounded-lg py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-soft outline-none font-medium transition-all"
                                        placeholder={t('first_name_placeholder')}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-dark">{t('last_name')}</label>
                                <div className="relative">
                                    <PiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-body" />
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full bg-surface border-none rounded-lg py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-soft outline-none font-medium transition-all"
                                        placeholder={t('last_name_placeholder')}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-brand text-white font-bold px-8 py-3 rounded hover:bg-brand/90 transition-all disabled:opacity-50"
                        >
                            {isSaving ? t('saving') : t('save_changes')}
                        </button>
                    </form>

                    {/* Account Controls */}
                    <div className="bg-white p-8 rounded border border-border/50  space-y-8">
                        <h2 className="text-xl font-black text-dark tracking-tight">{t('contact_details')}</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-dark font-bold">
                                    <PiEnvelope size={20} className="text-brand" />
                                    {t('email_address')}
                                </div>
                                <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border/30">
                                    <span className="font-medium text-dark truncate mr-4">{email || t('not_linked')}</span>
                                    <button
                                        onClick={() => initiateContactChange('email')}
                                        className="text-xs font-bold text-brand uppercase tracking-wider hover:bg-brand/10 px-3 py-1 rounded transition-colors"
                                    >
                                        {t('change')}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-dark font-bold">
                                    <PiPhone size={20} className="text-brand" />
                                    {t('phone_number')}
                                </div>
                                <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border/30">
                                    <span className="font-medium text-dark truncate mr-4">{phone || t('not_linked')}</span>
                                    <button
                                        onClick={() => initiateContactChange('phone')}
                                        className="text-xs font-bold text-brand uppercase tracking-wider hover:bg-brand/10 px-3 py-1 rounded transition-colors"
                                    >
                                        {t('change')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Status Card */}
                <div className="space-y-6">
                    <div className="bg-linear-to-br from-brand to-brand-soft p-8 rounded text-white shadow-xl shadow-brand/20">
                        <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                            <PiShieldCheckBold size={24} />
                        </div>
                        <h3 className="text-xl font-black mb-2">{t('account_secure')}</h3>
                        <p className="text-white/80 text-sm font-medium leading-relaxed">
                            {t('secure_notice')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
