import express from 'express';
import { getDashboardSummary, getDashboardCharts } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getDashboardSummary);
router.get('/charts', getDashboardCharts);

export default router;
