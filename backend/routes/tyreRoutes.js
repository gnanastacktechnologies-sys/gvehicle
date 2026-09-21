import express from 'express';
import {
  getTyres,
  createTyreRecord,
  updateTyreRecord,
  deleteTyreRecord,
} from '../controllers/tyreController.js';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', hasPermission('tyres.view'), getTyres);
router.post('/', hasPermission('tyres.create'), createTyreRecord);
router.put('/:id', hasPermission('tyres.edit'), updateTyreRecord);
router.delete('/:id', hasPermission('tyres.delete'), deleteTyreRecord);

export default router;

