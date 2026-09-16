import Vehicle from '../models/Vehicle.js';
import Trip from '../models/Trip.js';
import FuelEntry from '../models/FuelEntry.js';
import OilChange from '../models/OilChange.js';
import Tyre from '../models/Tyre.js';
import Maintenance from '../models/Maintenance.js';
import { calculateOilStatus, calculateTyreStatus } from '../utils/vehicleUtils.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const [
      vehicles,
      totalVehicles,
      activeVehicles,
      inactiveVehicles,
      activeRidesCount,
      totalKmAgg,
      totalFuelAgg,
      recentTrips,
      recentFuel,
      recentMaintenance,
      allTyres,
    ] = await Promise.all([
      Vehicle.find({}),
      Vehicle.countDocuments({}),
      Vehicle.countDocuments({ status: 'ACTIVE' }),
      Vehicle.countDocuments({ status: 'INACTIVE' }),
      Trip.countDocuments({ status: 'ACTIVE' }),
      Trip.aggregate([
        { $match: { status: 'COMPLETED' } },
        { $group: { _id: null, totalKm: { $sum: '$distance' } } },
      ]),
      FuelEntry.aggregate([
        { $group: { _id: null, totalCost: { $sum: '$totalAmount' }, totalLitres: { $sum: '$quantity' } } },
      ]),
      Trip.find({}).sort({ startDate: -1 }).limit(5).populate('vehicle', 'vehicleName numberPlate vehicleType').populate('user', 'name'),
      FuelEntry.find({}).sort({ date: -1 }).limit(5).populate('vehicle', 'vehicleName numberPlate').populate('user', 'name'),
      Maintenance.find({}).sort({ date: -1 }).limit(5).populate('vehicle', 'vehicleName numberPlate').populate('user', 'name'),
      Tyre.find({}).populate('vehicle', 'vehicleName numberPlate'),
    ]);

    const totalKmTravelled = totalKmAgg[0]?.totalKm || 0;
    const totalFuelCost = totalFuelAgg[0]?.totalCost || 0;
    const totalFuelQuantity = totalFuelAgg[0]?.totalLitres || 0;

    // Oil Change Alerts calculation
    const oilAlerts = [];
    vehicles.forEach((v) => {
      const oilStatus = calculateOilStatus(v);
      if (oilStatus.status === 'OVERDUE' || oilStatus.status === 'DUE_SOON') {
        oilAlerts.push({
          vehicleId: v._id,
          vehicleName: v.vehicleName,
          numberPlate: v.numberPlate,
          vehicleType: v.vehicleType,
          currentOdometer: v.currentOdometer,
          nextOilChangeOdometer: oilStatus.nextOilChangeOdometer,
          kmRemaining: oilStatus.kmRemaining,
          status: oilStatus.status,
        });
      }
    });

    // Tyre Alerts calculation
    const tyreAlerts = [];
    allTyres.forEach((t) => {
      const tStatus = calculateTyreStatus(t);
      if (tStatus.status === 'OVERDUE' || tStatus.status === 'DUE_SOON') {
        tyreAlerts.push({
          tyreId: t._id,
          vehicleId: t.vehicle?._id,
          vehicleName: t.vehicle?.vehicleName || 'Unknown Vehicle',
          numberPlate: t.vehicle?.numberPlate || '',
          brand: t.brand,
          expectedReplacementDate: t.expectedReplacementDate,
          daysRemaining: tStatus.daysRemaining,
          status: tStatus.status,
        });
      }
    });

    res.json({
      success: true,
      data: {
        totalVehicles,
        activeVehicles,
        inactiveVehicles,
        activeRides: activeRidesCount,
        totalKmTravelled,
        totalFuelCost,
        totalFuelQuantity,
        oilAlertsCount: oilAlerts.length,
        tyreAlertsCount: tyreAlerts.length,
        oilAlerts,
        tyreAlerts,
        recentTrips,
        recentFuelEntries: recentFuel,
        recentMaintenance,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardCharts = async (req, res, next) => {
  try {
    // 1. Vehicle-wise KM travelled
    const vehicleKm = await Trip.aggregate([
      { $match: { status: 'COMPLETED' } },
      {
        $group: {
          _id: '$vehicle',
          totalKm: { $sum: '$distance' },
          tripCount: { $sum: 1 },
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
          totalKm: 1,
          tripCount: 1,
        },
      },
      { $sort: { totalKm: -1 } },
      { $limit: 10 },
    ]);

    // 2. Monthly Fuel Cost & Litres (Last 6 Months)
    const monthlyFuel = await FuelEntry.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          totalCost: { $sum: '$totalAmount' },
          totalLitres: { $sum: '$quantity' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    // Formatter for monthly chart data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlyFuel = monthlyFuel.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      totalCost: item.totalCost,
      totalLitres: item.totalLitres,
    }));

    // 3. Vehicle-wise Fuel Spending
    const vehicleFuel = await FuelEntry.aggregate([
      {
        $group: {
          _id: '$vehicle',
          totalCost: { $sum: '$totalAmount' },
          totalLitres: { $sum: '$quantity' },
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
          totalCost: 1,
          totalLitres: 1,
        },
      },
      { $sort: { totalCost: -1 } },
      { $limit: 8 },
    ]);

    res.json({
      success: true,
      data: {
        vehicleKm,
        monthlyFuel: formattedMonthlyFuel,
        vehicleFuel,
      },
    });
  } catch (error) {
    next(error);
  }
};
