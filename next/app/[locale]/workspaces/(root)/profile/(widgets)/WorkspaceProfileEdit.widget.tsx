"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { PiCamera, PiUser, PiEnvelope, PiPhone, PiShieldCheckBold } from 'react-icons/pi';
import { AuthVerificationWidget } from '@/app/[locale]/auth/verify/(widgets)/AuthVerification.widget';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoader.tile';
import { uploadFile } from '@/lib/utils/Uploader.File.util';

export function WorkspaceProfileEditWidget() {
    const t = useTranslations('WorkspaceProfileEditWidget');
    const router = useRouter();
    const {
        userId,
        email,
        phone,
        firstName: initialFirstName,
        lastName: initialLastName,
        getInitials,
        refreshProfile
    } = useGlobalAuthProfileContext();

    const avatarUrl = userId ? `${process.env.NEXT_PUBLIC_S3_PREFIX}${userId}/avatar/avatar.webp` : null;

    const [firstName, setFirstName] = useState(initialFirstName || '');
    const [lastName, setLastName] = useState(initialLastName || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // 2FA Flow state
    const [showVerification, setShowVerification] = useState(false);
    const [verificationType, setVerificationType] = useState<'email' | 'phone'>('email');
    const [newContactValue, setNewContactValue] = useState('');

    const [imageError, setImageError] = useState(false);
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
            const response = await fetchApiUtil<any>({
                url: '/api/auth/profile',
                method: 'PATCH',
                body: JSON.stringify({ firstName, lastName }),
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response;
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
            const originalExtension = file.name.split('.').pop() || 'webp';
            const fileName = `avatar.webp`; // Helper converts to webp
            const contentType = 'image/webp';

            console.log('Avatar upload starting (via helper):', { fileName, contentType, size: file.size });

            // 1. Get presigned URL
            const urlResponse = await fetchApiUtil<any>({
                url: `/api/auth/avatar?fileName=${fileName}&contentType=${contentType}`,
                method: 'GET'
            });

            const { uploadUrl } = await urlResponse.data;
            if (!uploadUrl) throw new Error("Could not get upload URL");

            // 2. Upload using helper
            await uploadFile({
                file,
                setProgress: (progress: number) => console.log(`Upload progress: ${progress.toFixed(2)}%`),
                presignedUrl: uploadUrl,
                fileName: fileName
            });

            console.log('Avatar upload successful!');
            toast.success(t('avatar_updated_success'));
            setImageError(false); // Reset error state on new upload

            // 3. Refresh profile to get new signed URL
            console.log('Refreshing profile...');
            setTimeout(() => {
                refreshProfile();
            }, 1000); // Small delay to allow S3 to process

        } catch (error: any) {
            console.error('Avatar upload caught error:', error);
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
                        className="text-app-bright-green font-semibold hover:underline flex items-center gap-2"
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
        <>
            {(isSaving || isUploading) && (
                <GlobalLoaderTile
                    fullPage={true}
                    message={isUploading ? "Uploading Avatar..." : "Saving Profile..."}
                />
            )}
            <div className="w-full mx-auto space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-white p-8 rounded border border-black/10 dark:border-white/10/50 ">
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                        <div className="w-32 h-32 rounded-app-full overflow-hidden bg-black/5 dark:bg-white/5 backdrop-blur-md flex items-center justify-center border-4 border-white shadow-md transition-transform group-hover:scale-105">
                            {avatarUrl && !imageError ? (
                                <Image
                                    src={avatarUrl}
                                    alt={fullName}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div className="w-full h-full bg-app-bright-green text-white flex items-center justify-center font-bold text-4xl">
                                    {getInitials(fullName)}
                                </div>
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-white p-2 rounded-app-full shadow-lg border border-black/10 dark:border-white/10 group-hover:bg-app-bright-green group-hover:text-white transition-colors">
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
                        <h1 className="text-3xl font-black text-app-dark-blue dark:text-white tracking-tight">{fullName}</h1>
                        <p className="text-app-dark-blue/70 dark:text-white/70 font-medium opacity-60 uppercase tracking-widest text-xs">{t('personal_profile')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Information Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSaveProfile} className="bg-white p-8 rounded border border-black/10 dark:border-white/10/50  space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-app-dark-blue dark:text-white">{t('first_name')}</label>
                                    <div className="relative">
                                        <PiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-app-dark-blue/70 dark:text-white/70" />
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full bg-black/5 dark:bg-white/5 backdrop-blur-md border-none rounded-app py-3 pl-12 pr-4 focus:ring-2 focus:ring-app-soft outline-none font-medium transition-all"
                                            placeholder={t('first_name_placeholder')}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-app-dark-blue dark:text-white">{t('last_name')}</label>
                                    <div className="relative">
                                        <PiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-app-dark-blue/70 dark:text-white/70" />
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full bg-black/5 dark:bg-white/5 backdrop-blur-md border-none rounded-app py-3 pl-12 pr-4 focus:ring-2 focus:ring-app-soft outline-none font-medium transition-all"
                                            placeholder={t('last_name_placeholder')}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-app-bright-green text-white font-bold px-8 py-3 rounded hover:bg-app-bright-green/90 transition-all disabled:opacity-50"
                            >
                                {isSaving ? t('saving') : t('save_changes')}
                            </button>
                        </form>

                        {/* Account Controls */}
                        <div className="bg-white p-8 rounded border border-black/10 dark:border-white/10/50  space-y-8">
                            <h2 className="text-xl font-black text-app-dark-blue dark:text-white tracking-tight">{t('contact_details')}</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-app-dark-blue dark:text-white font-bold">
                                        <PiEnvelope size={20} className="text-app-bright-green" />
                                        {t('email_address')}
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-app border border-black/10 dark:border-white/10/30">
                                        <span className="font-medium text-app-dark-blue dark:text-white truncate mr-4">{email || t('not_linked')}</span>
                                        <button
                                            onClick={() => initiateContactChange('email')}
                                            className="text-xs font-bold text-app-bright-green uppercase tracking-wider hover:bg-app-bright-green/10 px-3 py-1 rounded transition-colors"
                                        >
                                            {t('change')}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-app-dark-blue dark:text-white font-bold">
                                        <PiPhone size={20} className="text-app-bright-green" />
                                        {t('phone_number')}
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-app border border-black/10 dark:border-white/10/30">
                                        <span className="font-medium text-app-dark-blue dark:text-white truncate mr-4">{phone || t('not_linked')}</span>
                                        <button
                                            onClick={() => initiateContactChange('phone')}
                                            className="text-xs font-bold text-app-bright-green uppercase tracking-wider hover:bg-app-bright-green/10 px-3 py-1 rounded transition-colors"
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
                        <div className="bg-linear-to-br from-app to-app-soft p-8 rounded text-white shadow-xl shadow-app/20">
                            <div className="bg-white/20 w-12 h-12 rounded-app flex items-center justify-center mb-6">
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
        </>
    );
}
