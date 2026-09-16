import express from 'express';
import {
  getMaintenanceRecords,
  createMaintenanceRecord,
  deleteMaintenanceRecord,
} from '../controllers/maintenanceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', hasPermission('maintenance.view'), getMaintenanceRecords);
router.post('/', hasPermission('maintenance.create'), createMaintenanceRecord);
router.delete('/:id', hasPermission('maintenance.delete'), deleteMaintenanceRecord);

export default router;
