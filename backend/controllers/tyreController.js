import Tyre from '../models/Tyre.js';
import Vehicle from '../models/Vehicle.js';
import { calculateTyreStatus } from '../utils/vehicleUtils.js';
import { logAudit } from '../utils/auditLogger.js';

export const getTyres = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const vehicleId = req.query.vehicleId || '';
    const sortBy = req.query.sortBy || 'installationDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = {};
    if (vehicleId) query.vehicle = vehicleId;

    const skip = (page - 1) * limit;

    const [tyres, total] = await Promise.all([
      Tyre.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('vehicle', 'vehicleName numberPlate vehicleType')
        .populate('user', 'name email'),
      Tyre.countDocuments(query),
    ]);

    const tyresWithStatus = tyres.map((t) => {
      const obj = t.toObject();
      obj.statusDetails = calculateTyreStatus(t);
      return obj;
    });

    res.json({
      success: true,
      data: tyresWithStatus,
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

export const createTyreRecord = async (req, res, next) => {
  try {
    const { vehicleId, installationDate, brand, model, position, quantity, cost, odometer, notes } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ success: false, message: 'Vehicle is required.' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const odoNum = odometer !== undefined && odometer !== null && odometer !== '' ? Number(odometer) : vehicle.currentOdometer;

    const tyreRecord = await Tyre.create({
      vehicle: vehicle._id,
      user: req.user._id,
      installationDate: installationDate || new Date(),
      brand: brand || '',
      model: model || '',
      position: position || 'All Four',
      quantity: Number(quantity) || 4,
      cost: Number(cost) || 0,
      odometer: odoNum,
      notes: notes || '',
    });

    // Update vehicle tyre installation dates & current odometer
    vehicle.tyreInstallationDate = installationDate || new Date();
    if (odoNum > vehicle.currentOdometer) {
      vehicle.currentOdometer = odoNum;
    }
    await vehicle.save();

    await logAudit({
      user: req.user._id,
      action: 'TYRE_RECORD_CREATED',
      module: 'TYRES',
      recordId: tyreRecord._id,
      newValue: tyreRecord,
      notes: `Recorded tyre change (${brand} ${model}) for ${vehicle.vehicleName} (${vehicle.numberPlate}) at Odometer ${odoNum} KM.`,
    });

    const populated = await Tyre.findById(tyreRecord._id).populate('vehicle').populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Tyre record added successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTyreRecord = async (req, res, next) => {
  try {
    const record = await Tyre.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Tyre record not found.' });
    }

    const previousValue = record.toObject();
    const { installationDate, brand, model, position, quantity, cost, odometer, notes } = req.body;

    if (installationDate) record.installationDate = installationDate;
    if (brand) record.brand = brand;
    if (model !== undefined) record.model = model;
    if (position) record.position = position;
    if (quantity !== undefined) record.quantity = Number(quantity);
    if (cost !== undefined) record.cost = Number(cost);
    if (odometer !== undefined) record.odometer = Number(odometer);
    if (notes !== undefined) record.notes = notes;

    await record.save();

    await logAudit({
      user: req.user._id,
      action: 'TYRE_RECORD_UPDATED',
      module: 'TYRES',
      recordId: record._id,
      previousValue,
      newValue: record.toObject(),
      notes: `Updated tyre record ID ${record._id}`,
    });

    const populated = await Tyre.findById(record._id).populate('vehicle').populate('user', 'name');

    res.json({
      success: true,
      message: 'Tyre record updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTyreRecord = async (req, res, next) => {
  try {
    const record = await Tyre.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Tyre record not found.' });
    }

    await Tyre.findByIdAndDelete(req.params.id);

    await logAudit({
      user: req.user._id,
      action: 'TYRE_RECORD_DELETED',
      module: 'TYRES',
      recordId: req.params.id,
      notes: `Deleted tyre record ID ${req.params.id}`,
    });

    res.json({ success: true, message: 'Tyre record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

