import { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getAvailableRequests } from '../services/studentRequestApi';
import RequestCard from '../components/student/RequestCard';
import RequestFilters from '../components/student/RequestFilters';
import RequestModal from '../components/student/RequestModal';
import Loader from '../components/Loader';

/**
 * TutorAvailableRequests Page
 * Browse open unassigned requests available for tutors
 * Supports filtering by subject, priority, gradeLevel
 */

const TutorAvailableRequests = () => {
    const { user } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRequests, setTotalRequests] = useState(0);

    const [filters, setFilters] = useState({
        subject: '',
        gradeLevel: '',
        priority: [],
        status: []
    });

    const itemsPerPage = 12;

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
                status: 'open', // Only show open requests
            };

            const response = await getAvailableRequests(apiFilters, currentPage, itemsPerPage);
            setRequests(response.requests || []);
            setTotalPages(response.pagination?.pages || 1);
            setTotalRequests(response.pagination?.total || 0);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load available requests');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

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

    if (user && user.role !== 'tutor' && user.role !== 'admin') {
        return <Navigate to={user.role === 'student' ? '/student-dashboard' : '/admin'} replace />;
    }

    if (loading && requests.length === 0) return <Loader text="Loading available requests..." />;

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background gradient */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.12),transparent),radial-gradient(ellipse_60%_40%_at_100%_30%,rgba(99,102,241,0.1),transparent)]" />
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
                
                {/* Header */}
                <header className="mb-10">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 mb-2">
                        🎯 Available Requests
                    </p>
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">
                        Find New{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
                            Tutoring Opportunities
                        </span>
                    </h1>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                        Browse unassigned student requests waiting for a tutor. Filter by subject, grade level, and priority to find requests that match your expertise.
                    </p>
                </header>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-sm flex items-start gap-3">
                        <span className="text-lg">⚠️</span>
                        <span className="font-semibold">{error}</span>
                    </div>
                )}

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
                                    📊 Showing {requests.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalRequests)} of {totalRequests} open requests
                                </p>
                            </div>
                        </div>

                        {/* Requests Grid */}
                        {requests.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                                <div className="text-6xl mb-4">🎓</div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Available Requests</h3>
                                <p className="text-gray-600 mb-6">
                                    All requests matching your filters have been assigned. Try adjusting your filters or check back later.
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
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
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

export default TutorAvailableRequests;
