import express from 'express';
import {
  startRide,
  stopRide,
  getTrips,
  getTripById,
  getActiveRideByVehicle,
  deleteTrip,
  updateTrip,
} from '../controllers/tripController.js';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', hasPermission('trips.view'), getTrips);
router.post('/start', hasPermission('trips.create'), startRide);
router.put('/:id/stop', hasPermission('trips.edit'), stopRide);
router.put('/:id', hasPermission('trips.edit'), updateTrip);
router.get('/active/:vehicleId', hasPermission('trips.view'), getActiveRideByVehicle);
router.get('/:id', hasPermission('trips.view'), getTripById);
router.delete('/:id', hasPermission('trips.delete'), deleteTrip);

export default router;
