import api, { getApiBaseUrl } from './api';

const root = '/student-requests';

// Normalize form payload before sending to backend
// Maps frontend form values to backend schema enum values
function normalizeRequestPayload(payload = {}) {
    const normalized = { ...payload };

    // Align requestType enum with backend model
    if (normalized.requestType === 'once') {
        normalized.requestType = 'one-time'; // 'once' used in form, 'one-time' expected by API
    }

    // Align grade level values with backend enum (Grade 6-12, University)
    if (normalized.gradeLevel === '0' || normalized.gradeLevel === 0 || normalized.gradeLevel === 'Course/University') {
        normalized.gradeLevel = 'University'; // Map numeric 0 and text to 'University'
    } else if (typeof normalized.gradeLevel === 'number') {
        normalized.gradeLevel = `Grade ${normalized.gradeLevel}`; // 10 -> 'Grade 10'
    } else if (typeof normalized.gradeLevel === 'string' && /^\d+$/.test(normalized.gradeLevel)) {
        normalized.gradeLevel = `Grade ${normalized.gradeLevel}`; // '10' -> 'Grade 10'
    }

    // Backend expects only low/medium/high (no 'urgent')
    if (normalized.priority === 'urgent') {
        normalized.priority = 'high'; // Map 'urgent' to 'high'
    }

    // Backend expects preferredSchedule as string[] (not plain string)
    if (typeof normalized.preferredSchedule === 'string') {
        const schedule = normalized.preferredSchedule.trim();
        normalized.preferredSchedule = schedule ? [schedule] : []; // Wrap in array or send empty
    }

    return normalized;
}

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
    const { data } = await api.post(root, normalizeRequestPayload(payload));
    return data;
}

/**
 * Get student's own requests
 * @returns {Object} - {success, requests: []}
 */
export async function getMyRequests(page = 1, limit = 10) {
    const { data } = await api.get(`${root}/my-requests`, {
        params: {
            page,
            limit
        }
    });
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
    const { data } = await api.put(`${root}/${id}`, normalizeRequestPayload(payload));
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
    const payload = tutorId ? { tutorId } : {};
    const { data } = await api.put(`${root}/${requestId}/assign-tutor`, payload);
    return data;
}

/**
 * Update request status (admin or tutor only)
 * @param {String} requestId - Request ID
 * @param {String} status - New status (open, in-progress, completed, rejected)
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

// ============================================================================
// MODULE INTEGRATION — RESOURCE SHARING
// ============================================================================

/**
 * Share a lesson with the student on an assigned request (tutor or admin only)
 * @param {String} requestId - Student request ID
 * @param {String} lessonId  - SubjectContent lesson ID to attach
 * @returns {Object} - {success, message, linkedLessons: []}
 */
export async function shareLesson(requestId, lessonId) {
    const { data } = await api.post(`${root}/${requestId}/resources`, { lessonId });
    return data;
}

/**
 * Remove a previously shared lesson from a request (tutor or admin only)
 * @param {String} requestId  - Student request ID
 * @param {String} lessonId   - SubjectContent lesson ID to detach
 * @returns {Object} - {success, message, linkedLessons: []}
 */
export async function removeSharedLesson(requestId, lessonId) {
    const { data } = await api.delete(`${root}/${requestId}/resources/${lessonId}`);
    return data;
}

/**
 * Share a tutor note and/or PDF directly on the request.
 * @param {String} requestId - Student request ID
 * @param {Object} payload - { title, message }
 * @param {File|null} pdfFile - Optional uploaded PDF
 * @returns {Object} - {success, message, request}
 */
export async function shareCustomResource(requestId, payload = {}, pdfFile = null) {
    const formData = new FormData();

    if (payload.title != null) formData.append('title', payload.title);
    if (payload.message != null) formData.append('message', payload.message);
    if (pdfFile) formData.append('pdf', pdfFile);

    const { data } = await api.post(`${root}/${requestId}/resources/custom`, formData);
    return data;
}

/**
 * Remove a custom shared resource entry by its resource id.
 * @param {String} requestId - Student request ID
 * @param {String} resourceId - Shared resource subdocument ID
 * @returns {Object} - {success, message, request}
 */
export async function removeSharedResource(requestId, resourceId) {
    const { data } = await api.delete(`${root}/${requestId}/resources/shared/${resourceId}`);
    return data;
}

/**
 * Build the protected download URL for a shared request PDF.
 * @param {String} requestId - Student request ID
 * @param {String} resourceId - Shared resource subdocument ID
 * @returns {String}
 */
export function getSharedRequestPdfUrl(requestId, resourceId) {
    const base = getApiBaseUrl();
    const trimmed = base.replace(/\/$/, '');
    return `${trimmed}${root}/${requestId}/resources/shared/${resourceId}/file`;
}
