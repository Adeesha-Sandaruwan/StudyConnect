// server/routes/feedbackRoutes.js
import express from 'express';
import * as controller from '../controllers/feedbackController.js';

const router = express.Router();

router.post('/', controller.createFeedback);
router.get('/', controller.getFeedbacks);
router.get('/:id', controller.getFeedbackById);
router.put('/:id', controller.updateFeedback);
router.delete('/:id', controller.deleteFeedback);

export default router;