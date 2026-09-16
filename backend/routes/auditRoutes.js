import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', hasPermission('audit.view'), getAuditLogs);

export default router;
