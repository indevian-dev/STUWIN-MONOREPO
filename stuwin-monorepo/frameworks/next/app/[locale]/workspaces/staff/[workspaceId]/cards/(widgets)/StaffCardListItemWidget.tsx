"use client";

import { useState } from 'react';
import { StaffCardDetailsModalWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/cards/(widgets)/StaffCardDetailsModalWidget';
import { toast } from 'react-toastify';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface Card {
    id: number;
    title?: string;
    price?: number;
    store_id?: number;
    store_name?: string;
    is_approved: boolean;
    is_active?: boolean;
    created_at: string;
    has_pending_updates?: boolean;
    published_data?: {
        title?: string;
        price?: number;
        is_active?: boolean;
    };
    [key: string]: any;
}

interface StaffCardListItemWidgetProps {
    card: Card;
    t: (key: string) => string;
    onRefreshList: () => void;
}

export function StaffCardListItemWidget({
    card,
    t,
    onRefreshList
}: StaffCardListItemWidgetProps) {

    // Modal state
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);


    // Modal handlers
    const showDetailsModal = async () => {
        setLoadingDetails(true);
        setDetailsModalOpen(true);
        setSelectedCard(null); // Clear previous card while loading

        const response = await apiCallForSpaHelper({
            method: 'GET',
            url: `/api/workspaces/staff/cards/${card.id}`,
            params: {},
            body: {}
        });

        if (response.status === 200) {
            // Store both card and published_data
            setSelectedCard({
                ...response.data.card,
                published_data: response.data.published_data,
                is_published: response.data.is_published
            });
        } else {
            ConsoleLogger.error('Error fetching card details:', response.data);
            toast.error('Error fetching card details');
            setDetailsModalOpen(false);
        }
        setLoadingDetails(false);
    };

    const closeDetailsModal = () => {
        setDetailsModalOpen(false);
        setSelectedCard(null);
        setLoadingDetails(false);
    };

    const handleApproveChanges = async (cardId: number) => {
        const response = await apiCallForSpaHelper({
            method: 'PUT',
            url: `/api/workspaces/staff/cards/approve/${cardId}`,
            params: {},
            body: {
                approved: true,
                reasons: [],
                reasonText: ''
            }
        });

        if (response.status === 200) {
            onRefreshList();
            closeDetailsModal();
            toast.success(response.data.message || 'Updates approved successfully');
        } else {
            toast.error(response.data?.message || 'Error approving update');
        }
    };

    const handleRejectChanges = async (cardId: number) => {
        const response = await apiCallForSpaHelper({
            method: 'PUT',
            url: `/api/workspaces/staff/cards/approve/${cardId}`,
            params: {},
            body: {
                approved: false,
                reasons: ['all'],
                reasonText: 'Rejected by admin'
            }
        });

        if (response.status === 200) {
            onRefreshList();
            closeDetailsModal();
            toast.success(response.data.message || 'Updates rejected successfully');
        } else {
            toast.error(response.data?.message || 'Error rejecting update');
        }
    };

    return (
        <div key={card.id} className="relative p-4 rounded w-full bg-light/50">
            {/* Header with ID and badges */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm bg-slate-200 px-2 py-1 rounded">ID: {card.id}</span>
                    {/* Absolutely positioned store/personal badge */}
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.store_id
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                        {card.store_id ? 'Store' : 'Personal'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {!card.is_approved && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Pending Approval</span>}
                    {card.is_approved && !card.published_data && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Approved (Not Published)</span>}
                    {card.is_approved && card.published_data && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Approved</span>}
                    {card.published_data && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Published</span>}
                    {card.published_data?.is_active && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">Active</span>}
                </div>
            </div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                {/* Column 1 - Title and Price (Latest Updates) */}
                <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                        <h3 className="text-sm font-semibold text-blue-700 mb-2">Latest Updates</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 font-medium">Title</label>
                                <h4 className="text-lg font-semibold text-slate-900 break-words">{card.title || 'No title'}</h4>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 font-medium">Price</label>
                                <div className='text-lg text-slate-900 font-bold'>${card.price || 0}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 2 - Published Title and Price */}
                <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                        <h3 className="text-sm font-semibold text-green-700 mb-2">Published Data</h3>

                        {card.published_data ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 font-medium">Title</label>
                                    <h4 className="text-lg font-semibold text-green-900 break-words">{card.published_data.title || 'No title'}</h4>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 font-medium">Price</label>
                                    <div className='text-lg text-green-800 font-bold'>${card.published_data.price || 0}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-400 italic text-sm">
                                No published data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 3 - Statuses, Store Owner, Card Author Type */}
                <div className="space-y-4">
                    <div className="border-l-4 border-purple-500 pl-4">
                        <h3 className="text-sm font-semibold text-purple-700 mb-2">Status & Details</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 font-medium">Store Owner</label>
                                <div className='text-sm text-slate-700'>{card.store_name || 'Individual User'}</div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 font-medium">Posted Date</label>
                                <div className='text-sm text-slate-700'>{new Date(card.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions - Only Show Details Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                    onClick={showDetailsModal}
                    className={`text-white py-2 px-6 rounded-md transition-colors bg-dark`}
                >
                    {card.has_pending_updates ? 'Review & Approve' : 'Show Details'}
                </button>
            </div>

            {/* Details Modal */}
            <StaffCardDetailsModalWidget
                selectedCard={selectedCard}
                isOpen={detailsModalOpen}
                onClose={closeDetailsModal}
                onApprove={handleApproveChanges}
                onReject={handleRejectChanges}
                loading={loadingDetails}
            />
        </div>
    );
}

