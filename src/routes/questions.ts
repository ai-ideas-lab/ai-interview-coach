import { Router } from 'express';
import { questionController } from '../controllers/questionController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Question management
router.post('/', asyncHandler(questionController.createQuestion));
router.get('/', asyncHandler(questionController.getQuestions));
router.get('/:id', asyncHandler(questionController.getQuestion));
router.put('/:id', asyncHandler(questionController.updateQuestion));
router.delete('/:id', asyncHandler(questionController.deleteQuestion));

// Question filtering and search
router.get('/filter', asyncHandler(questionController.filterQuestions));
router.post('/batch', asyncHandler(questionController.createBatchQuestions));

// AI question generation
router.post('/generate', asyncHandler(questionController.generateAIQuestions));

export { router as questionRoutes };