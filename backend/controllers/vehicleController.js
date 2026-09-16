import Vehicle from '../models/Vehicle.js';
import Trip from '../models/Trip.js';
import FuelEntry from '../models/FuelEntry.js';
import OilChange from '../models/OilChange.js';
import Tyre from '../models/Tyre.js';
import Maintenance from '../models/Maintenance.js';
import { calculateOilStatus, calculateTyreStatus } from '../utils/vehicleUtils.js';
import { logAudit } from '../utils/auditLogger.js';

export const getVehicles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';
    const vehicleType = req.query.vehicleType || '';
    const status = req.query.status || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = {};

    if (search) {
      query.$or = [
        { vehicleName: { $regex: search, $options: 'i' } },
        { numberPlate: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }

    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Vehicle.countDocuments(query),
    ]);

    // Attach computed oil & active ride info to list items
    const vehiclesWithDetails = await Promise.all(
      vehicles.map(async (v) => {
        const vObj = v.toObject();
        vObj.oilStatus = calculateOilStatus(v);
        
        // Check active ride
        const activeRide = await Trip.findOne({ vehicle: v._id, status: 'ACTIVE' }).populate('user', 'name email');
        vObj.activeRide = activeRide || null;
        
        return vObj;
      })
    );

    res.json({
      success: true,
      data: vehiclesWithDetails,
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

export const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const vehicleObj = vehicle.toObject();
    vehicleObj.oilStatus = calculateOilStatus(vehicle);

    // Fetch latest tyres record
    const latestTyres = await Tyre.findOne({ vehicle: vehicle._id }).sort({ installationDate: -1 });
    if (latestTyres) {
      vehicleObj.tyreStatus = calculateTyreStatus(latestTyres);
      vehicleObj.latestTyres = latestTyres;
    } else {
      vehicleObj.tyreStatus = { status: 'NORMAL', daysRemaining: null };
      vehicleObj.latestTyres = null;
    }

    // Active ride check
    const activeRide = await Trip.findOne({ vehicle: vehicle._id, status: 'ACTIVE' }).populate('user', 'name email');
    vehicleObj.activeRide = activeRide || null;

    // Fetch recent histories for tabs
    const [recentTrips, recentFuel, recentOil, recentTyreList, recentMaintenance] = await Promise.all([
      Trip.find({ vehicle: vehicle._id }).sort({ startDate: -1 }).limit(10).populate('user', 'name'),
      FuelEntry.find({ vehicle: vehicle._id }).sort({ date: -1 }).limit(10).populate('user', 'name'),
      OilChange.find({ vehicle: vehicle._id }).sort({ date: -1 }).limit(10).populate('user', 'name'),
      Tyre.find({ vehicle: vehicle._id }).sort({ installationDate: -1 }).limit(10).populate('user', 'name'),
      Maintenance.find({ vehicle: vehicle._id }).sort({ date: -1 }).limit(10).populate('user', 'name'),
    ]);

    vehicleObj.history = {
      trips: recentTrips,
      fuel: recentFuel,
      oil: recentOil,
      tyres: recentTyreList,
      maintenance: recentMaintenance,
    };

    res.json({
      success: true,
      data: vehicleObj,
    });
  } catch (error) {
    next(error);
  }
};

