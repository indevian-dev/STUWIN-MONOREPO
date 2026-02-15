'use client';

import {
    useState,
    useEffect
} from 'react';
import { useParams } from 'next/navigation';
import { apiCall } from '@/lib/utils/http/SpaApiClient';
import { GlobalPaginationTile } from '@/app/[locale]/(global)/(tiles)/GlobalPaginationTile';
import { toast } from 'react-toastify';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';

import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
interface Account {
    id: number;
    role: string;
    suspended: boolean;
    access_skope_type?: string;
    access_skope_key?: string;
}

interface User {
    id: string;
    name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    email_is_verified: boolean;
    phone_is_verified: boolean;
    created_at: string;
    accounts: Account[];
}

interface Role {
    id: number;
    name: string;
}

export function StaffUsersListWidget() {
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [search, setSearch] = useState('');
    const [searchType, setSearchType] = useState('user_name');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeSearch, setActiveSearch] = useState('');
    const [activeSearchType, setActiveSearchType] = useState('user_name');
    const [roles, setRoles] = useState<Role[]>([]);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [passwordData, setPasswordData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [passwordValidation, setPasswordValidation] = useState({
        hasMinLength: false,
        hasNumber: false,
        passwordsMatch: false
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await apiCall<any>({
                    method: 'GET',
                    url: `/api/workspaces/staff/${workspaceId}/users`,
                    params: {
                        page,
                        ...(activeSearch && { search: activeSearch }),
                        ...(activeSearch && { searchType: activeSearchType })
                    },
                    body: {}
                });
                // Ensure accounts is always an array for each user
                setUsers((response.users || []).map((u: User) => ({
                    ...u,
                    accounts: Array.isArray(u.accounts) ? u.accounts.filter(Boolean) : []
                })));
                setTotalPages(Math.ceil(response.total / response.pageSize));
            } catch (error) {
                setError(error as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [page, activeSearch, activeSearchType, workspaceId]);

    useEffect(() => {
        // Fetch available roles
        const fetchRoles = async () => {
            try {
                const response = await apiCall<any>({
                    method: 'GET',
                    url: `/api/workspaces/staff/${workspaceId}/roles`
                });
                setRoles(response.roles || []);
            } catch (error) {
                ConsoleLogger.error('Error fetching roles:', error);
            }
        };

        fetchRoles();
    }, [workspaceId]);

    // Password validation effect
    useEffect(() => {
        const { password, confirmPassword } = passwordData;
        setPasswordValidation({
            hasMinLength: password.length >= 8,
            hasNumber: /\d/.test(password),
            passwordsMatch: password === confirmPassword && confirmPassword !== ''
        });
    }, [passwordData]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setActiveSearch(search);
        setActiveSearchType(searchType);
        setPage(1); // Reset to first page when searching
    };

    const handlePageChange = (page: number) => {
        setPage(page);
    };

    const handleCreateAccount = async (userId: string) => {
        try {
            const response = await apiCall<any>({
                method: 'POST',
                url: `/api/workspaces/staff/${workspaceId}/users/create`,
                body: { userId }
            });

            // Refresh the users list to show the new account
            const updatedResponse = await apiCall<any>({
                method: 'GET',
                url: `/api/workspaces/staff/${workspaceId}/users`,
                params: {
                    page,
                    ...(search && { search: search }),
                    ...(search && { searchType: searchType })
                }
            });
            setUsers(updatedResponse.users);
        } catch (error) {
            setError(error as Error);
        }
    };

    const handleSuspendToggle = async (accountId: number, suspended: boolean) => {
        try {
            const response = await apiCall<any>({
                method: 'PUT',
                url: `/api/workspaces/staff/${workspaceId}/users/${accountId}`,
                body: JSON.stringify({ suspended })
            });

            toast.success(`Account ${suspended ? 'suspended' : 'unsuspended'} successfully`);
            // Update the users list to reflect the change
            setUsers(users.map(user => {
                if (user.accounts?.[0]?.id === accountId) {
                    return {
                        ...user,
                        accounts: [{
                            ...user.accounts?.[0],
                            suspended
                        }]
                    };
                }
                return user;
            }));
        } catch (error) {
            ConsoleLogger.error('Error updating account status:', error);
            toast.error('Error updating account status');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await apiCall<any>({
                method: 'DELETE',
                url: `/api/workspaces/staff/${workspaceId}/users/delete`,
                body: {
                    userId
                }
            });

            toast.success('User deleted successfully');
            // Remove the user from the local state
            setUsers(users.filter(user => user.id !== userId));
        } catch (error) {
            ConsoleLogger.error('Error deleting user:', error);
            toast.error('Error deleting user');
        }
    };

    const handleAssignRole = (accountId: number) => {
        setSelectedAccountId(accountId);
        setSelectedRole('');
        setIsRoleModalOpen(true);
    };

    const handleUpdatePassword = (userId: string) => {
        setSelectedUserId(userId);
        setPasswordData({
            password: '',
            confirmPassword: ''
        });
        setIsPasswordModalOpen(true);
    };

    const generateRandomPassword = () => {
        // Generate a random password (8-12 chars with at least one number)
        const length = Math.floor(Math.random() * 5) + 8; // 8-12 characters
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numset = "0123456789";

        let password = "";

        // Add at least one number
        password += numset.charAt(Math.floor(Math.random() * numset.length));

        // Fill the rest with random characters
        for (let i = 0; i < length - 1; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        // Shuffle the password characters
        password = password.split('').sort(() => 0.5 - Math.random()).join('');

        setPasswordData({
            password,
            confirmPassword: password
        });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData({
            ...passwordData,
            [name]: value
        });
    };

    const submitRoleAssignment = async () => {
        if (!selectedAccountId || !selectedRole) {
            toast.error('Please select a role');
            return;
        }

        try {
            const response = await apiCall<any>({
                method: 'PUT',
                url: `/api/workspaces/staff/${workspaceId}/users/${selectedAccountId}`,
                body: JSON.stringify({ role: selectedRole })
            });

            toast.success('Role assigned successfully');
            setIsRoleModalOpen(false);

            // Update local user state to reflect role assignment
            const updatedUsers = users.map(user => {
                if (user.accounts?.[0]?.id === selectedAccountId) {
                    return {
                        ...user,
                        accounts: [{
                            ...user.accounts?.[0],
                            role: selectedRole
                        }]
                    };
                }
                return user;
            });
            setUsers(updatedUsers);
        } catch (error) {
            ConsoleLogger.error('Error assigning role:', error);
            toast.error('Error assigning role');
        }
    };

    const submitPasswordUpdate = async () => {
        // Validate password
        if (!passwordValidation.hasMinLength || !passwordValidation.hasNumber || !passwordValidation.passwordsMatch) {
            toast.error('Please fix password validation errors');
            return;
        }

        try {
            const response = await apiCall<any>({
                method: 'PUT',
                url: `/api/workspaces/staff/${workspaceId}/users/update`,
                body: {
                    userId: selectedUserId,
                    password: passwordData.password
                }
            });

            toast.success('Password updated successfully');
            setIsPasswordModalOpen(false);
        } catch (error) {
            ConsoleLogger.error('Error updating password:', error);
            toast.error('Error updating password');
        }
    };

    const handleVerifyToggle = async (userId: string, field: string, value: boolean) => {
        try {
            const response = await apiCall<any>({
                method: 'PUT',
                url: `/api/workspaces/staff/${workspaceId}/users/update`,
                body: {
                    userId,
                    [field]: value
                }
            });

            const updated = response.user;
            setUsers(users.map(u => u.id === userId ? { ...u, ...updated } : u));
            toast.success(`${field === 'email_is_verified' ? 'Email' : 'Phone'} ${value ? 'verified' : 'unverified'}`);
        } catch (error) {
            ConsoleLogger.error('Error updating verification:', error);
            toast.error('Error updating verification');
        }
    };

    const handleAssignProviderScope = async (userId: string) => {
        if (!confirm('Are you sure you want to create a provider account for this user? This will create a new account and provider entity.')) {
            return;
        }

        try {
            const response = await apiCall<any>({
                method: 'POST',
                url: `/api/workspaces/staff/${workspaceId}/users/assign-provider`,
                body: {
                    userId
                }
            });

            toast.success(`Provider account created successfully! Account ID: ${response.account.id}, Provider ID: ${response.provider.id}`);

            // Refresh users list
            const updatedResponse = await apiCall<any>({
                method: 'GET',
                url: `/api/workspaces/staff/${workspaceId}/users`,
                params: {
                    page,
                    ...(activeSearch && { search: activeSearch }),
                    ...(activeSearch && { searchType: activeSearchType })
                }
            });
            setUsers((updatedResponse.users || []).map((u: User) => ({
                ...u,
                accounts: Array.isArray(u.accounts) ? u.accounts.filter(Boolean) : []
            })));
        } catch (error) {
            ConsoleLogger.error('Error creating provider account:', error);
            toast.error('Error creating provider account');
        }
    };

    if (loading && !users.length) return <GlobalLoaderTile />;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div className='w-full p-4'>
            {/* Search form */}
            <form onSubmit={handleSearch} className="mb-6">
                <div className="flex flex-wrap gap-2">
                    <select
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        className="px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 bg-white"
                    >
                        <option value="user_name">Name</option>
                        <option value="user_email">Email</option>
                        <option value="user_phone">Phone</option>
                    </select>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Search by ${searchType}...`}
                        className="flex-1 px-3 py-2 text-sm rounded border border-gray-300"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-bl text-black rounded hover:bg-bd hover:text-white"
                    >
                        Search
                    </button>
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </form>

            {loading && <GlobalLoaderTile message="Searching..." />}

            {/* Role Assignment Modal */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Assign Role</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Select Role</label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded"
                            >
                                <option value="">Select a role...</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.name}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsRoleModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRoleAssignment}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Update Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Update Password</h2>
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium">Password</label>
                                <button
                                    type="button"
                                    onClick={generateRandomPassword}
                                    className="text-xs px-2 py-1 bg-bl text-black rounded hover:bg-bd hover:text-white"
                                >
                                    Generate Random
                                </button>
                            </div>
                            <input
                                type="text"
                                name="password"
                                value={passwordData.password}
                                onChange={handlePasswordChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded"
                                placeholder="Enter new password"
                            />
                            <div className="mt-1 space-y-1">
                                <div className="flex items-center">
                                    <div className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${passwordValidation.hasMinLength ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                        {passwordValidation.hasMinLength ? '✓' : '✗'}
                                    </div>
                                    <p className={`text-xs ${passwordValidation.hasMinLength ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        Minimum 8 characters
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <div className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${passwordValidation.hasNumber ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                        {passwordValidation.hasNumber ? '✓' : '✗'}
                                    </div>
                                    <p className={`text-xs ${passwordValidation.hasNumber ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        At least one number
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">Confirm Password</label>
                            <input
                                type="text"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded"
                                placeholder="Confirm new password"
                            />
                            {passwordData.confirmPassword && (
                                <div className="flex items-center mt-1">
                                    <div className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${passwordValidation.passwordsMatch ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                        {passwordValidation.passwordsMatch ? '✓' : '✗'}
                                    </div>
                                    <p className={`text-xs ${passwordValidation.passwordsMatch ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        Passwords match
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsPasswordModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitPasswordUpdate}
                                className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                                disabled={!passwordValidation.hasMinLength || !passwordValidation.hasNumber || !passwordValidation.passwordsMatch}
                            >
                                Update Password
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {users.map((user) => (
                    <div key={user.id} className="bg-light rounded p-4 grid grid-cols-2 gap-4">
                        <div className="grid grid-cols-1 items-center w-full">
                            <img
                                className="h-12 w-12 rounded-full object-cover bg-gray-200"
                                src={`${process.env.NEXT_PUBLIC_S3_PREFIX}${user.id}/avatar/avatar.webp`}
                                alt=""
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.visibility = 'hidden';
                                }}
                            />
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {user.name ? user.name : 'N/A'} {user.last_name ? user.last_name : ''}
                                </h3>
                                <p className="text-sm text-black">{user.email}</p>
                            </div>
                            <div className="flex items-center text-sm text-black">
                                <span className="font-medium mr-2">Phone:</span>
                                {user.phone || 'N/A'}
                            </div>
                            <div className="text-xs text-black">
                                Joined: {new Date(user.created_at).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 justify-center items-center gap-2">
                            <div className="flex items-center text-sm text-black gap-2 flex-wrap">
                                {user.accounts && user.accounts.length > 0 ? (
                                    <>
                                        <button
                                            onClick={() => handleSuspendToggle(user.accounts[0].id, !user.accounts[0]?.suspended)}
                                            className={`px-3 py-1 rounded text-white ${user.accounts[0]?.suspended
                                                ? 'bg-red-600 hover:bg-red-700'
                                                : 'bg-green-600 hover:bg-green-700'
                                                }`}
                                        >
                                            {user.accounts[0]?.suspended ? 'Suspended' : 'Active'}
                                        </button>
                                        <button
                                            onClick={() => handleAssignRole(user.accounts[0].id)}
                                            className="px-3 py-1 rounded whitespace-nowrap bg-bl text-black"
                                        >
                                            Assign Role
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleCreateAccount(user.id)}
                                        className="px-3 py-1 rounded text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Assign Account
                                    </button>
                                )}
                                {/* Show Create Provider button if no provider account exists */}
                                {!user.accounts.some((acc: any) => acc.access_skope_type === 'provider') && (
                                    <button
                                        onClick={() => handleAssignProviderScope(user.id)}
                                        className="px-3 py-1 rounded whitespace-nowrap bg-purple-500 text-white hover:bg-purple-600"
                                    >
                                        Create Provider Account
                                    </button>
                                )}
                                <button
                                    onClick={() => handleUpdatePassword(user.id)}
                                    className="px-3 py-1 rounded text-white bg-emerald-500 hover:bg-emerald-600"
                                >
                                    Update Password
                                </button>
                                <button
                                    onClick={() => handleVerifyToggle(user.id, 'email_is_verified', !user.email_is_verified)}
                                    className={`px-3 py-1 rounded text-white ${user.email_is_verified ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                                >
                                    {user.email_is_verified ? 'Email Verified' : 'Verify Email'}
                                </button>
                                <button
                                    onClick={() => handleVerifyToggle(user.id, 'phone_is_verified', !user.phone_is_verified)}
                                    className={`px-3 py-1 rounded text-white ${user.phone_is_verified ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                                >
                                    {user.phone_is_verified ? 'Phone Verified' : 'Verify Phone'}
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="px-3 py-1 rounded text-white bg-red-500 hover:bg-red-600"
                                >
                                    Delete
                                </button>
                                {/* <ActionLogs
                                    resourceId={user.id}
                                    resourceType="user"
                                /> */}
                            </div>
                            <div className="text-xs text-black">
                                {user.accounts && user.accounts.length > 0 && (
                                    <>
                                        <div>Is Suspended: {user.accounts[0]?.suspended ? 'Yes' : 'No'}</div>
                                        <div>Role: {roles.find(r => r.name === user.accounts[0]?.role)?.name || 'No role assigned'}</div>
                                        <div>Scope: {(user.accounts[0] as any)?.access_skope_type || 'None'} {(user.accounts[0] as any)?.access_skope_key ? `#${(user.accounts[0] as any)?.access_skope_key}` : ''}</div>
                                        <div>Email Verified: {user.email_is_verified ? 'Yes' : 'No'}</div>
                                        <div>Phone Verified: {user.phone_is_verified ? 'Yes' : 'No'}</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <GlobalPaginationTile
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    );
}

