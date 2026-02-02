'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { PiPlusBold } from 'react-icons/pi';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { loadClientSideCoLocatedTranslations } from '@/i18n/i18nClientSide';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { PiBuildings, PiUserGear, PiStudent, PiBriefcase } from 'react-icons/pi';

interface Workspace {
    workspaceId: string;
    workspaceType: 'student' | 'provider' | 'staff';
    title: string;
    description: string;
    routePath: string;
}

export function WorkspacesRootPageClient() {
    const { t } = loadClientSideCoLocatedTranslations('WorkspacesRootPageClient');
    const { firstName, getInitials } = useGlobalAuthProfileContext();
    const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                setLoading(true);
                const response = await apiCallForSpaHelper({
                    url: '/api/workspaces/list',
                    method: 'GET'
                });

                if (response.data && response.data.success) {
                    setWorkspaces(response.data.data);
                } else {
                    throw new Error(response.data?.error?.message || 'Failed to fetch workspaces');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkspaces();
    }, []);

    const getWorkspaceIcon = (type: string) => {
        switch (type) {
            case 'student': return <PiStudent className="text-2xl" />;
            case 'provider': return <PiBuildings className="text-2xl" />;
            case 'tutor': return <PiUserGear className="text-2xl" />;
            case 'staff': return <PiBriefcase className="text-2xl" />;
            default: return <PiBuildings className="text-2xl" />;
        }
    };

    const getWorkspaceUrl = (workspace: Workspace) => {
        return `/workspaces/${workspace.workspaceType}/${workspace.workspaceId}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-dark tracking-tighter">
                        {t('welcome_back')}, <span className="text-brand">{firstName || 'User'}</span>
                    </h1>
                    <p className="text-body font-medium opacity-70">
                        {t('select_workspace_message')}
                    </p>
                </div>

                <Link
                    href="/workspaces/onboarding/welcome"
                    className="flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-primary font-bold hover:bg-brand/90 transition-all shadow-lg shadow-brand/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                    <PiPlusBold />
                    {t('create_new_workspace')}
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white p-6 rounded-primary border border-border/50 animate-pulse h-40"></div>
                    ))}
                </div>
            ) : workspaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspaces.map((workspace) => (
                        <Link
                            key={workspace.workspaceId}
                            href={getWorkspaceUrl(workspace)}
                            className="group bg-white p-6 rounded-primary border border-border/50 hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 transition-all duration-300 flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors duration-300">
                                    {getWorkspaceIcon(workspace.workspaceType)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-dark group-hover:text-brand transition-colors">
                                        {workspace.title}
                                    </h3>
                                    <p className="text-sm text-body opacity-60 font-medium line-clamp-1 uppercase tracking-widest mt-1">
                                        {workspace.workspaceType}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center text-brand font-bold text-sm">
                                {t('go_to_workspace')} →
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white/50 border-2 border-dashed border-border rounded-primary p-12 flex flex-col items-center justify-center text-center space-y-4 col-span-full">
                        <p className="text-body font-medium max-w-xs opacity-60">
                            {t('no_active_workspaces_message')}
                        </p>
                        <Link
                            href="/workspaces/onboarding/welcome"
                            className="text-brand font-bold hover:underline"
                        >
                            {t('start_onboarding_cta')}
                        </Link>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium border border-red-100">
                    {error}
                </div>
            )}
        </div>
    );
}
