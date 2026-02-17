import express from 'express';
import {
  getCurrentProfile,
  createOrUpdateProfile,
  getAllProfiles,
  getPendingProfiles,
  updateProfileStatus
} from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { validateProfile } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public: View all VERIFIED profiles (for search)
router.get('/', getAllProfiles);

// Private: View my own profile
router.get('/me', protect, getCurrentProfile);

// Private: Create/Update my profile
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'nicFront', maxCount: 1 },
    { name: 'nicBack', maxCount: 1 },
    { name: 'certificates', maxCount: 5 }
  ]),
  validateProfile,
  createOrUpdateProfile
);

// Admin Only Routes
router.get('/admin/pending', protect, admin, getPendingProfiles);
router.put('/admin/verify/:id', protect, admin, updateProfileStatus);

export default router;