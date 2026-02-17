import express from 'express';
import {
  registerUser,
  loginUser,
  googleAuth,
  logoutUser,
  getUsers,
  getUserById,
  deleteUser,
  updateUser
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.post('/', registerUser);
router.post('/auth', loginUser);
router.post('/google', googleAuth);
router.post('/logout', logoutUser);

router.get('/', protect, admin, getUsers);
router.get('/:id', protect, admin, getUserById);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);

export default router;