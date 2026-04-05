import { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getAllRequests, assignTutor, getTutorUsers, updateRequestStatus } from '../services/studentRequestApi';
import RequestCard from '../components/student/RequestCard';
import RequestFilters from '../components/student/RequestFilters';
import RequestModal from '../components/student/RequestModal';
import Loader from '../components/Loader';

/**
 * AdminRequests Page
 * Admin panel for managing all student requests across the platform
 * View, filter, and assign tutors to requests
 */

const AdminRequests = () => {
    const { user } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [tutors, setTutors] = useState([]);
    const [selectedTutorByRequest, setSelectedTutorByRequest] = useState({});
    const [assigningRequestId, setAssigningRequestId] = useState('');
    const [statusUpdatingRequestId, setStatusUpdatingRequestId] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRequests, setTotalRequests] = useState(0);
    const itemsPerPage = 8;

    const [filters, setFilters] = useState({
        subject: '',
        gradeLevel: '',
        priority: [],
        status: []
    });

    useEffect(() => {
        loadRequests();
    }, [filters, currentPage]);

    const loadRequests = async () => {
        setLoading(true);
        setError('');
        try {
            // Build filter object
            const apiFilters = {
                subject: filters.subject || undefined,
                gradeLevel: filters.gradeLevel || undefined,
                priority: filters.priority.length > 0 ? filters.priority[0] : undefined,
                status: filters.status.length > 0 ? filters.status[0] : undefined,
            };

            const response = await getAllRequests(apiFilters, currentPage, itemsPerPage);
            const nextRequests = response.requests || [];
            setRequests(nextRequests);
            setTotalPages(response.pagination?.pages || 1);
            setTotalRequests(response.pagination?.total || 0);

            setSelectedTutorByRequest((prev) => {
                const next = { ...prev };
                nextRequests.forEach((r) => {
                    if (!(r._id in next)) {
                        next[r._id] = r.assignedTutor?._id || '';
                    }
                });
                return next;
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load requests');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const loadTutors = async () => {
        try {
            const response = await getTutorUsers();
            setTutors(Array.isArray(response.users) ? response.users : []);
        } catch (err) {
            setTutors([]);
        }
    };

    useEffect(() => {
        loadTutors();
    }, []);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({
            subject: '',
            gradeLevel: '',
            priority: [],
            status: []
        });
        setCurrentPage(1);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleAssignTutor = async (requestId) => {
        const tutorId = selectedTutorByRequest[requestId];
        if (!tutorId) {
            setError('Please select a tutor before assigning.');
            return;
        }

        setAssigningRequestId(requestId);
        try {
            await assignTutor(requestId, tutorId);
            setError('');
            setSelectedTutorByRequest((prev) => ({ ...prev, [requestId]: '' }));
            await loadRequests();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to assign tutor');
        } finally {
            setAssigningRequestId('');
        }
    };

    const handleRemoveTutor = async (requestId) => {
        setAssigningRequestId(requestId);
        try {
            await assignTutor(requestId);
            setError('');
            setSelectedTutorByRequest((prev) => ({ ...prev, [requestId]: '' }));
            await loadRequests();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove tutor');
        } finally {
            setAssigningRequestId('');
        }
    };

    const handleUpdateStatus = async (requestId, status) => {
        setStatusUpdatingRequestId(requestId);
        try {
            await updateRequestStatus(requestId, status);
            setError('');
            await loadRequests();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update request status');
        } finally {
            setStatusUpdatingRequestId('');
        }
    };

    const statusButtons = [
        {
            value: 'open',
            label: 'Open',
            className: 'bg-sky-100/65 text-sky-800 border-sky-200 hover:bg-sky-200/70'
        },
        {
            value: 'in-progress',
            label: 'In Progress',
            className: 'bg-amber-100/65 text-amber-800 border-amber-200 hover:bg-amber-200/70'
        },
        {
            value: 'completed',
            label: 'Completed',
            className: 'bg-emerald-100/65 text-emerald-800 border-emerald-200 hover:bg-emerald-200/70'
        },
        {
            value: 'rejected',
            label: 'Rejected',
            className: 'bg-rose-100/65 text-rose-800 border-rose-200 hover:bg-rose-200/70'
        }
    ];

    if (user && user.role !== 'admin') {
        return <Navigate to={user.role === 'tutor' ? '/tutor-dashboard' : '/student-dashboard'} replace />;
    }

    if (loading && requests.length === 0) return <Loader text="Loading all requests..." />;

    const getStatusStats = () => {
        const stats = {
            total: totalRequests,
            open: requests.filter(r => r.status === 'open').length,
            inProgress: requests.filter(r => r.status === 'in-progress').length,
            completed: requests.filter(r => r.status === 'completed').length,
            rejected: requests.filter(r => r.status === 'rejected' || r.status === 'cancelled').length,
        };
        return stats;
    };

    const stats = getStatusStats();

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background gradient */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.12),transparent),radial-gradient(ellipse_60%_40%_at_100%_30%,rgba(99,102,241,0.1),transparent)]" />
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
                
                {/* Header */}
                <header className="mb-10">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 mb-2">
                        ⚙️ Admin Panel
                    </p>
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">
                        Manage All{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
                            Student Requests
                        </span>
                    </h1>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                        View, filter, and manage all student tutoring requests across the platform. Assign tutors and monitor request status.
                    </p>
                </header>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-sm flex items-start gap-3">
                        <span className="text-lg">⚠️</span>
                        <span className="font-semibold">{error}</span>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: 'Total Requests', value: stats.total, icon: '📋', color: 'bg-blue-50 border-blue-200' },
                        { label: 'Open', value: stats.open, icon: '🔵', color: 'bg-blue-50 border-blue-200' },
                        { label: 'In Progress', value: stats.inProgress, icon: '🟡', color: 'bg-amber-50 border-amber-200' },
                        { label: 'Completed', value: stats.completed, icon: '🟢', color: 'bg-emerald-50 border-emerald-200' },
                        { label: 'Rejected', value: stats.rejected, icon: '🔴', color: 'bg-red-50 border-red-200' },
                    ].map((stat, idx) => (
                        <div key={idx} className={`${stat.color} border rounded-xl p-4 text-center`}>
                            <div className="text-2xl mb-1">{stat.icon}</div>
                            <p className="text-xs font-bold text-gray-600 uppercase mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-4">
                    {/* Filters Sidebar */}
                    <aside className="lg:col-span-1">
                        <RequestFilters
                            filters={filters}
                            onFiltersChange={handleFilterChange}
                            onClear={handleClearFilters}
                        />
                    </aside>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {/* Results Header */}
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">
                                    📊 Showing {requests.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalRequests)} of {totalRequests}
                                </p>
                            </div>
                        </div>

                        {/* Requests Grid */}
                        {requests.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                                <div className="text-6xl mb-4">📭</div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Requests Found</h3>
                                <p className="text-gray-600 mb-6">
                                    Try adjusting your filters to find more requests.
                                </p>
                                <button
                                    onClick={handleClearFilters}
                                    className="px-6 py-3 bg-[#5b7cfa] text-white rounded-xl font-bold hover:bg-[#4a6be0] transition-all"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-6 md:grid-cols-2 mb-8">
                                    {requests.map(request => (
                                        <RequestCard
                                            key={request._id}
                                            request={request}
                                            onClick={() => setSelectedRequest(request)}
                                            customActions={
                                                <div className="space-y-3">
                                                    {request.status === 'open' && !request.assignedTutor && (
                                                        <div className="flex gap-2 items-center">
                                                            <select
                                                                value={selectedTutorByRequest[request._id] || ''}
                                                                onChange={(e) => setSelectedTutorByRequest((prev) => ({
                                                                    ...prev,
                                                                    [request._id]: e.target.value
                                                                }))}
                                                                className="flex-1 rounded-lg border border-gray-300 bg-white/70 backdrop-blur-sm px-2 py-2 text-xs font-semibold"
                                                            >
                                                                <option value="">Select tutor</option>
                                                                {tutors.map((tutor) => (
                                                                    <option key={tutor._id} value={tutor._id}>
                                                                        {tutor.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={() => handleAssignTutor(request._id)}
                                                                disabled={assigningRequestId === request._id}
                                                                className="px-3 py-2 rounded-lg text-xs font-bold bg-[#5b7cfa]/90 text-white border border-white/40 backdrop-blur-md shadow-sm hover:bg-[#4a6be0] disabled:opacity-60"
                                                            >
                                                                {assigningRequestId === request._id ? 'Assigning...' : 'Assign'}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {request.assignedTutor && (
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                                                                Tutor Assignment
                                                            </p>
                                                            <div className="flex gap-2 items-center">
                                                                <select
                                                                    value={selectedTutorByRequest[request._id] || request.assignedTutor._id || ''}
                                                                    onChange={(e) => setSelectedTutorByRequest((prev) => ({
                                                                        ...prev,
                                                                        [request._id]: e.target.value
                                                                    }))}
                                                                    className="flex-1 rounded-lg border border-gray-300 bg-white/70 backdrop-blur-sm px-2 py-2 text-xs font-semibold"
                                                                >
                                                                    <option value="">Select tutor</option>
                                                                    {tutors.map((tutor) => (
                                                                        <option key={tutor._id} value={tutor._id}>
                                                                            {tutor.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <button
                                                                    onClick={() => handleAssignTutor(request._id)}
                                                                    disabled={assigningRequestId === request._id}
                                                                    className="px-3 py-2 rounded-lg text-xs font-bold bg-indigo-500/90 text-white border border-white/40 backdrop-blur-md shadow-sm hover:bg-indigo-600 disabled:opacity-60"
                                                                >
                                                                    {assigningRequestId === request._id ? 'Saving...' : 'Change'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRemoveTutor(request._id)}
                                                                    disabled={assigningRequestId === request._id}
                                                                    className="px-3 py-2 rounded-lg text-xs font-bold bg-rose-500/90 text-white border border-white/40 backdrop-blur-md shadow-sm hover:bg-rose-600 disabled:opacity-60"
                                                                >
                                                                    {assigningRequestId === request._id ? 'Removing...' : 'Remove'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="rounded-xl border border-white/40 bg-white/45 backdrop-blur-md p-2.5">
                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600 mb-2">
                                                            Change State
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {statusButtons.map((btn) => {
                                                                const isCurrent = (request.status === 'cancelled' && btn.value === 'rejected') || request.status === btn.value;
                                                                return (
                                                                    <button
                                                                        key={btn.value}
                                                                        onClick={() => handleUpdateStatus(request._id, btn.value)}
                                                                        disabled={isCurrent || statusUpdatingRequestId === request._id}
                                                                        className={`px-2 py-2 rounded-lg text-[11px] font-bold border transition-all backdrop-blur-sm ${btn.className} ${isCurrent ? 'ring-2 ring-slate-300 opacity-95 cursor-default' : ''} ${statusUpdatingRequestId === request._id ? 'opacity-60 cursor-wait' : ''}`}
                                                                    >
                                                                        {statusUpdatingRequestId === request._id ? 'Updating...' : btn.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            }
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-4 mt-10">
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className={`px-3 py-2 rounded-lg font-bold transition-all ${
                                                currentPage === 1
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            First
                                        </button>
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

                                        <div className="flex items-center gap-2">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`w-10 h-10 rounded-lg font-bold transition-all ${
                                                            currentPage === pageNum
                                                                ? 'bg-[#5b7cfa] text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

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
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className={`px-3 py-2 rounded-lg font-bold transition-all ${
                                                currentPage === totalPages
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            Last
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

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

export default AdminRequests;
