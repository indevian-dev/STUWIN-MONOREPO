'use client'

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
interface UserData {
    id: string;
    name: string;
    last_name: string;
    email: string;
    phone: string;
}

interface SessionData {
    id: string;
    user_agent: string;
    last_activity: number;
    isCurrentSession: boolean;
}

export default function MyAccount() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<UserData>({
        id: '',
        name: '',
        last_name: '',
        email: '',
        phone: '',
    });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [currentSession, setCurrentSession] = useState('');

    const [accountInfo, setAccountInfo] = useState({
        role: '',
        suspended: false,
        approved: false,
        is_personal: false
    });

    useEffect(() => {
        async function fetchUserData() {
            try {
                setIsFetching(true);
                const response = await apiCallForSpaHelper({
                    url: '/api/workspaces/dashboard/accounts/me',
                    method: 'GET'
                });

                if (response.data?.user && response.data?.account) {
                    setUser(response.data.user);
                    setAccountInfo(response.data.account);

                    // Process sessions data if available
                    if (response.data.user.sessions) {
                        const sessionsObj = response.data.user.sessions;
                        const sessionsArray = Object.keys(sessionsObj).map(sessionId => ({
                            id: sessionId,
                            ...sessionsObj[sessionId],
                            isCurrentSession: response.data.currentSession === sessionId
                        }));

                        // Sort sessions by last activity (most recent first)
                        sessionsArray.sort((a, b) => b.last_activity - a.last_activity);

                        setSessions(sessionsArray);
                        setCurrentSession(response.data.currentSession);
                    }
                } else {
                    setError('Failed to load account data');
                }
            } catch (error) {
                setError('Error fetching account data');
                ConsoleLogger.error('Error fetching account:', error);
            } finally {
                setIsFetching(false);
            }
        }

        fetchUserData();
    }, []);

    const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUser(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            const img = new Image();
            img.onload = () => {
                // Create canvas for resizing
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    setError('Failed to create canvas context');
                    return;
                }

                // Set canvas to square dimensions
                const size = 300;
                canvas.width = size;
                canvas.height = size;

                // Calculate crop dimensions to get the center square
                let sourceX = 0;
                let sourceY = 0;
                let sourceSize = Math.min(img.width, img.height);

                // If width is larger, offset X to center the crop
                if (img.width > img.height) {
                    sourceX = (img.width - sourceSize) / 2;
                }
                // If height is larger, offset Y to center the crop
                else if (img.height > img.width) {
                    sourceY = (img.height - sourceSize) / 2;
                }

                // Draw the center square of the image onto the canvas
                ctx.drawImage(
                    img,
                    sourceX, sourceY, sourceSize, sourceSize, // Source crop
                    0, 0, size, size                          // Destination square
                );

                // Convert to base64
                const resizedImage = canvas.toDataURL(file.type);
                setAvatarPreview(resizedImage);
            };

            if (event.target && event.target.result && typeof event.target.result === 'string') {
                img.src = event.target.result;
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await apiCallForSpaHelper({
                method: 'PATCH',
                url: '/api/workspaces/dashboard/accounts/me/update',
                body: JSON.stringify({
                    user: {
                        name: user.name,
                        last_name: user.last_name,
                        phone: user.phone,
                    }
                })
            });

            if (response.status === 200) {
                setIsEditMode(false);
                setAvatarPreview(null);
            } else {
                setError('Failed to update account');
            }
        } catch (error) {
            setError('An error occurred while updating your account');
            ConsoleLogger.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogoutSession = async (sessionId: string) => {
        try {
            setIsLoading(true);
            const response = await apiCallForSpaHelper({
                method: 'POST',
                url: '/api/workspaces/dashboard/accounts/me/logout-session',
                body: JSON.stringify({
                    sessionId
                })
            });

            if (response.status === 200) {
                // If current session is logged out, redirect to login
                if (sessionId === currentSession) {
                    router.push('/auth/login');
                    return;
                }

                // Update sessions list by removing the logged out session
                setSessions(prevSessions =>
                    prevSessions.filter(session => session.id !== sessionId)
                );
            } else {
                setError('Failed to logout session');
            }
        } catch (error) {
            setError('An error occurred while logging out the session');
            ConsoleLogger.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatLastActivity = (timestamp: number) => {
        if (!timestamp) return 'Unknown';

        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString();
        } else if (diffDays === 1) {
            return 'Yesterday at ' + date.toLocaleTimeString();
        } else {
            return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
        }
    };

    const formatDeviceInfo = (userAgent: string) => {
        if (!userAgent) return 'Unknown device';

        // Simple user agent parsing - could be enhanced
        const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
        const isTablet = /tablet|ipad/i.test(userAgent);
        const isWindows = /windows/i.test(userAgent);
        const isMac = /macintosh|mac os/i.test(userAgent);
        const isLinux = /linux/i.test(userAgent);

        let deviceType = 'Unknown device';
        if (isTablet) deviceType = 'Tablet';
        else if (isMobile) deviceType = 'Mobile';
        else deviceType = 'Desktop';

        let os = '';
        if (isWindows) os = 'Windows';
        else if (isMac) os = 'Mac OS';
        else if (isLinux) os = 'Linux';

        return `${deviceType} (${os})`;
    };

    if (isFetching) return <GlobalLoaderTile />;

    return (
        <div className="bg-white rounded-lg shadow-md px-4 md:px-8 w-full mx-auto">
            <div className="flex justify-between items-center py-6 border-b border-gray-200">
                <h2 className="text-3xl font-bold text-gray-800">My Account</h2>
                {!isEditMode ? (
                    <button
                        onClick={() => setIsEditMode(true)}
                        className="px-4 py-2 bg-bd text-white rounded-md hover:bg-bd/90 transition-colors"
                    >
                        Edit Profile
                    </button>
                ) : null}
            </div>

            {error && (
                <div className="bg-rose-50 text-rose-500 p-4 rounded-md my-4">
                    {error}
                </div>
            )}

            <div className="py-6">
                {!isEditMode ? (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-1/4">
                                <div className="aspect-square rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_S3_PREFIX}${user.id}/avatar/avatar.webp`}
                                        alt={`${user.name}'s avatar`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            const parent = (e.target as HTMLImageElement).parentElement;
                                            if (parent) {
                                                const initials = document.createElement('div');
                                                initials.className = "text-6xl text-gray-400";
                                                initials.innerText = user.name?.[0]?.toUpperCase() || '?';
                                                parent.appendChild(initials);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-3/4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">First Name</p>
                                        <p className="text-lg font-medium">{user.name || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Last Name</p>
                                        <p className="text-lg font-medium">{user.last_name || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="text-lg">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="text-lg font-medium">{user.phone || 'Not set'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6 mt-6">
                            <h3 className="text-xl font-semibold mb-4">Account Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Role</p>
                                    <p className="text-lg font-medium">
                                        <span className="inline-block px-3 py-1 bg-bl text-bd rounded-full">
                                            {accountInfo.role || 'User'}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <p className="text-lg font-medium">
                                        {accountInfo.suspended ?
                                            <span className="text-rose-500">Suspended</span> :
                                            <span className="text-emerald-500">Active</span>
                                        }
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Approval</p>
                                    <p className="text-lg font-medium">
                                        {accountInfo.approved ?
                                            <span className="text-emerald-500">Approved</span> :
                                            <span className="text-rose-500">Pending</span>
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sessions Section */}
                        <div className="border-t pt-6 mt-6">
                            <h3 className="text-xl font-semibold mb-4">Active Sessions</h3>
                            {sessions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Device
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {sessions.map(session => (
                                                <tr key={session.id} className={session.isCurrentSession ? "bg-bl/10" : ""}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {formatDeviceInfo(session.user_agent)}
                                                                {session.isCurrentSession &&
                                                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                                        Current
                                                                    </span>
                                                                }
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => handleLogoutSession(session.id)}
                                                            className="text-rose-500 hover:text-rose-700"
                                                            disabled={isLoading}
                                                        >
                                                            {session.isCurrentSession ? 'Log out' : 'Terminate'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500">No active sessions found.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                            <div className="flex items-center space-x-6">
                                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">
                                    <img
                                        src={avatarPreview || `${process.env.NEXT_PUBLIC_S3_PREFIX}${user.id}/avatar/avatar.webp`}
                                        alt={`${user.name}'s avatar`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            if (!avatarPreview) {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                const parent = (e.target as HTMLImageElement).parentElement;
                                                if (parent) {
                                                    const initials = document.createElement('div');
                                                    initials.className = "text-3xl text-gray-400";
                                                    initials.innerText = user.name?.[0]?.toUpperCase() || '?';
                                                    parent.appendChild(initials);
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="cursor-pointer bg-bl text-bd px-4 py-2 rounded-md hover:bg-bl/90 transition-colors">
                                        Upload New Photo
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF (max. 5MB)</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">First Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={user.name || ''}
                                    onChange={handleUserChange}
                                    className="mt-1 block w-full p-2 rounded-md border border-gray-300 shadow-sm focus:border-bl focus:ring-bl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={user.last_name || ''}
                                    onChange={handleUserChange}
                                    className="mt-1 block w-full p-2 rounded-md border border-gray-300 shadow-sm focus:border-bl focus:ring-bl"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={user.email || ''}
                                    disabled
                                    className="mt-1 block w-full p-2 rounded-md border border-gray-300 bg-gray-100 shadow-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={user.phone || ''}
                                    onChange={handleUserChange}
                                    className="mt-1 block w-full p-2 rounded-md border border-gray-300 shadow-sm focus:border-bl focus:ring-bl"
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditMode(false);
                                    setAvatarPreview(null);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 bg-bd text-white rounded-md hover:bg-bd/90 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
