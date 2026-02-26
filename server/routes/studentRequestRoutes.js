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
import {
  validateStudentRequest,
  validateStudentRequestUpdate,
  validateRequestStatus,
  validateAssignTutor
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// Private routes (authenticated users) - MUST be before generic :id routes
router.post('/', protect, validateStudentRequest, createRequest);
router.get('/my-requests', protect, getMyRequests);
router.get('/tutor/assigned', protect, getTutorAssignedRequests);
router.get('/tutor/available', protect, getAvailableRequests);

// Public routes
router.get('/', getAllRequests);
router.get('/subject/:subject', getRequestsBySubject);

// SPECIFIC ROUTES BEFORE GENERIC :id ROUTES
// Admin only - assign tutor (MUST be before generic /:id routes)
router.put('/:id/assign-tutor', protect, admin, validateAssignTutor, assignTutor);

// Status update (owner or admin only)
router.put('/:id/status', protect, checkOwnerOrAdmin, validateRequestStatus, updateRequestStatus);

// Generic :id routes (update/delete)
// MUST have checkOwnerOrAdmin middleware to verify ownership
router.put('/:id', protect, checkOwnerOrAdmin, validateStudentRequestUpdate, updateRequest);
router.delete('/:id', protect, checkOwnerOrAdmin, deleteRequest);
router.get('/:id', getRequestById);

export default router;
