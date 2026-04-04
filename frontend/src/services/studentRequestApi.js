import api from './api';

const root = '/student-requests';

/**
 * STUDENT REQUEST API SERVICE
 * Centralized API layer for all student request management endpoints
 * Mirrors backend routes with full filtering, pagination, and role-based access
 */

// ============================================================================
// CORE CRUD OPERATIONS
// ============================================================================

/**
 * Create a new student request
 * @param {Object} payload - {subject, description, gradeLevel, requestType, preferredSchedule, priority}
 * @returns {Object} - Created request with confirmation
 */
export async function createRequest(payload) {
    const { data } = await api.post(root, payload);
    return data;
}

/**
 * Get student's own requests
 * @returns {Object} - {success, requests: []}
 */
export async function getMyRequests() {
    const { data } = await api.get(`${root}/my-requests`);
    return data;
}

/**
 * Get all student requests with advanced filtering and pagination
 * @param {Object} filters - {status, subject, gradeLevel, priority}
 * @param {Number} page - Page number (default: 1)
 * @param {Number} limit - Items per page (default: 10)
 * @returns {Object} - {requests: [], pagination: {total, pages, currentPage}}
 */
export async function getAllRequests(filters = {}, page = 1, limit = 10) {
    const params = {
        ...filters,
        page,
        limit
    };
    const { data } = await api.get(root, { params });
    return data;
}

/**
 * Get single request by ID
 * @param {String} id - Request ID
 * @returns {Object} - {success, request}
 */
export async function getRequestById(id) {
    const { data } = await api.get(`${root}/${id}`);
    return data;
}

/**
 * Update a request (owner or admin only)
 * @param {String} id - Request ID
 * @param {Object} payload - Fields to update
 * @returns {Object} - {success, message, request}
 */
export async function updateRequest(id, payload) {
    const { data } = await api.put(`${root}/${id}`, payload);
    return data;
}

/**
 * Delete a request (owner or admin only)
 * @param {String} id - Request ID
 * @returns {Object} - {success, message}
 */
export async function deleteRequest(id) {
    const { data } = await api.delete(`${root}/${id}`);
    return data;
}

// ============================================================================
// FILTERING & SEARCH OPERATIONS
// ============================================================================

/**
 * Get requests filtered by subject
 * @param {String} subject - Subject name to filter by
 * @param {Number} page - Page number (default: 1)
 * @param {Number} limit - Items per page (default: 10)
 * @returns {Object} - {requests: [], pagination}
 */
export async function getRequestsBySubject(subject, page = 1, limit = 10) {
    const { data } = await api.get(`${root}/subject/${subject}`, {
        params: { page, limit }
    });
    return data;
}

// ============================================================================
// TUTOR-SPECIFIC OPERATIONS
// ============================================================================

/**
 * Get tutor's assigned requests (tutors see own, admins see all)
 * @returns {Object} - {success, requests: []}
 */
export async function getTutorAssignedRequests() {
    const { data } = await api.get(`${root}/tutor/assigned`);
    return data;
}

/**
 * Get open unassigned requests available for tutors
 * @param {Object} filters - {subject, priority, gradeLevel} (optional)
 * @param {Number} page - Page number (default: 1)
 * @param {Number} limit - Items per page (default: 10)
 * @returns {Object} - {requests: [], pagination}
 */
export async function getAvailableRequests(filters = {}, page = 1, limit = 10) {
    const params = {
        ...filters,
        page,
        limit
    };
    const { data } = await api.get(`${root}/tutor/available`, { params });
    return data;
}

/**
 * Tutor accepts an open unassigned request
 * @param {String} requestId - Request ID
 * @returns {Object} - {success, message, request}
 */
export async function acceptRequestAsTutor(requestId) {
    const { data } = await api.put(`${root}/${requestId}/tutor/accept`);
    return data;
}

// ============================================================================
// ADMIN OPERATIONS
// ============================================================================

/**
 * Assign a tutor to a student request (admin only)
 * @param {String} requestId - Request ID
 * @param {String} tutorId - Tutor ID to assign
 * @returns {Object} - {success, message, request}
 */
export async function assignTutor(requestId, tutorId) {
    const { data } = await api.put(`${root}/${requestId}/assign-tutor`, {
        tutorId
    });
    return data;
}

/**
 * Update request status (admin or tutor only)
 * @param {String} requestId - Request ID
 * @param {String} status - New status (open, in-progress, completed, cancelled)
 * @returns {Object} - {success, message, request}
 */
export async function updateRequestStatus(requestId, status) {
    const { data } = await api.put(`${root}/${requestId}/status`, {
        status
    });
    return data;
}

/**
 * Fetch tutor users for admin assignment UI
 * @returns {Object} - {users: []}
 */
export async function getTutorUsers() {
    const { data } = await api.get('/users', {
        params: {
            role: 'tutor',
            page: 1,
            limit: 100
        }
    });
    return data;
}
