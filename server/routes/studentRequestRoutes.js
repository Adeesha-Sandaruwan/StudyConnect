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

const router = express.Router();

// Public routes
router.get('/', getAllRequests);
router.get('/subject/:subject', getRequestsBySubject);
router.get('/:id', getRequestById);

// Private routes (authenticated users)
router.post('/', protect, createRequest);
router.get('/my-requests', protect, getMyRequests);
router.put('/:id', protect, updateRequest);
router.delete('/:id', protect, deleteRequest);
router.put('/:id/status', protect, updateRequestStatus);

// Tutor routes
router.get('/tutor/assigned', protect, getTutorAssignedRequests);

// Admin routes
router.put('/:id/assign-tutor', protect, admin, assignTutor);

export default router;
