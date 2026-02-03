'use client';

import {
  useState,
  useEffect
} from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-toastify';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
interface Application {
  id: number;
  Provider_name: string;
  contact_name: string;
  email: string;
  phone: string;
  voen: string;
  Provider_address: string;
  created_at: string;
}

export function StaffProvidersApplicationsListWidget() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const pageSize = 10;

  const params = useParams();
  const workspaceId = params.workspaceId as string;

  // Fetch applications
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/staff/${workspaceId}/providers/applications?page=${currentPage}&pageSize=${pageSize}&search=${searchTerm}`);
      const data = await response.json();

      if (response.ok) {
        setApplications(data.applications || []);
        setTotalPages(Math.ceil((data.total || 0) / pageSize));
      } else {
        toast.error(data.error || 'Failed to fetch applications');
      }
    } catch (error) {
      ConsoleLogger.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [currentPage, searchTerm]);

  // Handle approval
  const handleApprove = async (applicationId: number) => {
    setProcessingId(applicationId);
    try {
      const response = await fetch(`/api/workspaces/staff/${workspaceId}/providers/applications/update/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved: true }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Application approved successfully');
        fetchApplications(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to approve application');
      }
    } catch (error) {
      ConsoleLogger.error('Error approving application:', error);
      toast.error('Failed to approve application');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle rejection
  const handleReject = async () => {
    if (!selectedApplication || !rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessingId(selectedApplication.id);
    try {
      const response = await fetch(`/api/workspaces/staff/${workspaceId}/providers/applications/update/${selectedApplication.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved: false,
          reason: rejectReason.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Application rejected successfully');
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedApplication(null);
        fetchApplications(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to reject application');
      }
    } catch (error) {
      ConsoleLogger.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (application: Application) => {
    setSelectedApplication(application);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectReason('');
    setSelectedApplication(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Provider Applications</h2>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="p-6">
        {loading ? <GlobalLoaderTile message="Loading applications..." /> : applications.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">There are no educational organization applications to review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Application Info */}
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{application.Provider_name}</h3>
                        <p className="text-sm text-gray-600">Contact: {application.contact_name}</p>
                        <p className="text-sm text-gray-600">Email: {application.email}</p>
                        <p className="text-sm text-gray-600">Phone: {application.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">VOEN: {application.voen}</p>
                        <p className="text-sm text-gray-600">Address: {application.Provider_address}</p>
                        <p className="text-sm text-gray-500">Applied: {formatDate(application.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                    <button
                      onClick={() => handleApprove(application.id)}
                      disabled={processingId === application.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {processingId === application.id ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        'Approve'
                      )}
                    </button>

                    <button
                      onClick={() => openRejectModal(application)}
                      disabled={processingId === application.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="px-3 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Application: {selectedApplication?.Provider_name}
            </h3>

            <div className="mb-4">
              <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection *
              </label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a clear reason for rejecting this application..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeRejectModal}
                disabled={processingId === selectedApplication?.id}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === selectedApplication?.id || !rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processingId === selectedApplication?.id ? 'Processing...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

