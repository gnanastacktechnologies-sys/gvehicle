import Trip from '../models/Trip.js';
import FuelEntry from '../models/FuelEntry.js';
import OilChange from '../models/OilChange.js';
import Tyre from '../models/Tyre.js';
import Maintenance from '../models/Maintenance.js';
import Vehicle from '../models/Vehicle.js';

export const getVehicleUsageReport = async (req, res, next) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;

    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.startDate = {};
      if (startDate) dateQuery.startDate.$gte = new Date(startDate);
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        dateQuery.startDate.$lte = d;
      }
    }

    const matchStage = { status: 'COMPLETED', ...dateQuery };
    if (vehicleId) matchStage.vehicle = vehicleId;

    const report = await Trip.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$vehicle',
          totalKm: { $sum: '$distance' },
          totalTrips: { $sum: 1 },
          minStartOdo: { $min: '$startOdometer' },
          maxEndOdo: { $max: '$endOdometer' },
        },
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicleInfo',
        },
      },
      { $unwind: '$vehicleInfo' },
      {
        $project: {
          vehicleName: '$vehicleInfo.vehicleName',
          numberPlate: '$vehicleInfo.numberPlate',
          vehicleType: '$vehicleInfo.vehicleType',
          currentOdometer: '$vehicleInfo.currentOdometer',
          totalKm: 1,
          totalTrips: 1,
          minStartOdo: 1,
          maxEndOdo: 1,
        },
      },
      { $sort: { totalKm: -1 } },
    ]);

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

export const getFuelReport = async (req, res, next) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;

    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.date = {};
      if (startDate) dateQuery.date.$gte = new Date(startDate);
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        dateQuery.date.$lte = d;
      }
    }

    const matchStage = { ...dateQuery };
    if (vehicleId) matchStage.vehicle = vehicleId;

    const report = await FuelEntry.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$vehicle',
          totalLitres: { $sum: '$quantity' },
          totalCost: { $sum: '$totalAmount' },
          avgPricePerLitre: { $avg: '$pricePerLitre' },
          entryCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicleInfo',
        },
      },
      { $unwind: '$vehicleInfo' },
      {
        $project: {
          vehicleName: '$vehicleInfo.vehicleName',
          numberPlate: '$vehicleInfo.numberPlate',
          fuelType: '$vehicleInfo.fuelType',
          totalLitres: 1,
          totalCost: 1,
          avgPricePerLitre: 1,
          entryCount: 1,
        },
      },
      { $sort: { totalCost: -1 } },
    ]);

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceReport = async (req, res, next) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;

    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.date = {};
      if (startDate) dateQuery.date.$gte = new Date(startDate);
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        dateQuery.date.$lte = d;
      }
    }

    const matchStage = { ...dateQuery };
    if (vehicleId) matchStage.vehicle = vehicleId;

    const [generalMaint, oilChanges, tyres] = await Promise.all([
      Maintenance.aggregate([
        { $match: matchStage },
        { $group: { _id: '$vehicle', totalMaintCost: { $sum: '$cost' }, count: { $sum: 1 } } },
      ]),
      OilChange.aggregate([
        { $match: matchStage },
        { $group: { _id: '$vehicle', totalOilCost: { $sum: '$cost' }, count: { $sum: 1 } } },
      ]),
      Tyre.aggregate([
        { $match: startDate || endDate ? { installationDate: dateQuery.date || {} } : {} },
        { $group: { _id: '$vehicle', totalTyreCost: { $sum: '$cost' }, count: { $sum: 1 } } },
      ]),
    ]);

    const vehicles = await Vehicle.find(vehicleId ? { _id: vehicleId } : {});

    const report = vehicles.map((v) => {
      const gMaint = generalMaint.find((item) => item._id.toString() === v._id.toString());
      const oMaint = oilChanges.find((item) => item._id.toString() === v._id.toString());
      const tMaint = tyres.find((item) => item._id.toString() === v._id.toString());

      const generalCost = gMaint?.totalMaintCost || 0;
      const oilCost = oMaint?.totalOilCost || 0;
      const tyreCost = tMaint?.totalTyreCost || 0;
      const totalCost = generalCost + oilCost + tyreCost;

      return {
        vehicleId: v._id,
        vehicleName: v.vehicleName,
        numberPlate: v.numberPlate,
        generalCost,
        oilCost,
        tyreCost,
        totalCost,
        totalRecords: (gMaint?.count || 0) + (oMaint?.count || 0) + (tMaint?.count || 0),
      };
    });

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};
