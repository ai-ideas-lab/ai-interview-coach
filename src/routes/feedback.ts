import { Router } from 'express';
import { feedbackController } from '../controllers/feedbackController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Feedback management
router.post('/', asyncHandler(feedbackController.createFeedback));
router.get('/session/:sessionId', asyncHandler(feedbackController.getSessionFeedbacks));
router.get('/user/:userId', asyncHandler(feedbackController.getUserFeedbacks));
router.put('/:id', asyncHandler(feedbackController.updateFeedback));
router.delete('/:id', asyncHandler(feedbackController.deleteFeedback));

// AI-generated feedback
router.post('/ai-generate', asyncHandler(feedbackController.generateAIFeedback));

export { router as feedbackRoutes };