import { useContext, useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getAllRequests } from '../services/studentRequestApi';
import RequestCard from '../components/student/RequestCard';
import RequestFilters from '../components/student/RequestFilters';
import RequestModal from '../components/student/RequestModal';
import RequestPageShell from '../components/student/RequestPageShell';
import RequestViewTabs from '../components/student/RequestViewTabs';
import Loader from '../components/Loader';

/**
 * BrowseRequests Page
 * Public page for tutors (authenticated) to browse available student requests
 * Supports advanced filtering by subject, grade, priority status
 * Tutors can browse and view request details before accepting
 */

const BrowseRequests = () => {
    const { user } = useContext(AuthContext);
    // State for requests list
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Modal to display request details
    const [selectedRequest, setSelectedRequest] = useState(null);
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRequests, setTotalRequests] = useState(0);

    // Advanced filter state: support multi-select for priority and status
    const [filters, setFilters] = useState({
        subject: '', // Single select: Mathematics, English, Science, etc
        gradeLevel: '', // Single select: Grade 6-12, University
        priority: [], // Multi-select: low, medium, high
        status: [] // Multi-select: open, in-progress, completed, rejected
    });

    const itemsPerPage = 10;

    useEffect(() => {
        loadRequests(); // Reload requests when filters or page changes
    }, [filters, currentPage]);

    // Load requests from public browse endpoint with filters
    const loadRequests = async () => {
        setLoading(true);
        setError('');
        try {
            // Build filter object - API expects single values, not arrays
            const apiFilters = {
                subject: filters.subject || undefined,
                gradeLevel: filters.gradeLevel || undefined,
                priority: filters.priority.length > 0 ? filters.priority[0] : undefined, // API expects single priority
                status: filters.status.length > 0 ? filters.status[0] : undefined,
            };

            // Fetch all public requests with these filters
            const response = await getAllRequests(apiFilters, currentPage, itemsPerPage);
            setRequests(response.requests || []);
            setTotalPages(response.pagination?.pages || 1);
            setTotalRequests(response.pagination?.total || 0);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load requests');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    // Update active filters and reset to page 1
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page on filter change
    };

    // Clear all filters
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

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (loading && requests.length === 0) return <Loader text="Loading requests..." />;

    return (
        <RequestPageShell
            badge="🔍 Browse Requests"
            title="Find Student"
            highlight="Requests"
            description="Browse all available tutoring requests from students. Filter by subject, grade level, and priority to find the perfect match."
            headerActions={
                <RequestViewTabs
                    items={[
                        { label: 'My Requests', to: '/student-requests', active: false },
                        { label: 'Browse Requests', to: '/browse-requests', active: true }
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
                                <div className="text-6xl mb-4">🔎</div>
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
                        allowEdit={false}
                    />
                )}
        </RequestPageShell>
    );
};

export default BrowseRequests;
