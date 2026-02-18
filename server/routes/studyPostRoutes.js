import express from 'express';
import { 
  createPost, 
  getPosts, 
  getPostById, 
  updatePost,
  deletePost 
} from '../controllers/studyPostController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getPosts)
  .post(protect, upload.fields([{ name: 'media', maxCount: 3 }]), createPost);

router.route('/:id')
  .get(getPostById)
  .put(protect, upload.fields([{ name: 'media', maxCount: 3 }]), updatePost)
  .delete(protect, deletePost);

export default router;