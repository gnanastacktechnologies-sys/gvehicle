import FuelEntry from '../models/FuelEntry.js';
import Vehicle from '../models/Vehicle.js';
import Trip from '../models/Trip.js';
import { logAudit } from '../utils/auditLogger.js';

export const getFuelEntries = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const vehicleId = req.query.vehicleId || '';
    const fuelType = req.query.fuelType || '';
    const startDateStr = req.query.startDate || '';
    const endDateStr = req.query.endDate || '';
    const sortBy = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = {};

    if (vehicleId) query.vehicle = vehicleId;
    if (fuelType) query.fuelType = fuelType;

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

    const [entries, total] = await Promise.all([
      FuelEntry.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('vehicle', 'vehicleName numberPlate vehicleType currentOdometer')
        .populate('user', 'name email'),
      FuelEntry.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: entries,
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

export const createFuelEntry = async (req, res, next) => {
  try {
    const { vehicleId, date, odometer, fuelType, quantity, pricePerLitre, fuelStation, notes } = req.body;

    if (!vehicleId || odometer === undefined || !quantity || pricePerLitre === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle, Odometer, Quantity and Price per Litre are required.',
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const qtyNum = Number(quantity);
    const priceNum = Number(pricePerLitre);
    if (qtyNum <= 0) {
      return res.status(400).json({ success: false, message: 'Fuel quantity must be greater than 0.' });
    }
    if (priceNum < 0) {
      return res.status(400).json({ success: false, message: 'Price per litre cannot be negative.' });
    }

    // Automatically calculate Total Amount
    const totalAmount = Number((qtyNum * priceNum).toFixed(2));
    const odoNum = Number(odometer);

    const fuelEntry = await FuelEntry.create({
      vehicle: vehicle._id,
      user: req.user._id,
      date: date || new Date(),
      odometer: odoNum,
      fuelType: fuelType || vehicle.fuelType || 'Diesel',
      quantity: qtyNum,
      pricePerLitre: priceNum,
      totalAmount,
      fuelStation: fuelStation || '',
      notes: notes || '',
    });

    // Update vehicle odometer if higher
    if (odoNum > vehicle.currentOdometer) {
      vehicle.currentOdometer = odoNum;
      await vehicle.save();
    }

    await logAudit({
      user: req.user._id,
      action: 'FUEL_ADDED',
      module: 'FUEL',
      recordId: fuelEntry._id,
      newValue: fuelEntry,
      notes: `Recorded ${qtyNum}L fuel for ${vehicle.vehicleName} (${vehicle.numberPlate}) totaling ₹${totalAmount}.`,
    });

    const populated = await FuelEntry.findById(fuelEntry._id).populate('vehicle').populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Fuel entry recorded successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFuelEntry = async (req, res, next) => {
  try {
    const entry = await FuelEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Fuel entry not found' });
    }

    const previousValue = entry.toObject();
    const { date, odometer, fuelType, quantity, pricePerLitre, fuelStation, notes } = req.body;

    if (date) entry.date = date;
    if (odometer !== undefined) entry.odometer = Number(odometer);
    if (fuelType) entry.fuelType = fuelType;
    if (quantity !== undefined) entry.quantity = Number(quantity);
    if (pricePerLitre !== undefined) entry.pricePerLitre = Number(pricePerLitre);
    if (fuelStation !== undefined) entry.fuelStation = fuelStation;
    if (notes !== undefined) entry.notes = notes;

    // Recalculate total
    entry.totalAmount = Number((entry.quantity * entry.pricePerLitre).toFixed(2));

    await entry.save();

    await logAudit({
      user: req.user._id,
      action: 'FUEL_UPDATED',
      module: 'FUEL',
      recordId: entry._id,
      previousValue,
      newValue: entry.toObject(),
      notes: `Updated fuel entry ID ${entry._id}`,
    });

    res.json({
      success: true,
      message: 'Fuel entry updated successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFuelEntry = async (req, res, next) => {
  try {
    const entry = await FuelEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Fuel entry not found' });
    }

    await FuelEntry.findByIdAndDelete(req.params.id);

    await logAudit({
      user: req.user._id,
      action: 'FUEL_DELETED',
      module: 'FUEL',
      recordId: req.params.id,
      notes: `Deleted fuel entry ID ${req.params.id}`,
    });

    res.json({ success: true, message: 'Fuel entry deleted successfully' });
  } catch (error) {
    next(error);
  }
};
