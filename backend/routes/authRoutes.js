import express from 'express';
import { login, getMe, updatePassword, forgotPasswordReset, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/forgot-password', forgotPasswordReset);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);

export default router;
