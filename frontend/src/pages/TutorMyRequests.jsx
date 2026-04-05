import { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getTutorAssignedRequests } from '../services/studentRequestApi';
import RequestCard from '../components/student/RequestCard';
import RequestModal from '../components/student/RequestModal';
import Loader from '../components/Loader';

/**
 * TutorMyRequests Page
 * Display tutor's assigned requests (read-only view)
 * Shows student info, request details, schedule, and status
 */

const TutorMyRequests = () => {
    const { user } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getTutorAssignedRequests();
            setRequests(response.requests || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load assigned requests');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter requests by status
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
        <div className="min-h-screen relative overflow-hidden">
            {/* Background gradient */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.12),transparent),radial-gradient(ellipse_60%_40%_at_100%_30%,rgba(99,102,241,0.1),transparent)]" />
            
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
                
                {/* Header */}
                <header className="mb-10">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 mb-2">
                        👨‍🏫 My Assignments
                    </p>
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">
                        Assigned{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
                            Tutoring Requests
                        </span>
                    </h1>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                        View all the tutoring requests assigned to you. Update status and communicate with students.
                    </p>
                </header>

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
                                onClick={() => setSelectedRequest(request)}
                            />
                        ))}
                    </div>
                )}

                {/* Request Detail Modal */}
                {selectedRequest && (
                    <RequestModal
                        isOpen={!!selectedRequest}
                        request={selectedRequest}
                        onClose={() => setSelectedRequest(null)}
                        onUpdate={() => {
                            setSelectedRequest(null);
                            loadRequests();
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default TutorMyRequests;
