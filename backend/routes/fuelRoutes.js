import express from 'express';
import {
  getFuelEntries,
  createFuelEntry,
  updateFuelEntry,
  deleteFuelEntry,
} from '../controllers/fuelController.js';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', hasPermission('fuel.view'), getFuelEntries);
router.post('/', hasPermission('fuel.create'), createFuelEntry);
router.put('/:id', hasPermission('fuel.edit'), updateFuelEntry);
router.delete('/:id', hasPermission('fuel.delete'), deleteFuelEntry);

export default router;
