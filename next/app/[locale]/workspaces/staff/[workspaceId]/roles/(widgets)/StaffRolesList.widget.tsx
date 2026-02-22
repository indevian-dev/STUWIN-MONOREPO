'use client';

import {
    useEffect,
    useState,
    useMemo
} from 'react';
import { useParams } from 'next/navigation';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { Link } from '@/i18n/routing';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoader.tile';

import { ConsoleLogger } from '@/lib/logging/Console.logger';

interface Role {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    forWorkspaceType: string;
    permissions?: Record<string, unknown>;
}

interface NewRole {
    name: string;
    description: string;
    forWorkspaceType: string;
    permissions: string[];
}

const WORKSPACE_TYPES = ['student', 'provider', 'staff', 'parent', 'admin'];

export function StaffRolesListWidget() {
    const params = useParams();
    const workspaceId = params.workspaceId as string;

    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');

    const [newRole, setNewRole] = useState<NewRole>({
        name: '',
        description: '',
        forWorkspaceType: 'student',
        permissions: []
    });
    const [createError, setCreateError] = useState<string | null>(null);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await fetchApiUtil<any>({
                url: `/api/workspaces/staff/${workspaceId}/roles`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response;
            setRoles(data.roles || []);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch roles';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (workspaceId) {
            fetchRoles();
        }
    }, [workspaceId]);

    const filteredRoles = useMemo(() => {
        if (filterType === 'all') return roles;
        return roles.filter(role => role.forWorkspaceType === filterType);
    }, [roles, filterType]);

    const handleCreateRole = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCreateError(null);

        try {
            const response = await fetchApiUtil<any>({
                url: `/api/workspaces/staff/${workspaceId}/roles/create`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newRole)
            });

            if (response.role) {
                setRoles([...roles, response.role]);
                setIsModalOpen(false);
                setNewRole({ name: '', description: '', forWorkspaceType: 'student', permissions: [] });
            }
        } catch (error) {
            ConsoleLogger.error('Error creating role:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create role';
            setCreateError(errorMessage);
        }
    };

    if (loading) return <GlobalLoaderTile />;
    if (error) return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-app text-red-700">
            <p className="font-bold">Error loading roles</p>
            <p>{error}</p>
            <button
                onClick={fetchRoles}
                className="mt-2 text-sm underline hover:no-underline"
            >
                Try again
            </button>
        </div>
    );

    return (
        <div className="w-full px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-10 xl:py-10 space-y-6 text-black">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold">Workspace Roles</h1>
                    <p className="text-sm text-gray-500">Manage roles and permissions for different workspace types.</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 border rounded-app bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="all">All Types</option>
                        {WORKSPACE_TYPES.map(type => (
                            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-app hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
                        Add Role
                    </button>
                </div>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-app shadow-xl w-full max-w-md border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Create New Role</h2>
                        <form onSubmit={handleCreateRole}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Role Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Master Teacher"
                                        value={newRole.name}
                                        onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                        className="w-full rounded-app border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Workspace Type</label>
                                    <select
                                        value={newRole.forWorkspaceType}
                                        onChange={(e) => setNewRole({ ...newRole, forWorkspaceType: e.target.value })}
                                        className="w-full rounded-app border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        required
                                    >
                                        {WORKSPACE_TYPES.map(type => (
                                            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                    <textarea
                                        placeholder="Briefly describe what this role is for..."
                                        value={newRole.description}
                                        onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                        className="w-full rounded-app border border-gray-300 px-3 py-2 h-24 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                {createError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-app text-red-600 text-sm">
                                        {createError}
                                    </div>
                                )}
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-app transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-app hover:bg-blue-700 transition-colors font-medium shadow-sm"
                                    >
                                        Create Role
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-app">
                <div className="grid grid-cols-12 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-4">Role Name</div>
                    <div className="col-span-3">Type</div>
                    <div className="col-span-3">Created</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>
                <div className="divide-y divide-gray-100">
                    {filteredRoles.length === 0 ? (
                        <div className="py-12 px-4 text-center text-gray-400">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-medium">No roles found</p>
                            <p className="text-sm">Try changing your filter or add a new role.</p>
                        </div>
                    ) : (
                        filteredRoles.map((role) => (
                            <div key={role.id} className="grid grid-cols-12 py-4 px-4 hover:bg-blue-50/30 transition-colors items-center">
                                <div className="col-span-4 flex flex-col">
                                    <span className="font-bold text-gray-900">{role.name}</span>
                                    {role.description && <span className="text-xs text-gray-500 truncate mt-0.5">{role.description}</span>}
                                </div>
                                <div className="col-span-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-app-full text-xs font-medium ${role.forWorkspaceType === 'staff' ? 'bg-purple-100 text-purple-800' :
                                        role.forWorkspaceType === 'provider' ? 'bg-green-100 text-green-800' :
                                            role.forWorkspaceType === 'student' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {role.forWorkspaceType}
                                    </span>
                                </div>
                                <div className="col-span-3 text-sm text-gray-500">
                                    {new Date(role.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </div>
                                <div className="col-span-2 text-right">
                                    <Link
                                        href={`/workspaces/staff/${workspaceId}/roles/${role.id}`}
                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-bold rounded-app text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                                    >
                                        Manage
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}


