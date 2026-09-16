import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getPermissionsList,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/permissions', getPermissionsList);

router.get('/', hasPermission('users.view'), getUsers);
router.post('/', hasPermission('users.create'), createUser);
router.get('/:id', hasPermission('users.view'), getUserById);
router.put('/:id', hasPermission('users.edit'), updateUser);
router.delete('/:id', hasPermission('users.delete'), deleteUser);

export default router;