export const createVehicle = async (req, res, next) => {
  try {
    const {
      vehicleName,
      numberPlate,
      vehicleType,
      currentOdometer,
      make,
      model,
      year,
      color,
      engineNumber,
      chassisNumber,
      fuelType,
      engineOilChangeIntervalKm,
      lastOilChangeOdometer,
      lastOilChangeDate,
      tyreInstallationDate,
      tyreReplacementDueDate,
      notes,
      status,
    } = req.body;

    if (!vehicleName || !numberPlate || !vehicleType || currentOdometer === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle Name, Number Plate, Vehicle Type and Current Odometer are required.',
      });
    }

    const existing = await Vehicle.findOne({ numberPlate: numberPlate.toUpperCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A vehicle with this Number Plate already exists.' });
    }

    const currentOdoNum = Number(currentOdometer) || 0;
    const initialLastOilOdo = lastOilChangeOdometer !== undefined ? Number(lastOilChangeOdometer) : currentOdoNum;

    const newVehicle = await Vehicle.create({
      vehicleName,
      numberPlate: numberPlate.toUpperCase().trim(),
      vehicleType,
      currentOdometer: currentOdoNum,
      make,
      model,
      year,
      color,
      engineNumber,
      chassisNumber,
      fuelType,
      engineOilChangeIntervalKm: Number(engineOilChangeIntervalKm) || 5000,
      lastOilChangeOdometer: initialLastOilOdo,
      lastOilChangeDate: lastOilChangeDate || new Date(),
      tyreInstallationDate,
      tyreReplacementDueDate,
      notes,
      status: status || 'ACTIVE',
    });

    await logAudit({
      user: req.user._id,
      action: 'VEHICLE_CREATED',
      module: 'VEHICLES',
      recordId: newVehicle._id,
      newValue: newVehicle,
      notes: `Vehicle ${newVehicle.vehicleName} (${newVehicle.numberPlate}) created.`,
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: newVehicle,
    });
  } catch (error) {
    next(error);
  }
};

export const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const previousValue = vehicle.toObject();

    const allowedFields = [
      'vehicleName',
      'numberPlate',
      'vehicleType',
      'make',
      'model',
      'year',
      'color',
      'engineNumber',
      'chassisNumber',
      'fuelType',
      'engineOilChangeIntervalKm',
      'lastOilChangeOdometer',
      'lastOilChangeDate',
      'tyreInstallationDate',
      'tyreReplacementDueDate',
      'notes',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'numberPlate') {
          vehicle[field] = req.body[field].toUpperCase().trim();
        } else {
          vehicle[field] = req.body[field];
        }
      }
    });

    await vehicle.save();

    await logAudit({
      user: req.user._id,
      action: 'VEHICLE_UPDATED',
      module: 'VEHICLES',
      recordId: vehicle._id,
      previousValue,
      newValue: vehicle.toObject(),
      notes: `Vehicle ${vehicle.vehicleName} updated by ${req.user.name}.`,
    });

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Check if vehicle has an active ride
    const activeRide = await Trip.findOne({ vehicle: vehicle._id, status: 'ACTIVE' });
    if (activeRide) {
      return res.status(400).json({ success: false, message: 'Cannot delete a vehicle while it has an active ride.' });
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    await logAudit({
      user: req.user._id,
      action: 'VEHICLE_DELETED',
      module: 'VEHICLES',
      recordId: req.params.id,
      previousValue: { vehicleName: vehicle.vehicleName, numberPlate: vehicle.numberPlate },
      notes: `Vehicle ${vehicle.vehicleName} (${vehicle.numberPlate}) deleted by ${req.user.name}`,
    });

    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const correctOdometer = async (req, res, next) => {
  try {
    const { newOdometer, reason } = req.body;

    if (newOdometer === undefined || newOdometer < 0) {
      return res.status(400).json({ success: false, message: 'Valid new odometer reading is required.' });
    }

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason for odometer correction is required.' });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const previousOdometer = vehicle.currentOdometer;
    vehicle.currentOdometer = Number(newOdometer);
    await vehicle.save();

    await logAudit({
      user: req.user._id,
      action: 'ODOMETER_CORRECTION',
      module: 'VEHICLES',
      recordId: vehicle._id,
      previousValue: { currentOdometer: previousOdometer },
      newValue: { currentOdometer: Number(newOdometer) },
      notes: `Odometer manually corrected from ${previousOdometer} to ${newOdometer} KM. Reason: ${reason}`,
    });

    res.json({
      success: true,
      message: 'Vehicle odometer corrected successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};
