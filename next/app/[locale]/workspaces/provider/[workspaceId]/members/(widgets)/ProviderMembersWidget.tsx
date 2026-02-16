'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiCall } from '@/lib/utils/http/SpaApiClient';
import { GlobalPaginationTile } from '@/app/[locale]/(global)/(tiles)/GlobalPaginationTile';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
import { toast } from 'react-toastify';
import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';

interface Member {
    userId: string;
    accountId: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    accessId: string;
    accessRole: string;
    subscribedUntil: string | null;
    createdAt: string;
}

export function ProviderMembersWidget() {
    const params = useParams();
    const workspaceId = (params?.workspaceId as string) || '';
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('staff');
    const [inviting, setInviting] = useState(false);

    const fetchMembers = useCallback(async () => {
        if (!workspaceId) return;
        try {
            setLoading(true);
            const data = await apiCall<any>({
                method: 'GET',
                url: `/api/workspaces/provider/${workspaceId}/members`,
                params: {
                    page,
                    limit: 20,
                },
            });

            setMembers(data?.members || []);
            setTotal(data?.total || 0);
            setTotalPages(data?.totalPages || 1);
        } catch (error) {
            ConsoleLogger.error('Error fetching members:', error);
            toast.error('Failed to load members');
        } finally {
            setLoading(false);
        }
    }, [page, workspaceId]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleInvite = async () => {
        if (!inviteEmail) {
            toast.error("Please enter an email");
            return;
        }
        setInviting(true);
        try {
            await apiCall<void>({
                method: 'POST',
                url: `/api/workspaces/provider/${workspaceId}/invitations/send`,
                body: {
                    email: inviteEmail,
                    role: inviteRole
                }
            });
            toast.success("Invitation sent successfully");
            setShowInviteModal(false);
            setInviteEmail('');
        } catch (error) {
            ConsoleLogger.error("Invite error:", error);
            toast.error("An error occurred");
        } finally {
            setInviting(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    if (loading && members.length === 0) return <GlobalLoaderTile />;

    return (
        <div className="w-full p-4">
            <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-500">
                    Total members: {total}
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition font-medium text-sm"
                >
                    Invite Member
                </button>
            </div>

            {loading && <GlobalLoaderTile message="Loading..." />}

            {!loading && members.length === 0 ? (
                <p className="text-gray-500">No members found.</p>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {members.map((member) => (
                        <div key={member.accessId} className="bg-light rounded p-4 grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-bold text-gray-900">
                                    {member.firstName || 'N/A'} {member.lastName || ''}
                                </h3>
                                <p className="text-sm text-gray-600">{member.email}</p>
                                {member.phone && (
                                    <p className="text-sm text-gray-500">{member.phone}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                    Joined: {new Date(member.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex flex-col items-end justify-center gap-1">
                                <span className="inline-block px-2 py-0.5 text-xs rounded bg-green-100 text-green-800 capitalize">
                                    {member.accessRole}
                                </span>
                                {member.subscribedUntil && (
                                    <span className="text-xs text-gray-500">
                                        Sub until: {new Date(member.subscribedUntil).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <GlobalPaginationTile
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Invite Member</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter email"
                                />
                                <p className="text-xs text-gray-500 mt-1">User must already have an account.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="staff">Staff</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                                disabled={inviting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInvite}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                disabled={inviting}
                            >
                                {inviting ? 'Sending...' : 'Send Invitation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
