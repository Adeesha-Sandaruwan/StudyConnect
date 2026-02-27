/**
 * ROUTE ORGANIZATION:
 * 1. Private routes (require authentication) - MUST come first
 * 2. Public routes
 * 3. Special routes with specific parameters (/:id/action)
 * 4. Generic :id routes - MUST come last to avoid conflicts
 */

import express from 'express';
import {
  getAllRequests,
  getMyRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
  assignTutor,
  updateRequestStatus,
  getTutorAssignedRequests,
  getAvailableRequests,
  getRequestsBySubject
} from '../controllers/studentRequestController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
import { checkOwnerOrAdmin } from '../middleware/ownerMiddleware.js';
import { adminOrTutor } from '../middleware/tutorMiddleware.js';
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

// POST /api/student-requests - Create new student request (Students)
router.post('/', protect, validateStudentRequest, createRequest);

// GET /api/student-requests/my-requests - Get student's own requests
router.get('/my-requests', protect, getMyRequests);

// GET /api/student-requests/tutor/assigned - Get tutor's assigned requests (Admin sees all, Tutor sees own)
router.get('/tutor/assigned', protect, adminOrTutor, getTutorAssignedRequests);

// GET /api/student-requests/tutor/available - Get open unassigned requests
router.get('/tutor/available', protect, adminOrTutor, getAvailableRequests);

/**
 * PUBLIC ROUTES
 * No authentication required
 */

// GET /api/student-requests - Get all requests with filters
router.get('/', getAllRequests);

// GET /api/student-requests/subject/:subject - Get requests by subject
router.get('/subject/:subject', getRequestsBySubject);

/**
 * SPECIAL ROUTES (BEFORE generic :id routes)
 * IMPORTANT: Must be before /:id routes!
 */

// PUT /api/student-requests/:id/assign-tutor - Assign tutor (Admin only)
router.put('/:id/assign-tutor', protect, admin, validateAssignTutor, assignTutor);

// PUT /api/student-requests/:id/status - Update status (Admin or Tutor only)
router.put('/:id/status', protect, adminOrTutor, validateRequestStatus, updateRequestStatus);

/**
 * GENERIC :id ROUTES (MUST come last)
 */

// PUT /api/student-requests/:id - Update request (Owner or Admin)
router.put('/:id', protect, checkOwnerOrAdmin, validateStudentRequestUpdate, updateRequest);

// DELETE /api/student-requests/:id - Delete request (Owner or Admin)
router.delete('/:id', protect, checkOwnerOrAdmin, deleteRequest);

// GET /api/student-requests/:id - Get request by ID (Public)
router.get('/:id', getRequestById);

export default router;
