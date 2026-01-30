'use client';

import {
    useEffect,
    useState
} from 'react';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { Link } from '@/i18n/routing';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface Role {
    id: number;
    name: string;
    description?: string;
    created_at: string;
    permissions?: Record<string, unknown>;
}

interface NewRole {
    name: string;
    description: string;
    permissions: string[];
}

export function StaffRolesListWidget() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRole, setNewRole] = useState<NewRole>({
        name: '',
        description: '',
        permissions: []
    });
    const [createError, setCreateError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await apiCallForSpaHelper({
                    url: '/api/workspaces/staff/roles',
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.data;
                setRoles(data.roles);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to fetch roles';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchRoles();
    }, []);

    const handleCreateRole = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCreateError(null);

        try {
            const response = await apiCallForSpaHelper({
                url: '/api/workspaces/staff/roles/create',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newRole)
            });

            if (response.data.role) {
                setRoles([...roles, response.data.role]);
                setIsModalOpen(false);
                setNewRole({ name: '', description: '', permissions: [] });
            }
        } catch (error) {
            ConsoleLogger.error('Error creating role:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create role';
            setCreateError(errorMessage);
        }
    };

    if (loading) return <GlobalLoaderTile />;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="w-full px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-10 xl:py-10 space-y-6 text-black">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Roles</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Add Role
                </button>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create New Role</h2>
                        <form onSubmit={handleCreateRole}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={newRole.name}
                                        onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={newRole.description}
                                        onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                    />
                                </div>
                                {createError && (
                                    <div className="text-red-500 text-sm">{createError}</div>
                                )}
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 border rounded text-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Create Role
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="flex bg-gray-50 py-3 px-4 text-sm font-medium text-gray-500">
                    <div className="w-1/4">Name</div>
                    <div className="w-1/4">Created</div>
                    <div className="w-1/4">JWT Permissions</div>
                    <div className="w-1/4">DB Permissions</div>
                </div>
                <div className="divide-y divide-gray-200">
                    {roles.length === 0 ? (
                        <div className="py-4 px-4 text-center text-gray-500">
                            No roles found
                        </div>
                    ) : (
                        roles.map((role) => (
                            <div key={role.id} className="flex py-4 px-4 hover:bg-gray-50 text-black">
                                <div className="w-1/4 font-medium text-gray-900">{role.name}</div>
                                <div className="w-1/4 text-gray-500">
                                    {new Date(role.created_at).toLocaleDateString()}
                                </div>
                                <div className="w-1/4 text-gray-500">
                                    {role.permissions ? Object.keys(role.permissions).length : 0} permissions
                                </div>
                                <Link href={`/staff/roles/${role.id}`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"> Edit </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}


