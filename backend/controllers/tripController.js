import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import { logAudit } from '../utils/auditLogger.js';

export const startRide = async (req, res, next) => {
  try {
    const { vehicleId, purpose, tripType, startOdometer, notes } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ success: false, message: 'Please select a vehicle.' });
    }
    if (!purpose || !purpose.trim()) {
      return res.status(400).json({ success: false, message: 'Trip purpose is required. Please select or specify a purpose.' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    if (vehicle.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Cannot start ride for an inactive vehicle.' });
    }

    // Rule 1: Check if vehicle already has an active ride
    const existingActiveTrip = await Trip.findOne({ vehicle: vehicleId, status: 'ACTIVE' }).populate('user', 'name email');
    if (existingActiveTrip) {
      return res.status(400).json({
        success: false,
        message: `This vehicle already has an active ride started by ${existingActiveTrip.user?.name || 'another user'}. Please stop that ride before starting a new one.`,
        activeTrip: existingActiveTrip,
      });
    }

    // Determine start odometer (default to vehicle current odometer)
    const parsedStartOdo = Number(startOdometer);
    const initialStartOdo = startOdometer !== undefined && startOdometer !== null && !isNaN(parsedStartOdo)
      ? parsedStartOdo
      : vehicle.currentOdometer;

    // Rule 3: Prevent starting with start odometer less than vehicle current odometer
    if (initialStartOdo < vehicle.currentOdometer) {
      return res.status(400).json({
        success: false,
        message: `Starting odometer (${initialStartOdo} KM) cannot be lower than vehicle's current odometer (${vehicle.currentOdometer} KM).`,
      });
    }

    const trip = await Trip.create({
      vehicle: vehicle._id,
      user: req.user._id,
      purpose: purpose.trim(),
      tripType: tripType === 'PERSONAL' ? 'PERSONAL' : 'BUSINESS',
      startOdometer: initialStartOdo,
      startDate: new Date(),
      status: 'ACTIVE',
      notes: notes || '',
    });

    logAudit({
      user: req.user._id,
      action: 'TRIP_STARTED',
      module: 'TRIPS',
      recordId: trip._id,
      newValue: { vehicleId: vehicle._id, startOdometer: initialStartOdo, purpose },
      notes: `Started ride for ${vehicle.vehicleName} (${vehicle.numberPlate}) at ${initialStartOdo} KM.`,
    });

    const responseData = {
      ...trip.toObject(),
      vehicle,
      user: { _id: req.user._id, name: req.user.name, email: req.user.email },
    };

    res.status(201).json({
      success: true,
      message: 'Ride started successfully',
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

export const stopRide = async (req, res, next) => {
  try {
    const { endOdometer, notes } = req.body;

    if (endOdometer === undefined || endOdometer === null) {
      return res.status(400).json({ success: false, message: 'Ending odometer reading is required.' });
    }

    const trip = await Trip.findById(req.params.id).populate('vehicle');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    if (trip.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'This trip has already been completed.' });
    }

    const endOdoNum = Number(endOdometer);

    // Rule 2: Ending odometer MUST be >= starting odometer
    if (endOdoNum < trip.startOdometer) {
      return res.status(400).json({
        success: false,
        message: `Ending odometer (${endOdoNum} KM) cannot be lower than starting odometer (${trip.startOdometer} KM).`,
      });
    }

    const distance = endOdoNum - trip.startOdometer;
    const endDate = new Date();

    trip.endOdometer = endOdoNum;
    trip.distance = distance;
    trip.endDate = endDate;
    trip.status = 'COMPLETED';
    if (notes) trip.notes = notes;

    const vehicle = trip.vehicle;
    let prevOdo = vehicle ? vehicle.currentOdometer : 0;

    if (vehicle && endOdoNum > vehicle.currentOdometer) {
      vehicle.currentOdometer = endOdoNum;
      await Promise.all([trip.save(), vehicle.save()]);
    } else {
      await trip.save();
    }

    if (vehicle) {
      logAudit({
        user: req.user._id,
        action: 'TRIP_COMPLETED',
        module: 'TRIPS',
        recordId: trip._id,
        previousValue: { currentOdometer: prevOdo },
        newValue: { currentOdometer: vehicle.currentOdometer, distance, endOdometer: endOdoNum },
        notes: `Completed ride for ${vehicle.vehicleName} (${vehicle.numberPlate}). Distance: ${distance} KM.`,
      });
    }

    const responseData = {
      ...trip.toObject(),
      user: { _id: req.user._id, name: req.user.name, email: req.user.email },
    };

    res.json({
      success: true,
      message: 'Ride completed successfully',
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

export const getTrips = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';
    const vehicleId = req.query.vehicleId || '';
    const userId = req.query.userId || '';
    const status = req.query.status || '';
    const tripType = req.query.tripType || '';
    const startDateStr = req.query.startDate || '';
    const endDateStr = req.query.endDate || '';
    const sortBy = req.query.sortBy || 'startDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = {};

    if (vehicleId) query.vehicle = vehicleId;
    if (userId) query.user = userId;
    if (status) query.status = status;
    if (tripType) query.tripType = tripType;

    if (search) {
      query.purpose = { $regex: search, $options: 'i' };
    }

    if (startDateStr || endDateStr) {
      query.startDate = {};
      if (startDateStr) query.startDate.$gte = new Date(startDateStr);
      if (endDateStr) {
        const d = new Date(endDateStr);
        d.setHours(23, 59, 59, 999);
        query.startDate.$lte = d;
      }
    }

    const skip = (page - 1) * limit;

    const [trips, total] = await Promise.all([
      Trip.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('vehicle', 'vehicleName numberPlate vehicleType currentOdometer')
        .populate('user', 'name email'),
      Trip.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: trips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicle')
      .populate('user', 'name email phone');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    res.json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

export const getActiveRideByVehicle = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ vehicle: req.params.vehicleId, status: 'ACTIVE' })
      .populate('vehicle')
      .populate('user', 'name email');

    res.json({
      success: true,
      data: trip || null,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    await Trip.findByIdAndDelete(req.params.id);

    await logAudit({
      user: req.user._id,
      action: 'TRIP_DELETED',
      module: 'TRIPS',
      recordId: req.params.id,
      notes: `Trip ID ${req.params.id} deleted by ${req.user.name}`,
    });

    res.json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateTrip = async (req, res, next) => {
  try {
    const { purpose, tripType, startOdometer, endOdometer, notes, status } = req.body;
    const trip = await Trip.findById(req.params.id).populate('vehicle');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    if (purpose) trip.purpose = purpose.trim();
    if (tripType) trip.tripType = tripType === 'PERSONAL' ? 'PERSONAL' : 'BUSINESS';
    if (notes !== undefined) trip.notes = notes;
    if (status) trip.status = status;

    if (startOdometer !== undefined && startOdometer !== null && startOdometer !== '') {
      trip.startOdometer = Number(startOdometer);
    }

    if (endOdometer !== undefined && endOdometer !== null && endOdometer !== '') {
      const endOdoNum = Number(endOdometer);
      if (endOdoNum < trip.startOdometer) {
        return res.status(400).json({
          success: false,
          message: `Ending odometer (${endOdoNum} KM) cannot be lower than starting odometer (${trip.startOdometer} KM).`,
        });
      }
      trip.endOdometer = endOdoNum;
      trip.distance = endOdoNum - trip.startOdometer;
      trip.status = 'COMPLETED';

      // Update vehicle current odometer if higher
      if (trip.vehicle && endOdoNum > trip.vehicle.currentOdometer) {
        const vehicle = await Vehicle.findById(trip.vehicle._id);
        if (vehicle) {
          vehicle.currentOdometer = endOdoNum;
          await vehicle.save();
        }
      }
    }

    await trip.save();

    await logAudit({
      user: req.user._id,
      action: 'TRIP_UPDATED',
      module: 'TRIPS',
      recordId: trip._id,
      notes: `Trip ${trip._id} updated by ${req.user.name}`,
    });

    const updatedTrip = await Trip.findById(trip._id).populate('vehicle').populate('user', 'name email');

    res.json({
      success: true,
      message: 'Trip updated successfully',
      data: updatedTrip,
    });
  } catch (error) {
    next(error);
  }
};
