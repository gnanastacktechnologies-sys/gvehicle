import express from 'express';
import {
  getOilChanges,
  createOilChange,
  deleteOilChange,
} from '../controllers/oilController.js';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', hasPermission('oil.view'), getOilChanges);
router.post('/', hasPermission('oil.create'), createOilChange);
router.delete('/:id', hasPermission('oil.delete'), deleteOilChange);

export default router;
