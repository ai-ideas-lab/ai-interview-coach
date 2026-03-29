import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// User authentication
router.post('/register', asyncHandler(userController.register));
router.post('/login', asyncHandler(userController.login));
router.get('/profile', asyncHandler(userController.getProfile));
router.put('/profile', asyncHandler(userController.updateProfile));

// User preferences
router.put('/preferences', asyncHandler(userController.updatePreferences));
router.get('/preferences', asyncHandler(userController.getPreferences));

// Progress tracking
router.get('/progress', asyncHandler(userController.getProgress));
router.put('/progress/:category', asyncHandler(userController.updateProgress));

export { router as userRoutes };