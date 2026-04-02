import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';
import {
  getModuleAnnouncements,
  createModuleAnnouncement,
  updateModuleAnnouncement,
  deleteModuleAnnouncement,
} from '../controllers/moduleAnnouncementController.js';

const router = express.Router();

router.get('/', protect, getModuleAnnouncements);
router.post('/', protect, allowRoles('tutor', 'admin'), createModuleAnnouncement);
router.put('/:id', protect, allowRoles('tutor', 'admin'), updateModuleAnnouncement);
router.delete('/:id', protect, allowRoles('tutor', 'admin'), deleteModuleAnnouncement);

export default router;
