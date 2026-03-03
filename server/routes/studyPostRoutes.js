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
// Importing the necessary functions from the controller and middleware for authentication and file uploads


const router = express.Router();

router.route('/')
  .get(getPosts)// Retrieves all study posts
  .post(protect, upload.fields([{ name: 'media', maxCount: 3 }]), createPost);// Creates a new study post, protected by authentication and allowing media uploads

router.route('/:id')
  .get(getPostById)// Retrieves a specific study post by its ID
  .put(protect, upload.fields([{ name: 'media', maxCount: 3 }]), updatePost)// Updates a specific study post by its ID, protected by authentication and allowing media uploads
  .delete(protect, deletePost);

router.route('/:id/upvote').put(protect, upvotePost);// Upvotes a specific study post by its ID, protected by authentication
router.route('/:id/downvote').put(protect, downvotePost);// Downvotes a specific study post by its ID, protected by authentication
router.route('/:id/answer').post(protect, addAnswer);// Adds an answer to a specific study post by its ID, protected by authentication
router.route('/:postId/answer/:answerId').delete(protect, deleteAnswer);
// Deletes a specific answer from a study post by its post ID and answer ID, protected by authentication

export default router;