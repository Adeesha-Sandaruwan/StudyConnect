import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getMyRequests, createRequest, updateRequest, deleteRequest, getRequestById } from '../services/studentRequestApi';
import RequestCard from '../components/student/RequestCard';
import RequestForm from '../components/student/RequestForm';
import RequestModal from '../components/student/RequestModal';
import RequestPageShell from '../components/student/RequestPageShell';
import RequestViewTabs from '../components/student/RequestViewTabs';
import Loader from '../components/Loader';

/**
 * StudentRequests Page
 * Display student's own requests with create, edit, delete functionality
 * Features: Create new request, view list with pagination, edit status, delete, filter by status
 */

const StudentRequests = () => {
    const { user } = useContext(AuthContext);
    // State for requests list and pagination
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // State for create/edit modal forms
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null); // For detail/edit modal
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Pagination: track current page and total pages
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRequests, setTotalRequests] = useState(0);
    // Filter: show all requests or filter by status (open, in-progress, completed)
    const [statusTab, setStatusTab] = useState('all');

    const itemsPerPage = 10;

    useEffect(() => {
        loadRequests(); // Fetch requests when page or filters change
    }, [currentPage]);

    // Load student's own requests with pagination
    const loadRequests = async () => {
        setLoading(true);
        setError('');
        try {
            // API call to fetch only this student's requests
            const response = await getMyRequests(currentPage, itemsPerPage);
            setRequests(response.requests || []);
            setTotalPages(response.pagination?.pages || 1);
            setTotalRequests(response.pagination?.total || 0);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load your requests');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle creating a new request
    const handleCreateRequest = async (formData) => {
        setIsSubmitting(true);
        try {
            // Send request to backend API
            const response = await createRequest(formData);
            setShowCreateForm(false); // Close form modal
            setCurrentPage(1); // Reset to first page
            await loadRequests(); // Refresh list
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create request');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete a request (with confirmation)
    const handleDeleteRequest = async (requestId) => {
        if (!window.confirm('Are you sure you want to delete this request?')) return;
        
        try {
            await deleteRequest(requestId);
            await loadRequests(); // Refresh list after deletion
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete request');
        }
    };

    // Update request details (subject, description, schedule, etc)
    const handleUpdateRequest = async (requestId, payload) => {
        try {
            await updateRequest(requestId, payload);
            await loadRequests(); // Refresh list
            setSelectedRequest(null); // Close detail modal
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update request');
        }
    };

    // Open detail modal for a request
    const handleOpenRequest = useCallback(async (request) => {
        try {
            // Fetch full request details (with shared resources, linked lessons, etc)
            const response = await getRequestById(request._id);
            setSelectedRequest(response.request || request);
        } catch {
            // Fallback: show what we already have
            setSelectedRequest(request);
        }
    }, []);

    const handlePreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    // Count requests by status for tab badges (memoized to avoid repeated filter)
    const statusCounts = useMemo(() => ({
        all: requests.length,
        open: requests.filter((r) => r.status === 'open').length,
        'in-progress': requests.filter((r) => r.status === 'in-progress').length,
        completed: requests.filter((r) => r.status === 'completed').length
    }), [requests]);

    // Filter client-side by selected status tab (no extra API call needed)
    const filteredRequests = useMemo(() => {
        if (statusTab === 'all') return requests;
        return requests.filter((request) => request.status === statusTab);
    }, [requests, statusTab]);

    if (user && user.role !== 'student') {
        return <Navigate to={user.role === 'tutor' ? '/tutor-dashboard' : '/admin'} replace />;
    }

    if (loading) return <Loader text="Loading your requests..." />;

    return (
        <RequestPageShell
            badge="📋 My Requests"
            title="Your Tutoring"
            highlight="Requests"
            description="Manage your tutoring requests, track tutor assignments, and monitor request status."
            maxWidth="max-w-6xl"
            headerActions={
                <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1.5 rounded-full bg-white/85 border border-sky-100 text-sky-700 text-xs font-bold">
                        My Requests: {totalRequests}
                    </span>
                    <RequestViewTabs
                        items={[
                            { label: 'My Requests', to: '/student-requests', active: true },
                            { label: 'Browse Requests', to: '/browse-requests', active: false }
                        ]}
                    />
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="px-6 py-3 bg-[#5b7cfa] text-white rounded-xl font-bold hover:bg-[#4a6be0] transition-all hover:-translate-y-0.5 shadow-md flex items-center gap-2"
                    >
                        ✨ Create Request
                    </button>
                </div>
            }
        >

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-sm flex items-start gap-3">
                        <span className="text-lg">⚠️</span>
                        <span className="font-semibold">{error}</span>
                    </div>
                )}

                {/* Create Form Section */}
                {showCreateForm && (
                    <div className="mb-10 bg-white rounded-2xl border border-gray-200 shadow-md p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Create New Request</h2>
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="text-gray-400 hover:text-gray-800 text-2xl"
                            >
                                ✕
                            </button>
                        </div>
                        <RequestForm
                            onSubmit={handleCreateRequest}
                            isLoading={isSubmitting}
                        />
                    </div>
                )}

                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <RequestViewTabs
                        items={[
                            { label: `All (${statusCounts.all})`, active: statusTab === 'all', onClick: () => setStatusTab('all') },
                            { label: `Open (${statusCounts.open})`, active: statusTab === 'open', onClick: () => setStatusTab('open') },
                            { label: `In Progress (${statusCounts['in-progress']})`, active: statusTab === 'in-progress', onClick: () => setStatusTab('in-progress') },
                            { label: `Completed (${statusCounts.completed})`, active: statusTab === 'completed', onClick: () => setStatusTab('completed') }
                        ]}
                    />
                    <span className="px-3 py-1.5 rounded-full bg-white/85 border border-gray-200 text-xs font-semibold text-gray-600">
                        Showing {filteredRequests.length} in this section
                    </span>
                </div>

                {/* Requests Grid */}
                {requests.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Requests Yet</h3>
                        <p className="text-gray-600 mb-6">
                            Create your first tutoring request to get started with finding a tutor.
                        </p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="px-6 py-3 bg-[#5b7cfa] text-white rounded-xl font-bold hover:bg-[#4a6be0] transition-all"
                        >
                            Create Your First Request
                        </button>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                        <div className="text-6xl mb-4">🔎</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Requests in This Section</h3>
                        <p className="text-gray-600">Switch to another tab to see requests in different statuses.</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-5">
                            <p className="text-sm font-semibold text-gray-600">
                                📊 Showing {filteredRequests.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min((currentPage - 1) * itemsPerPage + filteredRequests.length, totalRequests)} of {totalRequests}
                            </p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredRequests.map(request => (
                                <RequestCard
                                    key={request._id}
                                    request={request}
                                    onClick={() => handleOpenRequest(request)}
                                    showActions={true}
                                    onDelete={handleDeleteRequest}
                                />
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-10">
                                <button
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                                        currentPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-[#5b7cfa] text-white hover:bg-[#4a6be0]'
                                    }`}
                                >
                                    ← Previous
                                </button>
                                <span className="text-sm font-semibold text-gray-600">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                                        currentPage === totalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-[#5b7cfa] text-white hover:bg-[#4a6be0]'
                                    }`}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Request Detail Modal */}
                {selectedRequest && (
                    <RequestModal
                        isOpen={!!selectedRequest}
                        request={selectedRequest}
                        onClose={() => setSelectedRequest(null)}
                        onUpdate={handleUpdateRequest}
                        allowEdit={true}
                    />
                )}
        </RequestPageShell>
    );
};

export default StudentRequests;
