import OilChange from '../models/OilChange.js';
import Vehicle from '../models/Vehicle.js';
import { calculateOilStatus } from '../utils/vehicleUtils.js';
import { logAudit } from '../utils/auditLogger.js';

export const getOilChanges = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const vehicleId = req.query.vehicleId || '';
    const startDateStr = req.query.startDate || '';
    const endDateStr = req.query.endDate || '';
    const sortBy = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = {};
    if (vehicleId) query.vehicle = vehicleId;

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

    const [changes, total] = await Promise.all([
      OilChange.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('vehicle', 'vehicleName numberPlate vehicleType currentOdometer engineOilChangeIntervalKm')
        .populate('user', 'name email'),
      OilChange.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: changes,
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

export const createOilChange = async (req, res, next) => {
  try {
    const { vehicleId, date, odometer, oilType, oilBrand, quantity, cost, serviceProvider, notes } = req.body;

    if (!vehicleId || odometer === undefined) {
      return res.status(400).json({ success: false, message: 'Vehicle and Odometer reading are required.' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const odoNum = Number(odometer);
    const interval = vehicle.engineOilChangeIntervalKm || 5000;
    const nextOilChangeOdometer = odoNum + interval;

    const oilChange = await OilChange.create({
      vehicle: vehicle._id,
      user: req.user._id,
      date: date || new Date(),
      odometer: odoNum,
      oilType: oilType || 'Synthetic',
      oilBrand: oilBrand || '',
      quantity: Number(quantity) || 0,
      cost: Number(cost) || 0,
      serviceProvider: serviceProvider || '',
      nextOilChangeOdometer,
      notes: notes || '',
    });

    // Update Vehicle Last Oil Change tracking state (without mutating vehicle master currentOdometer)
    vehicle.lastOilChangeOdometer = odoNum;
    vehicle.lastOilChangeDate = date || new Date();
    await vehicle.save();

    await logAudit({
      user: req.user._id,
      action: 'OIL_CHANGE_RECORDED',
      module: 'OIL',
      recordId: oilChange._id,
      newValue: oilChange,
      notes: `Engine oil changed for ${vehicle.vehicleName} (${vehicle.numberPlate}) at ${odoNum} KM. Next due at ${nextOilChangeOdometer} KM.`,
    });

    const populated = await OilChange.findById(oilChange._id).populate('vehicle').populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Oil change recorded successfully',
      data: populated,
      oilStatus: calculateOilStatus(vehicle),
    });
  } catch (error) {
    next(error);
  }
};

export const updateOilChange = async (req, res, next) => {
  try {
    const record = await OilChange.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Oil change record not found.' });
    }

    const previousValue = record.toObject();
    const { date, odometer, oilType, oilBrand, quantity, cost, serviceProvider, notes } = req.body;

    if (date) record.date = date;
    if (odometer !== undefined) {
      record.odometer = Number(odometer);
      const vehicle = await Vehicle.findById(record.vehicle);
      if (vehicle) {
        const interval = vehicle.engineOilChangeIntervalKm || 5000;
        record.nextOilChangeOdometer = record.odometer + interval;
        if (record.odometer > (vehicle.lastOilChangeOdometer || 0)) {
          vehicle.lastOilChangeOdometer = record.odometer;
          vehicle.lastOilChangeDate = record.date;
          await vehicle.save();
        }
      }
    }
    if (oilType) record.oilType = oilType;
    if (oilBrand !== undefined) record.oilBrand = oilBrand;
    if (quantity !== undefined) record.quantity = Number(quantity);
    if (cost !== undefined) record.cost = Number(cost);
    if (serviceProvider !== undefined) record.serviceProvider = serviceProvider;
    if (notes !== undefined) record.notes = notes;

    await record.save();

    await logAudit({
      user: req.user._id,
      action: 'OIL_CHANGE_UPDATED',
      module: 'OIL',
      recordId: record._id,
      previousValue,
      newValue: record.toObject(),
      notes: `Updated oil change record ID ${record._id}`,
    });

    const populated = await OilChange.findById(record._id).populate('vehicle').populate('user', 'name');

    res.json({
      success: true,
      message: 'Oil change record updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOilChange = async (req, res, next) => {
  try {
    const record = await OilChange.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Oil change record not found.' });
    }

    await OilChange.findByIdAndDelete(req.params.id);

    await logAudit({
      user: req.user._id,
      action: 'OIL_CHANGE_DELETED',
      module: 'OIL',
      recordId: req.params.id,
      notes: `Deleted oil change record ID ${req.params.id}`,
    });

    res.json({ success: true, message: 'Oil change record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

