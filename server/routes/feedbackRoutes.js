// server/routes/feedbackRoutes.js
import express from 'express';
import * as controller from '../controllers/feedbackController.js';

const router = express.Router();

router.post('/createFeedback', controller.createFeedback);
router.get('/getFeedbacks', controller.getFeedbacks);
router.get('/getFeedback/:id', controller.getFeedbackById);
router.put('/updateFeedback/:id', controller.updateFeedback);
router.delete('/deleteFeedback/:id', controller.deleteFeedback);

export default router;