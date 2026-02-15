import express from 'express';
import {
  getCurrentProfile,
  createOrUpdateProfile,
  getAllProfiles
} from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';
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

export default router;