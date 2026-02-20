import express from 'express';
import { 
  createPost, 
  getPosts, 
  getPostById, 
  updatePost,
  deletePost,
  upvotePost,
  downvotePost,
  addAnswer,
  deleteAnswer
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

router.route('/:id/upvote').put(protect, upvotePost);
router.route('/:id/downvote').put(protect, downvotePost);
router.route('/:id/answer').post(protect, addAnswer);
router.route('/:postId/answer/:answerId').delete(protect, deleteAnswer);

export default router;