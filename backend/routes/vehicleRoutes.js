import express from 'express';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  correctOdometer,
} from '../controllers/vehicleController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { hasPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', hasPermission('vehicles.view'), getVehicles);
router.post('/', hasPermission('vehicles.create'), createVehicle);
router.get('/:id', hasPermission('vehicles.view'), getVehicleById);
router.put('/:id', hasPermission('vehicles.edit'), updateVehicle);
router.delete('/:id', hasPermission('vehicles.delete'), deleteVehicle);
router.post('/:id/odometer-correction', adminOnly, correctOdometer);

export default router;
