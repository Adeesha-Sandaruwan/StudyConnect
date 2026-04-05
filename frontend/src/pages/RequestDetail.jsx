import { useContext, useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getRequestById, updateRequestStatus } from '../services/studentRequestApi';
import StatusBadge from '../components/student/StatusBadge';
import PriorityBadge from '../components/student/PriorityBadge';
import Loader from '../components/Loader';

/**
 * RequestDetail Page
 * Single request detail view with full information and status timeline
 */

const RequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);

    useEffect(() => {
        loadRequest();
    }, [id]);

    const loadRequest = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getRequestById(id);
            setRequest(response.request || response);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load request details');
            setRequest(null);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!window.confirm(`Update status to ${newStatus}?`)) return;

        setStatusUpdating(true);
        try {
            const response = await updateRequestStatus(id, newStatus);
            setRequest(response.request || response);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getGradeLabel = (grade) => {
        if (grade === 0) return 'Course/University Level';
        return `Grade ${grade}`;
    };

    const getStatusTransitions = (currentStatus) => {
        const transitions = {
            open: ['in-progress', 'rejected'],
            'in-progress': ['completed', 'rejected'],
            completed: [],
            rejected: [],
            cancelled: []
        };
        return transitions[currentStatus] || [];
    };

    if (loading) return <Loader text="Loading request details..." />;

    if (!request) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.12),transparent)]" />
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">❌</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Not Found</h3>
                        <p className="text-gray-600 mb-6">The request you're looking for doesn't exist or has been deleted.</p>
                        <button
                            onClick={() => navigate('/browse-requests')}
                            className="px-6 py-3 bg-[#5b7cfa] text-white rounded-xl font-bold hover:bg-[#4a6be0] transition-all"
                        >
                            Back to Requests
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background gradient */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.12),transparent),radial-gradient(ellipse_60%_40%_at_100%_30%,rgba(99,102,241,0.1),transparent)]" />

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
                
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 text-[#5b7cfa] hover:text-[#4a6be0] font-bold transition-colors"
                >
                    ← Go Back
                </button>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-sm flex items-start gap-3">
                        <span className="text-lg">⚠️</span>
                        <span className="font-semibold">{error}</span>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                    
                    {/* Header with Status */}
                    <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-gray-200 p-8">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                            <div className="flex-1">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 mb-2">Request Details</p>
                                <h1 className="text-4xl font-black text-gray-900 mb-3">
                                    {request.subject}
                                </h1>
                                <p className="text-sm text-gray-600 font-semibold">
                                    Request ID: <span className="font-bold text-gray-900 font-mono">{request._id}</span>
                                </p>
                            </div>
                            <StatusBadge status={request.status} className="self-start" />
                        </div>
                    </div>

                    {/* Content Layout */}
                    <div className="grid md:grid-cols-3 gap-8 p-8">
                        
                        {/* Main Content - Left Side */}
                        <div className="md:col-span-2 space-y-8">
                            
                            {/* Request Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">Grade Level</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        🎓 {getGradeLabel(request.gradeLevel)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">Priority</p>
                                    <PriorityBadge priority={request.priority} />
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">Request Type</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {request.requestType === 'one-time' || request.requestType === 'once' ? '📅 One-time Session' : '🔄 Ongoing'}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">Status</p>
                                    <p className="text-lg font-bold text-gray-900 first-letter:uppercase">
                                        {request.status === 'cancelled' ? 'rejected' : request.status.replace('-', ' ')}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="border-t border-gray-100 pt-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    📝 Description
                                </h2>
                                <p className="text-gray-700 font-semibold leading-relaxed text-base">
                                    {request.description}
                                </p>
                            </div>

                            {/* Preferred Schedule */}
                            {request.preferredSchedule && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        🕐 Preferred Schedule
                                    </h3>
                                    <p className="text-gray-700 font-semibold">{request.preferredSchedule}</p>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="border-t border-gray-100 pt-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    📅 Timeline
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-4">
                                        <div className="w-3 h-3 rounded-full bg-[#5b7cfa] mt-2 shrink-0"></div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-700">Created</p>
                                            <p className="text-sm text-gray-600 font-semibold">{formatDate(request.createdAt)}</p>
                                        </div>
                                    </div>
                                    {request.updatedAt && request.updatedAt !== request.createdAt && (
                                        <div className="flex items-start gap-4">
                                            <div className="w-3 h-3 rounded-full bg-sky-500 mt-2 shrink-0"></div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-700">Last Updated</p>
                                                <p className="text-sm text-gray-600 font-semibold">{formatDate(request.updatedAt)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Right Side */}
                        <div className="md:col-span-1 space-y-6">
                            
                            {/* Student Info Card */}
                            {request.student && (
                                <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-6 border border-sky-200">
                                    <p className="text-xs font-bold text-sky-700 uppercase mb-3">📚 Student</p>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-sky-500 to-[#5b7cfa] flex items-center justify-center text-white text-lg font-bold shrink-0">
                                            {request.student.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{request.student.name}</p>
                                            <p className="text-xs text-gray-600 truncate">{request.student.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tutor Assignment Card */}
                            {request.assignedTutor ? (
                                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200">
                                    <p className="text-xs font-bold text-emerald-700 uppercase mb-3">👨‍🏫 Assigned Tutor</p>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                                            {request.assignedTutor.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{request.assignedTutor.name}</p>
                                            <p className="text-xs text-gray-600 truncate">{request.assignedTutor.email}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-dashed border-amber-200">
                                    <p className="text-xs font-bold text-amber-700 uppercase mb-3">🎯 No Tutor Assigned</p>
                                    <p className="text-sm text-amber-700 font-semibold">
                                        Waiting for admin to assign a tutor to this request.
                                    </p>
                                </div>
                            )}

                            {/* Status Update Card (if user is admin/tutor) */}
                            {(user?.role === 'admin' || user?.role === 'tutor') && (
                                <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
                                    <p className="text-xs font-bold text-indigo-700 uppercase mb-4">🔄 Update Status</p>
                                    <div className="space-y-2">
                                        {getStatusTransitions(request.status).map(status => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusChange(status)}
                                                disabled={statusUpdating}
                                                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-all disabled:opacity-70 capitalize"
                                            >
                                                {statusUpdating ? 'Updating...' : `→ ${status.replace('-', ' ')}`}
                                            </button>
                                        ))}
                                        {getStatusTransitions(request.status).length === 0 && (
                                            <p className="text-xs text-indigo-600 font-semibold italic">
                                                No transitions available for {request.status} status.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => navigate('/browse-requests')}
                                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-all text-sm"
                                >
                                    ← Back
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestDetail;
