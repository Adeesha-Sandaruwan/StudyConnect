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
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { validateProfile } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.get('/', getAllProfiles);

router.get('/me', protect, getCurrentProfile);

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

router.get('/admin/pending', protect, admin, getPendingProfiles);
router.get('/admin/:id', protect, admin, getProfileById);
router.put('/admin/verify/:id', protect, admin, updateProfileStatus);
router.delete('/admin/:id', protect, admin, deleteProfile);

export default router;