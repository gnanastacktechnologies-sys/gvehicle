import express from 'express';
import {
  getVehicleUsageReport,
  getFuelReport,
  getMaintenanceReport,
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(hasPermission('reports.view'));

router.get('/usage', getVehicleUsageReport);
router.get('/fuel', getFuelReport);
router.get('/maintenance', getMaintenanceReport);

export default router;
