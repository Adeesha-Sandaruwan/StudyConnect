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
  getRequestsBySubject
} from '../controllers/studentRequestController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
import {
  validateStudentRequest,
  validateStudentRequestUpdate,
  validateRequestStatus,
  validateAssignTutor
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllRequests);
router.get('/subject/:subject', getRequestsBySubject);

// Private routes (authenticated users)
router.post('/', protect, validateStudentRequest, createRequest);
router.get('/my-requests', protect, getMyRequests);
router.get('/tutor/assigned', protect, getTutorAssignedRequests);

// Admin routes
router.put('/:id/assign-tutor', protect, admin, validateAssignTutor, assignTutor);

// Request-specific actions
router.put('/:id/status', protect, validateRequestStatus, updateRequestStatus);
router.put('/:id', protect, validateStudentRequestUpdate, updateRequest);
router.delete('/:id', protect, deleteRequest);

// Get single request (last)
router.get('/:id', getRequestById);

export default router;
