import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();// Create a new router instance

router.route('/').get(protect, getNotifications);// Route to get notifications for the authenticated user, protected by the auth middleware
router.route('/:id/read').put(protect, markAsRead);
// Route to mark a specific notification as read, protected by the auth middleware

export default router;