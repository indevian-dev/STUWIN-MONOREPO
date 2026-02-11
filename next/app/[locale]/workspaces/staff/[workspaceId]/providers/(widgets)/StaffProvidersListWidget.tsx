'use client';

import {
    useState,
    useEffect
} from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiCallForSpaHelper } from '@/lib/utils/http/SpaApiClient';
import Pagination
    from '../../ui/pagination';
import { toast } from 'react-toastify';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
import {
    PiBank,
    PiEye,
    PiPencil,
    PiTrash,
    PiCheck,
    PiX,
    PiWarning
} from 'react-icons/pi';
import Image
    from 'next/image';

interface Provider {
    id: number;
    title: string;
    description?: string;
    logo?: string;
    location?: {
        address?: string;
        [key: string]: any;
    };
    is_active: boolean;
    created_at: string;
}

export function StaffProvidersListWidget() {
    const [Providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [searchType, setSearchType] = useState('title');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeSearch, setActiveSearch] = useState('');
    const [activeSearchType, setActiveSearchType] = useState('title');
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'view' | 'activate' | 'delete' | ''>('');

    const router = useRouter();

    useEffect(() => {
        fetchProviders();
    }, [page, activeSearch, activeSearchType]);

    const params = useParams();
    const workspaceId = params.workspaceId as string;

    const fetchProviders = async () => {
        try {
            setLoading(true);
            const response = await apiCallForSpaHelper({
                method: 'GET',
                url: `/api/workspaces/staff/${workspaceId}/providers`,
                params: {
                    page,
                    ...(activeSearch && {
                        search: activeSearch,
                        searchType: activeSearchType
                    })
                },
                body: {}
            });

            if (response.status === 200) {
                const data = response.data;
                // API returns { data: [...], total: ... }
                setProviders(data.data || []);
                setTotalPages(Math.ceil(data.total / (data.pageSize || 10)));
            } else {
                setError('Failed to fetch Providers');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setError(errorMessage);
            ConsoleLogger.error('Error fetching Providers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setActiveSearch(search);
        setActiveSearchType(searchType);
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const openModal = (Provider: Provider, type: 'view' | 'activate' | 'delete') => {
        setSelectedProvider(Provider);
        setModalType(type);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedProvider(null);
        setModalType('');
        setIsModalOpen(false);
    };

    const handleProviderAction = async (ProviderId: number, action: string, value: boolean) => {
        try {
            const response = await apiCallForSpaHelper({
                method: 'PATCH',
                url: `/api/workspaces/staff/${workspaceId}/providers/${ProviderId}`,
                body: { [action]: value }
            });

            if (response.status === 200) {
                toast.success(`Provider ${action} updated successfully`);
                fetchProviders(); // Refresh the list
                closeModal();
            } else {
                toast.error(`Failed to update Provider ${action}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Error updating Provider: ${errorMessage}`);
        }
    };

    const handleDeleteProvider = async (ProviderId: number) => {
        try {
            const response = await apiCallForSpaHelper({
                method: 'DELETE',
                url: `/api/workspaces/staff/${workspaceId}/providers/${ProviderId}`,
                body: {}
            });

            if (response.status === 200) {
                toast.success('Provider deleted successfully');
                fetchProviders();
                closeModal();
            } else {
                toast.error('Failed to delete Provider');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Error deleting Provider: ${errorMessage}`);
        }
    };

    const getStatusBadge = (Provider: Provider) => {
        if (!Provider.is_active) {
            return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactive</span>;
        }
        return <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800">Active</span>;
    };

    if (loading && Providers.length === 0) {
        return <GlobalLoaderTile />;
    }

    if (error) {
        return (
            <div className="w-full p-4">
                <div className="bg-rose-100 border border-rose-400 text-rose-700 px-4 py-3 rounded">
                    Error: {error}
                </div>
            </div>
        );
    }

    return (
        <div className='w-full p-4'>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Educational Organizations Management</h1>
                <p className="text-gray-600">Manage and monitor all educational organizations in the platform</p>
            </div>

            {/* Search form */}
            <form onSubmit={handleSearch} className="mb-6">
                <div className="flex flex-wrap gap-2">
                    <select
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        className="px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 bg-white"
                    >
                        <option value="title">Organization Name</option>
                        <option value="description">Description</option>
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
                        className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                    >
                        Search
                    </button>
                    {search && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setActiveSearch('');
                                setPage(1);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </form>

            {loading && <GlobalLoaderTile message="Loading educational organizations..." />}

            {/* Providers List */}
            <div className="grid grid-cols-1 gap-4">
                {Providers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <PiBank className="mx-auto text-4xl mb-2" />
                        <p>No educational organizations found</p>
                    </div>
                ) : (
                    Providers.map((Provider) => (
                        <div key={Provider.id} className="bg-white rounded-lg shadow border p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Provider Info */}
                                <div className="lg:col-span-2">
                                    <div className="flex items-start gap-4">
                                        {Provider.logo && (
                                            <Image
                                                src={process.env.NEXT_PUBLIC_S3_PREFIX + '/providers/' + Provider.id + '/' + Provider.logo}
                                                alt={Provider.title}
                                                className="w-16 h-16 rounded-lg object-cover"
                                                width={64}
                                                height={64}
                                            />
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {Provider.title || 'Untitled Organization'}
                                                </h3>
                                                {getStatusBadge(Provider)}
                                            </div>

                                            {Provider.description && (
                                                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                                    {Provider.description}
                                                </p>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
                                                {Provider.location && (
                                                    <div>
                                                        <span className="font-medium">Location:</span> {Provider.location.address || JSON.stringify(Provider.location)}
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="font-medium">Created:</span> {new Date(Provider.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => openModal(Provider, 'view')}
                                        className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    >
                                        <PiEye /> View Details
                                    </button>

                                    <button
                                        onClick={() => openModal(Provider, 'activate')}
                                        className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded ${Provider.is_active
                                            ? 'bg-warning text-gray-800 hover:bg-yellow-400'
                                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                            }`}
                                    >
                                        {Provider.is_active ? <PiWarning /> : <PiCheck />}
                                        {Provider.is_active ? 'Deactivate' : 'Activate'}
                                    </button>

                                    <button
                                        onClick={() => openModal(Provider, 'delete')}
                                        className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-rose-500 text-white rounded hover:bg-rose-600"
                                    >
                                        <PiTrash /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            {/* Modal */}
            {isModalOpen && selectedProvider && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        {modalType === 'view' && (
                            <>
                                <h3 className="text-lg font-semibold mb-4">Provider Details</h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="font-medium">Name:</span> {selectedProvider.title || 'N/A'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Description:</span> {selectedProvider.description || 'N/A'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Location:</span> {selectedProvider.location ? (selectedProvider.location.address || JSON.stringify(selectedProvider.location)) : 'N/A'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Status:</span> {getStatusBadge(selectedProvider)}
                                    </div>
                                    <div>
                                        <span className="font-medium">Created:</span> {new Date(selectedProvider.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </>
                        )}

                        {modalType === 'activate' && (
                            <>
                                <h3 className="text-lg font-semibold mb-4">
                                    {selectedProvider.is_active ? 'Deactivate' : 'Activate'} Provider
                                </h3>
                                <p className="mb-4">
                                    Are you sure you want to {selectedProvider.is_active ? 'deactivate' : 'activate'} "{selectedProvider.title}"?
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleProviderAction(selectedProvider.id, 'is_active', !selectedProvider.is_active)}
                                        className={`px-4 py-2 rounded text-white ${selectedProvider.is_active
                                            ? 'bg-warning hover:bg-yellow-500'
                                            : 'bg-emerald-500 hover:bg-emerald-600'
                                            }`}
                                    >
                                        {selectedProvider.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button
                                        onClick={closeModal}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}

                        {modalType === 'delete' && (
                            <>
                                <h3 className="text-lg font-semibold mb-4 text-rose-600">Delete Provider</h3>
                                <p className="mb-4">
                                    Are you sure you want to permanently delete "{selectedProvider.title}"? This action cannot be undone.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDeleteProvider(selectedProvider.id)}
                                        className="px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={closeModal}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

