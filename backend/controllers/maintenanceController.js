import Maintenance from '../models/Maintenance.js';
import Vehicle from '../models/Vehicle.js';
import { logAudit } from '../utils/auditLogger.js';

export const getMaintenanceRecords = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';
    const vehicleId = req.query.vehicleId || '';
    const maintenanceType = req.query.maintenanceType || '';
    const startDateStr = req.query.startDate || '';
    const endDateStr = req.query.endDate || '';
    const sortBy = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = {};
    if (vehicleId) query.vehicle = vehicleId;
    if (maintenanceType) query.maintenanceType = maintenanceType;

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { serviceProvider: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDateStr || endDateStr) {
      query.date = {};
      if (startDateStr) query.date.$gte = new Date(startDateStr);
      if (endDateStr) {
        const d = new Date(endDateStr);
        d.setHours(23, 59, 59, 999);
        query.date.$lte = d;
      }
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Maintenance.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('vehicle', 'vehicleName numberPlate vehicleType currentOdometer')
        .populate('user', 'name email'),
      Maintenance.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: records,
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

export const createMaintenanceRecord = async (req, res, next) => {
  try {
    const {
      vehicleId,
      maintenanceType,
      date,
      odometer,
      description,
      cost,
      serviceProvider,
      nextDueDate,
      nextDueOdometer,
      notes,
    } = req.body;

    if (!vehicleId || odometer === undefined || !description) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle, Odometer, and Description are required.',
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const odoNum = Number(odometer);

    const record = await Maintenance.create({
      vehicle: vehicle._id,
      user: req.user._id,
      maintenanceType: maintenanceType || 'General Service',
      date: date || new Date(),
      odometer: odoNum,
      description: description.trim(),
      cost: Number(cost) || 0,
      serviceProvider: serviceProvider || '',
      nextDueDate: nextDueDate || null,
      nextDueOdometer: nextDueOdometer !== undefined ? Number(nextDueOdometer) : null,
      notes: notes || '',
    });

    if (odoNum > vehicle.currentOdometer) {
      vehicle.currentOdometer = odoNum;
      await vehicle.save();
    }

    await logAudit({
      user: req.user._id,
      action: 'MAINTENANCE_RECORDED',
      module: 'MAINTENANCE',
      recordId: record._id,
      newValue: record,
      notes: `Recorded ${record.maintenanceType} for ${vehicle.vehicleName} (${vehicle.numberPlate}).`,
    });

    const populated = await Maintenance.findById(record._id).populate('vehicle').populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Maintenance record added successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMaintenanceRecord = async (req, res, next) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found.' });
    }

    const previousValue = record.toObject();
    const {
      maintenanceType,
      date,
      odometer,
      description,
      cost,
      serviceProvider,
      nextDueDate,
      nextDueOdometer,
      notes,
    } = req.body;

    if (maintenanceType) record.maintenanceType = maintenanceType;
    if (date) record.date = date;
    if (odometer !== undefined) record.odometer = Number(odometer);
    if (description) record.description = description.trim();
    if (cost !== undefined) record.cost = Number(cost);
    if (serviceProvider !== undefined) record.serviceProvider = serviceProvider;
    if (nextDueDate !== undefined) record.nextDueDate = nextDueDate || null;
    if (nextDueOdometer !== undefined) record.nextDueOdometer = nextDueOdometer !== null ? Number(nextDueOdometer) : null;
    if (notes !== undefined) record.notes = notes;

    await record.save();

    await logAudit({
      user: req.user._id,
      action: 'MAINTENANCE_UPDATED',
      module: 'MAINTENANCE',
      recordId: record._id,
      previousValue,
      newValue: record.toObject(),
      notes: `Updated maintenance record ID ${record._id}`,
    });

    const populated = await Maintenance.findById(record._id).populate('vehicle').populate('user', 'name');

    res.json({
      success: true,
      message: 'Maintenance record updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMaintenanceRecord = async (req, res, next) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found.' });
    }

    await Maintenance.findByIdAndDelete(req.params.id);

    await logAudit({
      user: req.user._id,
      action: 'MAINTENANCE_DELETED',
      module: 'MAINTENANCE',
      recordId: req.params.id,
      notes: `Deleted maintenance record ID ${req.params.id}`,
    });

    res.json({ success: true, message: 'Maintenance record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

