'use client';

import {
    useEffect,
    useState
} from 'react';
import { useParams } from 'next/navigation';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import {
    staffEndpoints as endpoints,
    PERMISSIONS
} from '@/lib/app-route-configs/workspaces/staff/StaffRoutes';
import { StaffSwitchButtonTile } from '@/app/[locale]/workspaces/staff/[workspaceId]/(tiles)/StaffSwitchButtonTile';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
import { Link } from '@/i18n/routing';
import { toast } from 'react-toastify';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';

interface Role {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    forWorkspaceType: string;
    permissions: string[];
}

interface StaffSingleRoleWidgetProps {
    id: string;
}

interface EndpointInfo {
    path: string;
    method: string | string[];
}

export function StaffSingleRoleWidget({ id }: StaffSingleRoleWidgetProps) {
    const params = useParams();
    const workspaceId = params.workspaceId as string;

    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [updating, setUpdating] = useState<boolean>(false);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Extract unique permissions from endpoints
    const getUniquePermissions = () => {
        const permissionSet = new Set<string>();
        Object.values(endpoints).forEach(endpoint => {
            if (endpoint.permission) {
                permissionSet.add(endpoint.permission);
            }
        });

        // Also add from PERMISSIONS keys to ensure we don't miss any defined but unused permissions
        Object.keys(PERMISSIONS).forEach(perm => {
            permissionSet.add(perm);
        });

        return Array.from(permissionSet).sort();
    };

    // Group permissions by category
    const getGroupedPermissions = (): Record<string, string[]> => {
        const allPermissions = getUniquePermissions();
        const grouped: Record<string, string[]> = {};

        allPermissions.forEach((permission: string) => {
            // Category is usually the first part (e.g., STAFF_USER_READ -> STAFF)
            // But we might want more granular categories like USER, ROLE, etc.
            const parts = permission.split('_');
            const category = parts.length > 1 ? parts[1] : parts[0];

            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(permission);
        });

        return grouped;
    };

    // Get endpoints that use a specific permission
    const getEndpointsForPermission = (permission: string): EndpointInfo[] => {
        return Object.entries(endpoints)
            .filter(([_, config]) => config.permission === permission)
            .map(([path, config]) => ({
                path,
                method: (config as any).method || 'GET'
            }));
    };

    // Get permission description from endpoints file
    const getPermissionDescription = (permission: string): string => {
        return (PERMISSIONS as Record<string, string>)[permission] || "No description available";
    };

    const groupedPermissions = getGroupedPermissions();

    useEffect(() => {
        if (!id || !workspaceId) return;

        const fetchRole = async () => {
            try {
                const response = await apiCallForSpaHelper({
                    url: `/api/workspaces/staff/${workspaceId}/roles/${id}`,
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.data;
                if (data.role) {
                    setRole(data.role);
                    setPermissions(data.role.permissions || []);
                } else {
                    throw new Error('Role not found');
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to fetch role';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchRole();
    }, [id, workspaceId]);

    const handlePermissionToggle = async (permission: string) => {
        try {
            setUpdating(true);
            const hasPermission = permissions.includes(permission);

            const response = await apiCallForSpaHelper({
                url: `/api/workspaces/staff/${workspaceId}/roles/${id}/permissions`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    permission,
                    action: hasPermission ? 'remove' : 'add'
                })
            });

            if (response.status === 200) {
                toast.success('Permission updated successfully');
                const updatedPermissions = hasPermission
                    ? permissions.filter((p: string) => p !== permission)
                    : [...permissions, permission];

                setPermissions(updatedPermissions);
            }
        } catch (error) {
            ConsoleLogger.error('Failed to update permission:', error);
            toast.error('Failed to update permission');
        } finally {
            setUpdating(false);
        }
    };

    const toggleCategory = (category: string) => {
        setExpandedCategories((prev: Record<string, boolean>) => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const toggleAllCategories = () => {
        const allExpanded = Object.keys(groupedPermissions).every(cat => expandedCategories[cat]);
        const newState: Record<string, boolean> = {};
        Object.keys(groupedPermissions).forEach(cat => {
            newState[cat] = !allExpanded;
        });
        setExpandedCategories(newState);
    };

    const filteredPermissions = Object.entries(groupedPermissions).reduce((acc, [category, perms]) => {
        const filteredPerms = (perms as string[]).filter((perm: string) =>
            perm.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getPermissionDescription(perm).toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filteredPerms.length > 0) {
            acc[category] = filteredPerms;
        }
        return acc;
    }, {} as Record<string, string[]>);

    if (loading) return <GlobalLoaderTile />;
    if (error) return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mx-4 md:mx-8">
            <p className="font-bold">Error loading role</p>
            <p>{error}</p>
        </div>
    );

    return (
        <div className="w-full px-4 py-4 md:px-8 md:py-8 lg:px-12 lg:py-12 space-y-6 text-black">
            {/* Role Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{role?.name}</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 uppercase tracking-wider">
                            {role?.forWorkspaceType}
                        </span>
                    </div>
                    <p className="text-gray-500 max-w-2xl">{role?.description || 'No description provided.'}</p>
                    <div className="text-sm font-medium text-gray-600 flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {permissions.length} active permissions
                    </div>
                </div>

                <Link
                    href={`/workspaces/staff/${workspaceId}/roles`}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to Roles
                </Link>
            </div>

            {/* Search and Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-4 z-10">
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search permissions by name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                        />
                    </div>
                    <button
                        onClick={toggleAllCategories}
                        className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-600 transition-colors shadow-sm"
                    >
                        {Object.keys(groupedPermissions).every(cat => expandedCategories[cat]) ? 'Collapse All' : 'Expand All'}
                    </button>
                </div>
            </div>

            {/* Permissions by Category */}
            <div className="space-y-4">
                {Object.entries(filteredPermissions).map(([category, categoryPermissions]) => {
                    const isExpanded = expandedCategories[category];
                    const perms = categoryPermissions as string[];
                    const grantedCount = perms.filter(p => permissions.includes(p)).length;

                    return (
                        <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all">
                            {/* Category Header */}
                            <div
                                className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                                onClick={() => toggleCategory(category)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2 rounded-lg ${grantedCount > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                                                {category}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-gray-500">
                                                    {perms.length} total permissions
                                                </span>
                                                <span className="text-[10px] text-gray-300">•</span>
                                                <span className={`text-xs font-bold ${grantedCount === perms.length ? 'text-green-600' : grantedCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                    {grantedCount} granted
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Category Permissions */}
                            {isExpanded && (
                                <div className="divide-y divide-gray-50 bg-white">
                                    {perms.map((permission: string) => {
                                        const hasPermission = permissions.includes(permission);
                                        const eps = getEndpointsForPermission(permission);
                                        const desc = getPermissionDescription(permission);

                                        return (
                                            <div key={permission} className="px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                                                <div className="flex items-center justify-between gap-6">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="text-sm font-bold text-gray-800 break-all">
                                                                {permission}
                                                            </h4>
                                                            {hasPermission && (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                                                                    Active
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                                            {desc}
                                                        </p>
                                                        {eps.length > 0 && (
                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                {eps.map((ep, idx) => (
                                                                    <div key={idx} className="flex items-center gap-1.5 bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-500 font-medium">
                                                                        <span className="text-blue-600 font-bold">{Array.isArray(ep.method) ? ep.method[0] : ep.method}</span>
                                                                        <span className="truncate max-w-[200px]">{ep.path}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        <StaffSwitchButtonTile
                                                            checked={hasPermission}
                                                            onChange={() => handlePermissionToggle(permission)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* No Results */}
            {Object.keys(filteredPermissions).length === 0 && searchTerm && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <div className="text-gray-900 text-xl font-bold">No matching permissions</div>
                    <p className="text-gray-500 mt-1">We couldn't find anything matching "{searchTerm}"</p>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="mt-6 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        Clear search
                    </button>
                </div>
            )}
        </div>
    );
}



