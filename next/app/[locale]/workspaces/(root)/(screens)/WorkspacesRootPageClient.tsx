'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { PiPlusBold } from 'react-icons/pi';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';

import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { PiBuildings, PiUserGear, PiStudent, PiBriefcase } from 'react-icons/pi';
import { Card } from '@/app/primitives/Card.primitive';
import { Button } from '@/app/primitives/Button.primitive';

interface Workspace {
    workspaceId: string;
    workspaceType: 'student' | 'provider' | 'staff' | 'parent';
    title: string;
    description: string;
    routePath: string;
}

export function WorkspacesRootPageClient() {
    const t = useTranslations('WorkspacesRootPageClient');
    const { firstName, getInitials } = useGlobalAuthProfileContext();
    const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                setLoading(true);
                // apiCall unwraps the { success, data } envelope — returns data directly
                const response = await fetchApiUtil<{ workspaces: Workspace[]; total: number }>({
                    url: '/api/workspaces/list',
                    method: 'GET'
                });

                setWorkspaces(response.workspaces ?? []);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to fetch workspaces');
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
                    <h1 className="text-4xl font-black text-app-dark-blue dark:text-white tracking-tighter">
                        {t('welcome_back')}, <span className="text-app-bright-green">{firstName || 'User'}</span>
                    </h1>
                    <p className="text-app-dark-blue/70 dark:text-white/70 font-medium opacity-70">
                        {t('select_workspace_message')}
                    </p>
                </div>

                <Button
                    isLink
                    href="/workspaces/onboarding/welcome"
                    variant="default"
                    className="gap-2"
                >
                    <PiPlusBold />
                    {t('create_new_workspace')}
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse h-44" />
                    ))}
                </div>
            ) : workspaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspaces.map((workspace) => (
                        <Link
                            key={workspace.workspaceId}
                            href={getWorkspaceUrl(workspace)}
                            className="group block"
                        >
                            <Card className="h-full p-6 flex flex-col justify-between
                                bg-white/80 dark:bg-white/5
                                border-black/10 dark:border-white/10
                                hover:border-app-bright-green/40 dark:hover:border-app-bright-green/40
                                hover:shadow-xl hover:-translate-y-1
                                transition-all duration-300">
                                <div className="space-y-4">
                                    <div className="w-12 h-12 rounded-app
                                        bg-app-bright-green/10 dark:bg-app-bright-green/10
                                        text-app-bright-green
                                        flex items-center justify-center
                                        group-hover:bg-app-bright-green group-hover:text-white
                                        dark:group-hover:bg-app-bright-green dark:group-hover:text-app-dark-blue
                                        transition-colors duration-300">
                                        {getWorkspaceIcon(workspace.workspaceType)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold
                                            text-app-dark-blue dark:text-white
                                            group-hover:text-app-bright-green
                                            transition-colors">
                                            {workspace.title}
                                        </h3>
                                        <p className="text-xs font-black uppercase tracking-widest mt-1
                                            text-app-dark-blue/40 dark:text-white/40">
                                            {workspace.workspaceType}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center gap-1 text-app-bright-green font-bold text-sm">
                                    {t('go_to_workspace')} →
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4
                    bg-white/50 dark:bg-white/5
                    border-dashed border-2 border-black/10 dark:border-white/10">
                    <p className="text-app-dark-blue/60 dark:text-white/60 font-medium max-w-xs">
                        {t('no_active_workspaces_message')}
                    </p>
                    <Button isLink href="/workspaces/onboarding/welcome" variant="default">
                        {t('start_onboarding_cta')}
                    </Button>
                </Card>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-app font-medium border border-red-100">
                    {error}
                </div>
            )}
        </div>
    );
}
