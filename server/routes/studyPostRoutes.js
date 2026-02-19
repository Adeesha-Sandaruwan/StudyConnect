import express from 'express';
import { 
  createPost, 
  getPosts, 
  getPostById, 
  updatePost,
  deletePost,
  likePost,
  addComment,
  deleteComment
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

router.route('/:id/like').put(protect, likePost);
router.route('/:id/comment').post(protect, addComment);
router.route('/:postId/comment/:commentId').delete(protect, deleteComment);

export default router;