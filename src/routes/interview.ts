import { Router } from 'express';
import { interviewController } from '../controllers/interviewController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Interview session management
router.post('/sessions', asyncHandler(interviewController.createSession));
router.get('/sessions', asyncHandler(interviewController.getUserSessions));
router.get('/sessions/:id', asyncHandler(interviewController.getSession));
router.put('/sessions/:id', asyncHandler(interviewController.updateSession));
router.delete('/sessions/:id', asyncHandler(interviewController.deleteSession));

// Interview questions
router.post('/sessions/:id/questions', asyncHandler(interviewController.addQuestion));
router.get('/sessions/:id/questions', asyncHandler(interviewController.getSessionQuestions));
router.put('/questions/:id', asyncHandler(interviewController.updateQuestion));
router.delete('/questions/:id', asyncHandler(interviewController.deleteQuestion));

// AI interview simulation
router.post('/sessions/:id/start', asyncHandler(interviewController.startInterview));
router.post('/sessions/:id/submit-answer', asyncHandler(interviewController.submitAnswer));
router.post('/sessions/:id/analyze', asyncHandler(interviewController.analyzeAnswer));

// Feedback and scoring
router.post('/sessions/:id/feedback', asyncHandler(interviewController.provideFeedback));
router.get('/sessions/:id/score', asyncHandler(interviewController.getSessionScore));

// Practice sessions
router.post('/practice/:type', asyncHandler(interviewController.createPracticeSession));
router.get('/analytics', asyncHandler(interviewController.getUserAnalytics));

export { router as interviewRoutes };