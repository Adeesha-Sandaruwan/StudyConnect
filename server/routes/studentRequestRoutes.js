/**
 * ROUTE ORGANIZATION:
 * 1. Private routes (require authentication) - MUST come first
 * 2. Public routes
 * 3. Special routes with specific parameters (/:id/action)
 * 4. Generic :id routes - MUST come last to avoid conflicts
 */

import express from 'express';
import {
  getAllRequests, // Public: fetch all requests with filters (no email exposed)
  getMyRequests, // Private: fetch student's own requests
  getRequestById, // Private: fetch single request details
  createRequest, // Private: student creates new request
  updateRequest, // Private: student updates their own request
  deleteRequest, // Private: student deletes their own request
  assignTutor, // Admin: assign tutor to request
  acceptRequestByTutor, // Tutor: self-assign to open request
  updateRequestStatus, // Admin/Tutor: change request status
  getTutorAssignedRequests, // Admin/Tutor: view assigned requests
  getAvailableRequests, // Admin/Tutor: browse open unassigned requests
  getRequestsBySubject, // Public: browse requests by subject
  shareLesson, // Tutor/Admin: share existing lesson from module
  removeSharedLesson, // Tutor/Admin: remove shared lesson
  shareCustomResource, // Tutor/Admin: share custom PDF or note
  removeSharedResource, // Tutor/Admin: remove custom shared resource
  downloadSharedResourceFile // Private: student/tutor downloads shared PDF
} from '../controllers/studentRequestController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js'; // JWT authentication
import { admin } from '../middleware/adminMiddleware.js'; // Admin-only gate
import { checkStudentOwner } from '../middleware/ownerMiddleware.js'; // Student ownership check
import { tutor, adminOrTutor } from '../middleware/tutorMiddleware.js'; // Tutor/Admin gates
import {
  validateStudentRequest,
  validateStudentRequestUpdate,
  validateRequestStatus,
  validateAssignTutor
} from '../middleware/validationMiddleware.js';

const router = express.Router();

/**
 * PRIVATE ROUTES (Authenticated Users) 
 * These routes require a valid JWT token via the 'protect' middleware
 * MUST be placed BEFORE generic :id routes to avoid route conflicts
 */

// POST /api/student-requests - Create new student request (Students only)
// Middleware: protect (JWT auth) + validateStudentRequest (body validation)
router.post('/', protect, validateStudentRequest, createRequest);

// GET /api/student-requests/my-requests - Get student's own requests with full details
// Middleware: protect (JWT auth only) - students see their own requests
router.get('/my-requests', protect, getMyRequests);

// GET /api/student-requests/tutor/assigned - Tutor/Admin views assigned requests
// Middleware: protect + adminOrTutor (restrict to tutor/admin roles)
// Tutors see only their own assignments, Admins see all (or filtered by ?tutorId=)
router.get('/tutor/assigned', protect, adminOrTutor, getTutorAssignedRequests);

// GET /api/student-requests/tutor/available - Tutors browse open unassigned requests
// Middleware: protect + adminOrTutor (only tutors/admins can browse for assignment)
router.get('/tutor/available', protect, adminOrTutor, getAvailableRequests);

/**
 * PUBLIC ROUTES
 * No authentication required - anyone can browse open requests
 * IMPORTANT: Email fields are redacted from responses (PII protection)
 */

// GET /api/student-requests - Public: fetch all requests with filters (PII-redacted)
// No auth required - tutors browse requests without authentication
// Returns paginated list with optional filters by subject, grade, priority, status
router.get('/', getAllRequests);

// GET /api/student-requests/subject/:subject - Public: browse by subject (PII-redacted)
// No auth required - tutors can filter requests by specific subject
router.get('/subject/:subject', getRequestsBySubject);

/**
 * SPECIAL ROUTES (BEFORE generic :id routes)
 * IMPORTANT: Must be before /:id routes to avoid conflicts!
 * These are admin assignment/status management and resource sharing endpoints
 */

// PUT /api/student-requests/:id/assign-tutor - Admin assigns/changes tutor (Admin only)
// Middleware: protect + admin + validateAssignTutor
// Sends email notifications to student and both tutors (if reassignment)
router.put('/:id/assign-tutor', protect, admin, validateAssignTutor, assignTutor);

// PUT /api/student-requests/:id/tutor/accept - Tutor self-assigns to open request
// Middleware: protect + tutor (tutors can self-assign to open requests)
// Updates status to in-progress and notifies student
router.put('/:id/tutor/accept', protect, tutor, acceptRequestByTutor);

// PUT /api/student-requests/:id/status - Admin/Tutor updates request status
// Middleware: protect + adminOrTutor + validateRequestStatus
// Valid statuses: open, in-progress, completed, rejected, cancelled
router.put('/:id/status', protect, adminOrTutor, validateRequestStatus, updateRequestStatus);

// POST /api/student-requests/:id/resources - Share existing lesson with student
// Middleware: protect + adminOrTutor
// Tutors can only share their own lessons, admins can share any
router.post('/:id/resources', protect, adminOrTutor, shareLesson);

// POST /api/student-requests/:id/resources/custom - Share PDF and/or note with student
// Middleware: protect + adminOrTutor + upload.single('pdf') (Cloudinary file upload)
// Creates notification and stores resource metadata
router.post('/:id/resources/custom', protect, adminOrTutor, upload.single('pdf'), shareCustomResource);

// GET /api/student-requests/:id/resources/shared/:resourceId/file - Download shared PDF
// Middleware: protect (only owner, tutor, or admin can download)
// Returns PDF file from Cloudinary with proper headers
router.get('/:id/resources/shared/:resourceId/file', protect, downloadSharedResourceFile);

// DELETE /api/student-requests/:id/resources/:lessonId - Remove shared lesson
// Middleware: protect + adminOrTutor
// Removes from both linkedLessons and sharedResources arrays
router.delete('/:id/resources/:lessonId', protect, adminOrTutor, removeSharedLesson);

// DELETE /api/student-requests/:id/resources/shared/:resourceId - Remove custom resource
// Middleware: protect + adminOrTutor
// Removes PDF or note from sharedResources array
router.delete('/:id/resources/shared/:resourceId', protect, adminOrTutor, removeSharedResource);

/**
 * GENERIC :id ROUTES (MUST come last)
 */

// PUT /api/student-requests/:id - Update request (Owner or Admin)
router.put('/:id', protect, checkStudentOwner, validateStudentRequestUpdate, updateRequest);

// DELETE /api/student-requests/:id - Delete request (Owner or Admin)
router.delete('/:id', protect, checkStudentOwner, deleteRequest);

// GET /api/student-requests/:id - Get request by ID (Owner, assigned tutor, or admin)
router.get('/:id', protect, getRequestById);

export default router;
