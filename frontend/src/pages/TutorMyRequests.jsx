import { useContext, useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getTutorAssignedRequests, getRequestById } from '../services/studentRequestApi';
import RequestCard from '../components/student/RequestCard';
import RequestModal from '../components/student/RequestModal';
import TutorResourcePanel from '../components/student/TutorResourcePanel';
import RequestPageShell from '../components/student/RequestPageShell';
import RequestViewTabs from '../components/student/RequestViewTabs';
import Loader from '../components/Loader';

/**
 * TutorMyRequests Page
 * Display tutor's assigned requests (read-only view with resource sharing)
 * Shows student info, request details, schedule, status, shared resources
 * Tutors can share lessons/PDFs/notes with the student from this page
 */

const TutorMyRequests = () => {
    const { user } = useContext(AuthContext);
    // State for assigned request list
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Modal showing full request details and resource sharing panel
    const [selectedRequest, setSelectedRequest] = useState(null);
    // Filter by request status
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        loadRequests(); // Load this tutor's assigned requests on mount
    }, []);

    // Load all requests assigned to this tutor
    const loadRequests = async () => {
        setLoading(true);
        setError('');
        try {
            // API fetches only requests where assignedTutor = this user
            const response = await getTutorAssignedRequests();
            setRequests(response.requests || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load assigned requests');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    // Open a request card: fetch full data (including linkedLessons) then show modal
    const handleOpenRequest = useCallback(async (request) => {
        try {
            // Fetch full request with populated sharedResources and linkedLessons
            const res = await getRequestById(request._id);
            setSelectedRequest(res.request || request);
        } catch {
            setSelectedRequest(request); // Fallback to card data
        }
    }, []);

    // Re-fetch selected request after resource share/remove to update panel state
    const handleResourceUpdate = useCallback(async () => {
        if (!selectedRequest) return;
        try {
            const res = await getRequestById(selectedRequest._id);
            setSelectedRequest(res.request); // Update modal with fresh data
            // Also refresh the list card so resource counts stay accurate
            setRequests((prev) =>
                prev.map((r) => (r._id === selectedRequest._id ? { ...r, ...(res.request || {}) } : r))
            );
        } catch {
            // silently ignore
        }
    }, [selectedRequest]);

    // Client-side filter by status tab (no API call needed)
    const filteredRequests = filterStatus === 'all' 
        ? requests 
        : requests.filter(r => r.status === filterStatus);

    if (user && user.role !== 'tutor' && user.role !== 'admin') {
        return <Navigate to={user.role === 'student' ? '/student-dashboard' : '/admin'} replace />;
    }

    if (loading) return <Loader text="Loading your assigned requests..." />;

    const statusCounts = {
        'open': requests.filter(r => r.status === 'open').length,
        'in-progress': requests.filter(r => r.status === 'in-progress').length,
        'completed': requests.filter(r => r.status === 'completed').length,
        'cancelled': requests.filter(r => r.status === 'cancelled').length,
    };

    return (
        <RequestPageShell
            badge="👨‍🏫 My Assignments"
            title="Assigned"
            highlight="Tutoring Requests"
            description="View all the tutoring requests assigned to you. Update status and communicate with students."
            maxWidth="max-w-6xl"
            headerActions={
                <RequestViewTabs
                    items={[
                        { label: 'Browse Available', to: '/tutor/available-requests', active: false },
                        { label: 'My Assigned', to: '/tutor/my-requests', active: true }
                    ]}
                />
            }
        >

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-sm flex items-start gap-3">
                        <span className="text-lg">⚠️</span>
                        <span className="font-semibold">{error}</span>
                    </div>
                )}

                {/* Status Filter Tabs */}
                {requests.length > 0 && (
                    <div className="mb-8 flex flex-wrap gap-2">
                        {[
                            { value: 'all', label: `All (${requests.length})`, icon: '📋' },
                            { value: 'open', label: `Open (${statusCounts.open})`, icon: '🔵' },
                            { value: 'in-progress', label: `In Progress (${statusCounts['in-progress']})`, icon: '🟡' },
                            { value: 'completed', label: `Completed (${statusCounts.completed})`, icon: '🟢' },
                        ].map(status => (
                            <button
                                key={status.value}
                                onClick={() => setFilterStatus(status.value)}
                                className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-1.5 ${
                                    filterStatus === status.value
                                        ? 'bg-[#5b7cfa] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <span>{status.icon}</span> {status.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Requests Grid */}
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">
                            {requests.length === 0 ? '📭' : '🔍'}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {requests.length === 0 ? 'No Assigned Requests' : 'No Requests in This Status'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {requests.length === 0 
                                ? 'You don\'t have any assigned requests yet. Check available requests to accept new ones.'
                                : 'Try selecting a different status filter.'}
                        </p>
                        {requests.length === 0 && (
                            <a
                                href="/tutor/available-requests"
                                className="inline-block px-6 py-3 bg-[#5b7cfa] text-white rounded-xl font-bold hover:bg-[#4a6be0] transition-all"
                            >
                                Browse Available Requests →
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredRequests.map(request => (
                            <RequestCard
                                key={request._id}
                                request={request}
                                    onClick={() => handleOpenRequest(request)}
                            />
                        ))}
                    </div>
                )}

                    {/* Request Detail Modal with Resource Sharing Panel */}
                    {selectedRequest && (
                        <RequestModal
                            isOpen={!!selectedRequest}
                            request={selectedRequest}
                            onClose={() => setSelectedRequest(null)}
                            onUpdate={() => {
                                setSelectedRequest(null);
                                loadRequests();
                            }}
                            resourcePanel={
                                selectedRequest.assignedTutor ? (
                                    <TutorResourcePanel
                                        requestId={selectedRequest._id}
                                        requestSubject={selectedRequest.subject}
                                        requestGrade={selectedRequest.gradeLevel}
                                        linkedLessons={selectedRequest.linkedLessons || []}
                                        sharedResources={selectedRequest.sharedResources || []}
                                        onUpdate={handleResourceUpdate}
                                    />
                                ) : null
                            }
                        />
                    )}
        </RequestPageShell>
    );
};

export default TutorMyRequests;
