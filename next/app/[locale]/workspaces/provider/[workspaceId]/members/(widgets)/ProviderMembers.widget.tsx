'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { GlobalPaginationTile } from '@/app/[locale]/(global)/(tiles)/GlobalPagination.tile';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoader.tile';
import { Card } from '@/app/primitives/Card.primitive';
import { Button } from '@/app/primitives/Button.primitive';
import { toast } from 'react-toastify';
import { ConsoleLogger } from '@/lib/logging/Console.logger';
import { PiUser, PiEnvelope, PiPhone, PiUserPlus } from 'react-icons/pi';

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
            const data = await fetchApiUtil<{ members: Member[]; total: number; totalPages: number }>({
                method: 'GET',
                url: `/api/workspaces/provider/${workspaceId}/members`,
                params: { page, limit: 20 },
            });
            setMembers(data?.members || []);
            setTotal(data?.total || 0);
            setTotalPages(data?.totalPages || 1);
        } catch (error: unknown) {
            ConsoleLogger.error('Error fetching members:', error);
            toast.error('Failed to load members');
        } finally {
            setLoading(false);
        }
    }, [page, workspaceId]);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    const handleInvite = async () => {
        if (!inviteEmail) { toast.error("Please enter an email"); return; }
        setInviting(true);
        try {
            await fetchApiUtil<void>({
                method: 'POST',
                url: `/api/workspaces/provider/${workspaceId}/invitations/send`,
                body: { email: inviteEmail, role: inviteRole }
            });
            toast.success("Invitation sent successfully");
            setShowInviteModal(false);
            setInviteEmail('');
        } catch (error: unknown) {
            ConsoleLogger.error("Invite error:", error);
            toast.error("An error occurred");
        } finally {
            setInviting(false);
        }
    };

    if (loading && members.length === 0) return <GlobalLoaderTile />;

    const inputCls = "w-full rounded-app px-3 py-2 text-sm outline-none transition-colors border\
        border-black/10 dark:border-white/10\
        bg-white dark:bg-white/5\
        text-app-dark-blue dark:text-white\
        placeholder:text-app-dark-blue/30 dark:placeholder:text-white/30\
        focus:border-app-bright-green dark:focus:border-app-bright-green";
    const labelCls = "block text-sm font-semibold mb-1 text-app-dark-blue/70 dark:text-white/70";

    return (
        <div className="w-full py-6 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-app-dark-blue/50 dark:text-white/50">
                    Total members: <span className="font-semibold text-app-dark-blue dark:text-white">{total}</span>
                </p>
                <Button onClick={() => setShowInviteModal(true)} className="gap-2">
                    <PiUserPlus className="w-4 h-4" />
                    Invite Member
                </Button>
            </div>

            {loading && <GlobalLoaderTile message="Loading..." />}

            {!loading && members.length === 0 ? (
                <Card className="p-10 flex flex-col items-center gap-3 text-center
                    bg-white/50 dark:bg-white/5 border-dashed border-2">
                    <PiUser className="h-12 w-12 text-app-dark-blue/20 dark:text-white/20" />
                    <p className="text-app-dark-blue/50 dark:text-white/50">No members found.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {members.map((member) => (
                        <Card
                            key={member.accessId}
                            className="p-4 grid grid-cols-2 gap-4
                                bg-white/80 dark:bg-white/5
                                border-black/10 dark:border-white/10
                                hover:border-app-bright-green/30 dark:hover:border-app-bright-green/30
                                transition-colors"
                        >
                            {/* Left: identity */}
                            <div className="min-w-0">
                                <h3 className="font-bold text-app-dark-blue dark:text-white truncate">
                                    {member.firstName || 'N/A'} {member.lastName || ''}
                                </h3>
                                <div className="mt-1 space-y-0.5 text-sm text-app-dark-blue/50 dark:text-white/50">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <PiEnvelope className="w-4 h-4 shrink-0" />
                                        {member.email}
                                    </div>
                                    {member.phone && (
                                        <div className="flex items-center gap-1.5">
                                            <PiPhone className="w-4 h-4 shrink-0" />
                                            {member.phone}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-app-dark-blue/30 dark:text-white/30 mt-1">
                                    Joined: {new Date(member.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Right: role + sub */}
                            <div className="flex flex-col items-end justify-center gap-2">
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-app capitalize
                                    bg-app-bright-green/10 dark:bg-app-bright-green/20 text-app-bright-green">
                                    {member.accessRole}
                                </span>
                                {member.subscribedUntil && (
                                    <span className="text-xs text-app-dark-blue/40 dark:text-white/40">
                                        Sub until: {new Date(member.subscribedUntil).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <GlobalPaginationTile
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
            />

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md animate-in fade-in zoom-in duration-200
                        bg-white dark:bg-app-dark-blue/90
                        border-black/10 dark:border-white/10
                        shadow-2xl p-6 space-y-4">
                        <h2 className="text-xl font-bold text-app-dark-blue dark:text-white flex items-center gap-2">
                            <PiUserPlus className="text-app-bright-green" />
                            Invite Member
                        </h2>

                        <div>
                            <label className={labelCls}>Email Address</label>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className={inputCls}
                                placeholder="Enter email"
                            />
                            <p className="text-xs text-app-dark-blue/40 dark:text-white/40 mt-1">
                                User must already have an account.
                            </p>
                        </div>

                        <div>
                            <label className={labelCls}>Role</label>
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                className={inputCls}
                            >
                                <option value="staff">Staff</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowInviteModal(false)}
                                disabled={inviting}
                                className="px-4 py-2 rounded-app text-sm font-medium transition-colors
                                    text-app-dark-blue/60 dark:text-white/60
                                    hover:bg-black/5 dark:hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <Button onClick={handleInvite} disabled={inviting}>
                                {inviting ? 'Sending...' : 'Send Invitation'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
