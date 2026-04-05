import { useState, useCallback } from 'react';
import {
    getAllRequests,
    getMyRequests,
    getTutorAssignedRequests,
    getAvailableRequests,
    createRequest,
    updateRequest,
    deleteRequest,
} from '../services/studentRequestApi';

/**
 * useStudentRequests Custom Hook
 * Manages all student request state and operations
 * Handles: CRUD operations, filtering, pagination, loading/error states
 */

export const useStudentRequests = (mode = 'my-requests') => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRequests, setTotalRequests] = useState(0);

    const [filters, setFilters] = useState({
        subject: '',
        gradeLevel: '',
        priority: [],
        status: [],
    });

    const itemsPerPage = mode === 'admin' ? 15 : 12;

    // Fetch requests based on mode
    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            let response;

            // Build API filters
            const apiFilters = {
                subject: filters.subject || undefined,
                gradeLevel: filters.gradeLevel || undefined,
                priority: filters.priority.length > 0 ? filters.priority[0] : undefined,
                status: filters.status.length > 0 ? filters.status[0] : undefined,
            };

            // Call appropriate API based on mode
            if (mode === 'my-requests') {
                response = await getMyRequests();
            } else if (mode === 'browse') {
                response = await getAllRequests(apiFilters, currentPage, itemsPerPage);
            } else if (mode === 'tutor-assigned') {
                response = await getTutorAssignedRequests();
            } else if (mode === 'tutor-available') {
                response = await getAvailableRequests(apiFilters, currentPage, itemsPerPage);
            } else if (mode === 'admin') {
                response = await getAllRequests(apiFilters, currentPage, itemsPerPage);
            } else {
                response = await getAllRequests(apiFilters, currentPage, itemsPerPage);
            }

            setRequests(response.requests || []);
            setTotalPages(response.pagination?.pages || 1);
            setTotalRequests(response.pagination?.total || 0);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load requests');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, [mode, filters, currentPage, itemsPerPage]);

    // Handle filter changes
    const updateFilters = useCallback((newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    }, []);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFilters({
            subject: '',
            gradeLevel: '',
            priority: [],
            status: [],
        });
        setCurrentPage(1);
    }, []);

    // Pagination helpers
    const goToPreviousPage = useCallback(() => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    }, [currentPage]);

    const goToNextPage = useCallback(() => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    }, [currentPage, totalPages]);

    const goToPage = useCallback((pageNum) => {
        if (pageNum >= 1 && pageNum <= totalPages) {
            setCurrentPage(pageNum);
        }
    }, [totalPages]);

    // CRUD operations
    const addRequest = useCallback(async (formData) => {
        try {
            const response = await createRequest(formData);
            setRequests([response.request, ...requests]);
            return response;
        } catch (err) {
            throw err;
        }
    }, [requests]);

    const modifyRequest = useCallback(async (requestId, formData) => {
        try {
            const response = await updateRequest(requestId, formData);
            setRequests(requests.map(r => r._id === requestId ? response.request : r));
            return response;
        } catch (err) {
            throw err;
        }
    }, [requests]);

    const removeRequest = useCallback(async (requestId) => {
        try {
            await deleteRequest(requestId);
            setRequests(requests.filter(r => r._id !== requestId));
        } catch (err) {
            throw err;
        }
    }, [requests]);

    return {
        // State
        requests,
        loading,
        error,
        filters,
        currentPage,
        totalPages,
        totalRequests,
        itemsPerPage,

        // Fetching
        fetchRequests,

        // Filtering
        updateFilters,
        clearFilters,

        // Pagination
        goToPreviousPage,
        goToNextPage,
        goToPage,

        // CRUD
        addRequest,
        modifyRequest,
        removeRequest,

        // Direct state setters (for manual control if needed)
        setError,
        setFilters,
        setCurrentPage,
    };
};

export default useStudentRequests;
