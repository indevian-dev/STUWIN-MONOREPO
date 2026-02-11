'use client';

import { useState, useCallback } from 'react';
import { apiCallForSpaHelper } from '@/lib/utils/http/SpaApiClient';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
import { toast } from 'react-toastify';
import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';

interface SearchedAccount {
    userId: string;
    accountId: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    fin: string | null;
}

interface WorkspaceAccess {
    workspace: {
        id: string;
        name: string;
        type: string;
    };
    access: {
        accessRole: string;
        viaWorkspaceId: string;
        targetWorkspaceId: string;
    };
}

export function StaffManageWorkspacesWidget() {
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'email' | 'phone' | 'fin'>('email');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchedAccount[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Selected account state
    const [selectedAccount, setSelectedAccount] = useState<SearchedAccount | null>(null);
    const [workspaces, setWorkspaces] = useState<WorkspaceAccess[]>([]);
    const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
    const [workspaceTypeFilter, setWorkspaceTypeFilter] = useState<string>('all');

    // Add to staff modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [addingToStaff, setAddingToStaff] = useState(false);
    const [targetWorkspaceId, setTargetWorkspaceId] = useState('');
    const [accessRole, setAccessRole] = useState('viewer');

    const handleSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            setSearching(true);
            setHasSearched(true);
            setSelectedAccount(null);
            setWorkspaces([]);

            const params: Record<string, string> = {};
            params[searchType] = searchQuery.trim();

            const response = await apiCallForSpaHelper({
                method: 'GET',
                url: '/api/workspaces/staff/accounts/search',
                params,
            });

            const data = await response.data;
            setSearchResults(data?.accounts || []);
        } catch (error) {
            ConsoleLogger.error('Error searching accounts:', error);
            toast.error('Failed to search accounts');
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }, [searchQuery, searchType]);

    const handleSelectAccount = useCallback(async (account: SearchedAccount) => {
        setSelectedAccount(account);
        setLoadingWorkspaces(true);
        setWorkspaceTypeFilter('all');

        try {
            const response = await apiCallForSpaHelper({
                method: 'GET',
                url: `/api/workspaces/staff/accounts/${account.accountId}/workspaces`,
            });

            const data = await response.data;
            setWorkspaces(data?.owned?.map((ws: Record<string, unknown>) => ({
                workspace: ws,
                access: { accessRole: 'owner', viaWorkspaceId: (ws as Record<string, string>).id, targetWorkspaceId: (ws as Record<string, string>).id }
            })) || []);

            // Also add connected workspaces
            if (data?.connected) {
                const connectedMapped = data.connected.map((ws: Record<string, unknown>) => ({
                    workspace: ws,
                    access: { accessRole: (ws as Record<string, string>).relationType || 'member', viaWorkspaceId: '', targetWorkspaceId: (ws as Record<string, string>).id }
                }));
                setWorkspaces(prev => [...prev, ...connectedMapped]);
            }
        } catch (error) {
            ConsoleLogger.error('Error fetching workspaces:', error);
            toast.error('Failed to load user workspaces');
        } finally {
            setLoadingWorkspaces(false);
        }
    }, []);

    const handleAddToStaff = useCallback(async () => {
        if (!selectedAccount || !targetWorkspaceId || !accessRole) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setAddingToStaff(true);
            const response = await apiCallForSpaHelper({
                method: 'POST',
                url: '/api/workspaces/staff/memberships/add-staff',
                body: {
                    accountId: selectedAccount.accountId,
                    targetWorkspaceId,
                    accessRole,
                },
            });

            if (response.status === 201 || response.status === 200) {
                toast.success('User added to staff workspace successfully');
                setShowAddModal(false);
                // Refresh workspaces
                handleSelectAccount(selectedAccount);
            } else {
                const data = await response.data;
                toast.error(data?.error || 'Failed to add user to staff workspace');
            }
        } catch (error) {
            ConsoleLogger.error('Error adding to staff:', error);
            toast.error('Failed to add user to staff workspace');
        } finally {
            setAddingToStaff(false);
        }
    }, [selectedAccount, targetWorkspaceId, accessRole, handleSelectAccount]);

    const filteredWorkspaces = workspaceTypeFilter === 'all'
        ? workspaces
        : workspaces.filter(w => w.workspace.type === workspaceTypeFilter);

    const workspaceTypes = Array.from(new Set(workspaces.map(w => w.workspace.type)));

    return (
        <div className="w-full p-4">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-6">
                <div className="flex flex-wrap gap-2">
                    <select
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value as 'email' | 'phone' | 'fin')}
                        className="px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 bg-white"
                    >
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="fin">FIN</option>
                    </select>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Search by ${searchType}...`}
                        className="flex-1 px-3 py-2 text-sm rounded border border-gray-300"
                    />
                    <button
                        type="submit"
                        disabled={searching}
                        className="px-4 py-2 bg-bl text-black rounded hover:bg-bd hover:text-white disabled:opacity-50"
                    >
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => { setSearchQuery(''); setSearchResults([]); setHasSearched(false); }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </form>

            {searching && <GlobalLoaderTile message="Searching accounts..." />}

            {/* Search Results */}
            {hasSearched && !searching && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold mb-3">
                        Search Results ({searchResults.length})
                    </h2>
                    {searchResults.length === 0 ? (
                        <p className="text-gray-500">No accounts found matching your search.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {searchResults.map((account) => (
                                <div
                                    key={account.accountId}
                                    onClick={() => handleSelectAccount(account)}
                                    className={`bg-light rounded p-4 cursor-pointer transition hover:ring-2 hover:ring-blue-400 ${selectedAccount?.accountId === account.accountId
                                            ? 'ring-2 ring-blue-500'
                                            : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-900">
                                                {account.firstName || 'N/A'} {account.lastName || ''}
                                            </h3>
                                            <p className="text-sm text-gray-600">{account.email}</p>
                                            {account.phone && (
                                                <p className="text-sm text-gray-500">{account.phone}</p>
                                            )}
                                            {account.fin && (
                                                <p className="text-xs text-gray-400">FIN: {account.fin}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedAccount(account);
                                                    setShowAddModal(true);
                                                }}
                                                className="px-3 py-1 rounded text-white bg-blue-600 hover:bg-blue-700 text-sm"
                                            >
                                                Add to Staff
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Selected Account Workspaces */}
            {selectedAccount && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold">
                            Workspaces for {selectedAccount.firstName} {selectedAccount.lastName}
                        </h2>
                        {workspaceTypes.length > 1 && (
                            <select
                                value={workspaceTypeFilter}
                                onChange={(e) => setWorkspaceTypeFilter(e.target.value)}
                                className="px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 bg-white"
                            >
                                <option value="all">All Types</option>
                                {workspaceTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {loadingWorkspaces ? (
                        <GlobalLoaderTile message="Loading workspaces..." />
                    ) : filteredWorkspaces.length === 0 ? (
                        <p className="text-gray-500">No workspaces found.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredWorkspaces.map((wa, i) => (
                                <div key={`${wa.workspace.id}-${i}`} className="bg-light rounded p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{wa.workspace.name || wa.workspace.id}</h3>
                                            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700">
                                                {wa.workspace.type}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-600 capitalize">
                                            {wa.access.accessRole}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add to Staff Modal */}
            {showAddModal && selectedAccount && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Add to Staff Workspace</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Adding <strong>{selectedAccount.firstName} {selectedAccount.lastName}</strong> ({selectedAccount.email})
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Target Workspace ID</label>
                            <input
                                type="text"
                                value={targetWorkspaceId}
                                onChange={(e) => setTargetWorkspaceId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded"
                                placeholder="Enter target workspace ID"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Access Role</label>
                            <select
                                value={accessRole}
                                onChange={(e) => setAccessRole(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                                <option value="manager">Manager</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddToStaff}
                                disabled={addingToStaff}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {addingToStaff ? 'Adding...' : 'Add to Staff'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
