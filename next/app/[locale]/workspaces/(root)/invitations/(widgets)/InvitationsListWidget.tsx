'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/utils/http/SpaApiClient';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
import { toast } from 'react-toastify';
import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';

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
            const response = await apiCall<any>({
                method: 'GET',
                url: `/api/workspaces/invitations`
            });

            if (response?.success) {
                setInvitations(response || []);
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
            const response = await apiCall<any>({
                method: 'POST',
                url: `/api/workspaces/invitations/${invitationId}/respond`,
                body: { action }
            });

            if (response?.success) {
                toast.success(action === 'approve' ? "Invitation accepted!" : "Invitation declined");
                // Refresh list
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
            <div className="p-8 text-center bg-white rounded-lg shadow-sm">
                <p className="text-gray-500">You have no pending invitations.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4">
            <h2 className="text-xl font-bold mb-6">Workspace Invitations</h2>
            {invitations.map((item) => {
                const inv = item.invitation;
                const ws = item.workspace;
                const by = item.invitedBy;
                return (
                    <div key={inv.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{ws.title}</h3>
                            <p className="text-sm text-gray-500 capitalize">Type: {ws.type}</p>
                            <div className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">Invited by:</span> {by.firstName} {by.lastName} ({by.email})
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                                <span className="font-medium">Role:</span> <span className="capitalize">{inv.accessRole}</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-400">
                                Sent on {new Date(inv.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={() => handleRespond(inv.id, 'decline')}
                                disabled={processingId === inv.id}
                                className="flex-1 md:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                            >
                                Decline
                            </button>
                            <button
                                onClick={() => handleRespond(inv.id, 'approve')}
                                disabled={processingId === inv.id}
                                className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
                            >
                                {processingId === inv.id ? 'Processing...' : 'Accept Invitation'}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
