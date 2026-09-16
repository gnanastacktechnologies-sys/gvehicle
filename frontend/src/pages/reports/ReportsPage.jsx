import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { formatKm, formatCurrency, formatDate } from '../../utils/formatters';
import { FaRoute, FaGasPump, FaWrench, FaFilter } from 'react-icons/fa';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('usage');
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [usageData, setUsageData] = useState([]);
  const [fuelData, setFuelData] = useState([]);
  const [maintData, setMaintData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = async () => {
    try {
      const res = await API.get('/vehicles?limit=100');
      setVehicles(res.data.data);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = { vehicleId, startDate, endDate };

      if (activeTab === 'usage') {
        const res = await API.get('/reports/usage', { params });
        setUsageData(res.data.data);
      } else if (activeTab === 'fuel') {
        const res = await API.get('/reports/fuel', { params });
        setFuelData(res.data.data);
      } else if (activeTab === 'maintenance') {
        const res = await API.get('/reports/maintenance', { params });
        setMaintData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, vehicleId, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fleet Analytics & Reports</h1>
          <p className="text-xs text-slate-500 mt-1">Fleet usage, fuel spending, and maintenance analytics breakdown</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <FaFilter className="text-indigo-600" />
          <span>Report Filters:</span>
        </div>

        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700"
        >
          <option value="">All Vehicles</option>
          {vehicles.map((v) => (
            <option key={v._id} value={v._id}>
              {v.vehicleName} ({v.numberPlate})
            </option>
          ))}
        </select>

        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <span>Start:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <span>End:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
          />
        </div>

        {(vehicleId || startDate || endDate) && (
          <button
            onClick={() => {
              setVehicleId('');
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-rose-600 hover:underline font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-100">
          {[
            { id: 'usage', label: 'Vehicle Usage & Distance', icon: FaRoute },
            { id: 'fuel', label: 'Fuel Spending', icon: FaGasPump },
            { id: 'maintenance', label: 'Maintenance Breakdown', icon: FaWrench },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-5 py-3.5 text-xs font-semibold border-b-2 transition-all ${
                  active
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 sm:p-6 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Generating report data...</div>
          ) : activeTab === 'usage' ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase">
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Plate</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Total Distance</th>
                  <th className="p-3">Trip Count</th>
                  <th className="p-3">Current Odometer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usageData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-400">
                      No usage data found for selected period.
                    </td>
                  </tr>
                ) : (
                  usageData.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">{row.vehicleName}</td>
                      <td className="p-3 font-mono font-bold text-slate-600">{row.numberPlate}</td>
                      <td className="p-3 text-slate-600">{row.vehicleType}</td>
                      <td className="p-3 font-bold text-emerald-600">{formatKm(row.totalKm)}</td>
                      <td className="p-3 font-semibold text-slate-700">{row.totalTrips}</td>
                      <td className="p-3 font-semibold text-slate-800">{formatKm(row.currentOdometer)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeTab === 'fuel' ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase">
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Plate</th>
                  <th className="p-3">Total Litres</th>
                  <th className="p-3">Total Cost</th>
                  <th className="p-3">Avg Price / Litre</th>
                  <th className="p-3">Refuel Entries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fuelData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-400">
                      No fuel data found for selected period.
                    </td>
                  </tr>
                ) : (
                  fuelData.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">{row.vehicleName}</td>
                      <td className="p-3 font-mono font-bold text-slate-600">{row.numberPlate}</td>
                      <td className="p-3 font-semibold text-slate-700">{row.totalLitres} L</td>
                      <td className="p-3 font-bold text-amber-600">{formatCurrency(row.totalCost)}</td>
                      <td className="p-3 text-slate-600">{formatCurrency(row.avgPricePerLitre)}</td>
                      <td className="p-3 text-slate-700">{row.entryCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase">
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Plate</th>
                  <th className="p-3">General Service</th>
                  <th className="p-3">Oil Changes</th>
                  <th className="p-3">Tyre Expenses</th>
                  <th className="p-3">Total Maintenance Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maintData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-400">
                      No maintenance data found for selected period.
                    </td>
                  </tr>
                ) : (
                  maintData.map((row) => (
                    <tr key={row.vehicleId} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">{row.vehicleName}</td>
                      <td className="p-3 font-mono font-bold text-slate-600">{row.numberPlate}</td>
                      <td className="p-3 text-slate-700">{formatCurrency(row.generalCost)}</td>
                      <td className="p-3 text-slate-700">{formatCurrency(row.oilCost)}</td>
                      <td className="p-3 text-slate-700">{formatCurrency(row.tyreCost)}</td>
                      <td className="p-3 font-bold text-rose-600">{formatCurrency(row.totalCost)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
