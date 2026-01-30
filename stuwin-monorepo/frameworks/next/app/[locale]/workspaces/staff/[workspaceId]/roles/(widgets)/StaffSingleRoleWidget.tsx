'use client';

import {
    useEffect,
    useState
} from 'react';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import {
    staffEndpoints as endpoints,
    PERMISSIONS
} from '@/lib/app-route-configs/workspaces/staff/staff_endpoints';
import { StaffSwitchButtonTile } from '@/app/[locale]/workspaces/staff/[workspaceId]/(tiles)/StaffSwitchButtonTile';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
import { toast } from 'react-toastify';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface Role {
    id: string;
    name?: string;
    title: string;
    description?: string;
    permissions: string[];
    [key: string]: any;
}

interface StaffSingleRoleWidgetProps {
    id: string;
}

interface EndpointInfo {
    path: string;
    method: string[];
}

export function StaffSingleRoleWidget({ id }: StaffSingleRoleWidgetProps) {
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [updating, setUpdating] = useState<boolean>(false);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Extract unique permissions from endpoints
    const getUniquePermissions = () => {
        const permissionSet = new Set();
        Object.values(endpoints).forEach(endpoint => {
            if (endpoint.permission) {
                permissionSet.add(endpoint.permission);
            }
        });
        return Array.from(permissionSet).sort();
    };

    // Group permissions by category
    const getGroupedPermissions = (): Record<string, string[]> => {
        const allPermissions = getUniquePermissions() as string[];
        const grouped: Record<string, string[]> = {};

        allPermissions.forEach((permission: string) => {
            const category = permission.split('_')[0];
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
                method: (config as any).method || []
            }));
    };

    // Get permission description from endpoints file
    const getPermissionDescription = (permission: string): string => {
        return (PERMISSIONS as Record<string, string>)[permission] || "No description";
    };

    const groupedPermissions = getGroupedPermissions();

    useEffect(() => {
        const fetchRole = async () => {
            try {
                const response = await apiCallForSpaHelper({
                    url: `/api/workspaces/staff/roles/${id}`,
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.data;
                setRole(data.role);
                setPermissions(data.role?.permissions || []);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to fetch role';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchRole();
    }, [id]);

    const handlePermissionToggle = async (permission: string) => {
        try {
            setUpdating(true);
            const hasPermission = permissions.includes(permission);

            const response = await apiCallForSpaHelper({
                url: `/api/workspaces/staff/roles/${id}/permissions`,
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
                    ? permissions.filter(p => p !== permission)
                    : [...permissions, permission];

                setPermissions(updatedPermissions);
            }
        } catch (error) {
            ConsoleLogger.error('Failed to update permission:', error);
        } finally {
            setUpdating(false);
        }
    };

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({
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
    if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

    return (
        <div className="w-full px-4 py-4 md:px-8 md:py-8 lg:px-12 lg:py-12 space-y-6 text-black">
            {/* Role Header */}
            <div className="flex flex-col space-y-2">
                <h1 className="text-2xl font-bold">{role?.name}</h1>
                <p className="text-gray-500">{role?.description}</p>
                <div className="text-sm text-gray-600">
                    <span className="font-medium">{permissions.length}</span> permissions assigned
                </div>
            </div>

            {/* Search and Controls */}
            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <input
                        type="text"
                        placeholder="Search permissions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 max-w-md"
                    />
                    <button
                        onClick={toggleAllCategories}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
                    >
                        {Object.keys(groupedPermissions).every(cat => expandedCategories[cat]) ? 'Collapse All' : 'Expand All'}
                    </button>
                </div>
            </div>

            {/* Permissions by Category */}
            <div className="space-y-4">
                {Object.entries(filteredPermissions).map(([category, categoryPermissions]) => {
                    const isExpanded = expandedCategories[category];
                    const categoryPermissionsArray = categoryPermissions as string[];
                    const categoryPermissionCount = categoryPermissionsArray.filter((perm: string) => permissions.includes(perm)).length;

                    return (
                        <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
                            {/* Category Header */}
                            <div
                                className="px-6 py-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => toggleCategory(category)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, ' ')}
                                        </h3>
                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                            {categoryPermissionCount}/{categoryPermissionsArray.length}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-500">
                                            {categoryPermissionsArray.length} permissions
                                        </span>
                                        <svg
                                            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
                                <div className="divide-y divide-gray-100">
                                    {categoryPermissionsArray.map((permission: string) => {
                                        const hasPermission = permissions.includes(permission);
                                        const endpointsForPermission = getEndpointsForPermission(permission);
                                        const description = getPermissionDescription(permission);

                                        return (
                                            <div key={permission} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-3">
                                                            <h4 className="text-sm font-medium text-gray-900 truncate">
                                                                {permission}
                                                            </h4>
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${hasPermission
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {hasPermission ? 'Granted' : 'Not granted'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {description}
                                                        </p>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {endpointsForPermission.length} endpoint{endpointsForPermission.length !== 1 ? 's' : ''}
                                                            {endpointsForPermission.length > 0 && endpointsForPermission.length <= 3 && (
                                                                <span className="ml-2">
                                                                    ({endpointsForPermission.map(ep => `${ep.method} ${ep.path}`).join(', ')})
                                                                </span>
                                                            )}
                                                            {endpointsForPermission.length > 3 && (
                                                                <span className="ml-2">
                                                                    (e.g., {endpointsForPermission.slice(0, 2).map(ep => `${ep.method} ${ep.path}`).join(', ')}, +{endpointsForPermission.length - 2} more)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
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
                <div className="text-center py-12">
                    <div className="text-gray-500 text-lg">No permissions found matching "{searchTerm}"</div>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                        Clear search
                    </button>
                </div>
            )}
        </div>
    );
}



