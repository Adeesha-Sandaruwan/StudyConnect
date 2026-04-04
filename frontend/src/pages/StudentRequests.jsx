import { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getMyRequests, createRequest, updateRequest, deleteRequest } from '../services/studentRequestApi';
import RequestCard from '../components/student/RequestCard';
import RequestForm from '../components/student/RequestForm';
import RequestModal from '../components/student/RequestModal';
import Loader from '../components/Loader';

/**
 * StudentRequests Page
 * Display student's own requests with create, edit, delete functionality
 */

const StudentRequests = () => {
    const { user } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getMyRequests();
            setRequests(response.requests || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load your requests');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async (formData) => {
        setIsSubmitting(true);
        try {
            const response = await createRequest(formData);
            setRequests([response.request, ...requests]);
            setShowCreateForm(false);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (!window.confirm('Are you sure you want to delete this request?')) return;
        
        try {
            await deleteRequest(requestId);
            setRequests(requests.filter(r => r._id !== requestId));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete request');
        }
    };

    const handleUpdateRequest = async (requestId, payload) => {
        try {
            await updateRequest(requestId, payload);
            await loadRequests();
            setSelectedRequest(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update request');
        }
    };

    if (user && user.role !== 'student') {
        return <Navigate to={user.role === 'tutor' ? '/tutor-dashboard' : '/admin'} replace />;
    }

    if (loading) return <Loader text="Loading your requests..." />;

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background gradient */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.12),transparent),radial-gradient(ellipse_60%_40%_at_100%_30%,rgba(99,102,241,0.1),transparent)]" />
            
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
                
                {/* Header */}
                <header className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
                            📋 My Requests
                        </p>
                        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                            Your Tutoring{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
                                Requests
                            </span>
                        </h1>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                            Manage your tutoring requests, track tutor assignments, and monitor request status.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="self-start lg:self-auto px-6 py-3 bg-[#5b7cfa] text-white rounded-xl font-bold hover:bg-[#4a6be0] transition-all hover:-translate-y-0.5 shadow-md flex items-center gap-2"
                    >
                        ✨ Create Request
                    </button>
                </header>

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
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {requests.map(request => (
                            <RequestCard
                                key={request._id}
                                request={request}
                                onClick={() => setSelectedRequest(request)}
                                showActions={true}
                                onDelete={handleDeleteRequest}
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
                        onUpdate={handleUpdateRequest}
                    />
                )}
            </div>
        </div>
    );
};

export default StudentRequests;
