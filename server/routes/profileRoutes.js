import express from 'express';
import {
  getCurrentProfile,
  createOrUpdateProfile,
  getAllProfiles,
  getPendingProfiles,
  getProfileById,
  updateProfileStatus,
  deleteProfile
} from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';// Import the protect middleware to secure routes
import { admin } from '../middleware/adminMiddleware.js';// Import the admin middleware to restrict access to admin-only routes
import upload from '../middleware/uploadMiddleware.js';// Import the upload middleware to handle file uploads
import { validateProfile } from '../middleware/validationMiddleware.js';// Import the validateProfile middleware to validate incoming profile data

const router = express.Router();// Create a new router instance

router.get('/', getAllProfiles);// Route to get all profiles, accessible to everyone

router.get('/me', protect, getCurrentProfile);// Route to get the current user's profile, protected by the auth middleware


router.post(
  '/',
  protect,// Route to create or update a profile, protected by the auth middleware
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'nicFront', maxCount: 1 },
    { name: 'nicBack', maxCount: 1 },
    { name: 'certificates', maxCount: 5 }
  ]),
  validateProfile,// Validate the incoming profile data before processing
  createOrUpdateProfile
);

router.get('/admin/pending', protect, admin, getPendingProfiles);// Route to get all pending profiles, accessible only to admin users
router.get('/admin/:id', protect, admin, getProfileById);// Route to get a specific profile by ID, accessible only to admin users
router.put('/admin/verify/:id', protect, admin, updateProfileStatus);// Route to update the status of a profile (e.g., verify or reject), accessible only to admin users
router.delete('/admin/:id', protect, admin, deleteProfile);
// Route to delete a profile by ID, accessible only to admin users
export default router;