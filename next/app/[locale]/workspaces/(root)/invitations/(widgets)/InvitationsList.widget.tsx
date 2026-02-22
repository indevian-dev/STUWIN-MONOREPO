'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoader.tile';
import { Card } from '@/app/primitives/Card.primitive';
import { Button } from '@/app/primitives/Button.primitive';
import { toast } from 'react-toastify';
import { ConsoleLogger } from '@/lib/logging/Console.logger';
import { PiEnvelopeSimple, PiUser, PiCheckCircle, PiXCircle } from 'react-icons/pi';

interface Invitation {
    id: string;
    createdAt: string;
    forWorkspaceId: string;
    isApproved: boolean;
    isDeclined: boolean;
    accessRole: string;
    workspace: {
        id: string;
        title: string;
        type: string;
    };
    invitedBy: {
        firstName: string | null;
        lastName: string | null;
        email: string;
    };
}

export function InvitationsListWidget() {
    const [invitations, setInvitations] = useState<{ invitation: Invitation, workspace: { id: string, title: string, type: string }, invitedBy: { firstName: string | null, lastName: string | null, email: string } }[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchInvitations = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetchApiUtil<any>({
                method: 'GET',
                url: `/api/workspaces/invitations`
            });

            // okResponse wraps data as { success: true, data: [...] }
            if (response?.success !== false) {
                const data = Array.isArray(response) ? response : (response?.data || []);
                setInvitations(data);
            } else {
                toast.error(response?.error || "Failed to load invitations");
            }
        } catch (error) {
            ConsoleLogger.error('Error fetching invitations:', error);
            toast.error('Failed to load invitations');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvitations();
    }, [fetchInvitations]);

    const handleRespond = async (invitationId: string, action: 'approve' | 'decline') => {
        setProcessingId(invitationId);
        try {
            const response = await fetchApiUtil<any>({
                method: 'POST',
                url: `/api/workspaces/invitations/${invitationId}/respond`,
                body: { action }
            });

            if (response?.success !== false) {
                toast.success(action === 'approve' ? "Invitation accepted!" : "Invitation declined");
                await fetchInvitations();
            } else {
                toast.error(response?.error || "Failed to respond");
            }
        } catch (error) {
            ConsoleLogger.error('Response error:', error);
            toast.error("An error occurred");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <GlobalLoaderTile message="Loading invitations..." />;

    if (invitations.length === 0) {
        return (
            <Card className="p-10 flex flex-col items-center gap-3 text-center
                bg-white/50 dark:bg-white/5 border-dashed border-2
                border-black/10 dark:border-white/10">
                <PiEnvelopeSimple className="h-12 w-12 text-app-dark-blue/20 dark:text-white/20" />
                <p className="text-app-dark-blue/50 dark:text-white/50">
                    You have no pending invitations.
                </p>
            </Card>
        );
    }

    return (
        <div className="w-full space-y-3">
            <p className="text-sm text-app-dark-blue/50 dark:text-white/50 mb-4">
                Pending invitations: <span className="font-semibold text-app-dark-blue dark:text-white">{invitations.length}</span>
            </p>

            {invitations.map((item) => {
                const inv = item.invitation;
                const ws = item.workspace;
                const by = item.invitedBy;
                return (
                    <Card
                        key={inv.id}
                        className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4
                            bg-white/80 dark:bg-white/5
                            border-black/10 dark:border-white/10
                            hover:border-app-bright-green/30 dark:hover:border-app-bright-green/30
                            transition-colors"
                    >
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-app-dark-blue dark:text-white truncate">
                                {ws.title}
                            </h3>
                            <p className="text-xs text-app-dark-blue/40 dark:text-white/40 capitalize mt-0.5">
                                {ws.type} workspace
                            </p>
                            <div className="mt-2 space-y-0.5 text-sm text-app-dark-blue/50 dark:text-white/50">
                                <div className="flex items-center gap-1.5">
                                    <PiUser className="w-4 h-4 shrink-0" />
                                    <span>{by.firstName || ''} {by.lastName || ''} ({by.email})</span>
                                </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-app capitalize
                                    bg-app-bright-green/10 dark:bg-app-bright-green/20 text-app-bright-green">
                                    {inv.accessRole}
                                </span>
                                <span className="text-xs text-app-dark-blue/30 dark:text-white/30">
                                    {new Date(inv.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto shrink-0">
                            <button
                                onClick={() => handleRespond(inv.id, 'decline')}
                                disabled={processingId === inv.id}
                                className="flex-1 md:flex-none px-4 py-2 rounded-app text-sm font-medium transition-colors
                                    border border-black/10 dark:border-white/10
                                    text-app-dark-blue/60 dark:text-white/60
                                    hover:bg-red-50 dark:hover:bg-red-500/10
                                    hover:text-red-600 dark:hover:text-red-400
                                    hover:border-red-200 dark:hover:border-red-500/30
                                    disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                <PiXCircle className="w-4 h-4" />
                                Decline
                            </button>
                            <Button
                                onClick={() => handleRespond(inv.id, 'approve')}
                                disabled={processingId === inv.id}
                                className="flex-1 md:flex-none gap-1.5"
                            >
                                <PiCheckCircle className="w-4 h-4" />
                                {processingId === inv.id ? 'Processing...' : 'Accept'}
                            </Button>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}

