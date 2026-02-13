import express from 'express';
import {
  loginUser,
  registerUser,
  logoutUser,
  googleAuth
} from '../controllers/authController.js';

const router = express.Router();

router.post('/', registerUser);
router.post('/auth', loginUser);
router.post('/google', googleAuth);
router.post('/logout', logoutUser);

export default router;