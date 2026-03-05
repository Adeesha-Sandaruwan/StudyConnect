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
import { protect } from '../middleware/authMiddleware.js';// Import the protect middleware to secure routes
import { admin } from '../middleware/adminMiddleware.js';// Import the admin middleware to restrict access to admin users

const router = express.Router();// Create a new router instance

// Define routes for user registration, login, Google authentication, and logout
// Change these lines to be more standard
router.post('/register', registerUser); // Result: /api/users/register
router.post('/login', loginUser);       // Result: /api/users/login
router.post('/google', googleAuth);
router.post('/logout', logoutUser);
router.get('/me', protect, (req, res) => res.status(200).json({ user: req.user })); // Add this for AuthContext

// Define routes for admin to manage users, protected by both protect and admin middleware
router.get('/', protect, admin, getUsers);
router.get('/:id', protect, admin, getUserById);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);

export default router;