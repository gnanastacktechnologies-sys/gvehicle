import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import StatCard from '../../components/common/StatCard';
import AlertBanner from '../../components/common/AlertBanner';
import VehicleIcon from '../../components/common/VehicleIcon';
import Badge from '../../components/common/Badge';
import { formatKm, formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import {
  FaCar,
  FaRoute,
  FaGasPump,
  FaExclamationTriangle,
  FaPlayCircle,
  FaStopCircle,
  FaTachometerAlt,
  FaWrench,
  FaPlus,
} from 'react-icons/fa';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, chartRes] = await Promise.all([
        API.get('/dashboard/summary'),
        API.get('/dashboard/charts'),
      ]);
      setSummary(sumRes.data.data);
      setCharts(chartRes.data.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Unable to load dashboard data. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-48 mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl p-4 border border-slate-100"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar & Start Ride Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fleet Overview Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time odometer-based usage & maintenance tracking</p>
        </div>

        {hasPermission('trips.create') && (
          <button
            onClick={() => navigate('/trips?action=start')}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <FaPlayCircle className="w-4 h-4" />
            <span>Start Ride</span>
          </button>
        )}
      </div>

      {error && (
        <AlertBanner type="danger" title="System Error" message={error} />
      )}

      {/* Maintenance Alerts Banner List */}
      {summary?.oilAlerts?.length > 0 && (
        <div className="space-y-2">
          {summary.oilAlerts.map((alert) => (
            <AlertBanner
              key={alert.vehicleId}
              type={alert.status === 'OVERDUE' ? 'danger' : 'warning'}
              title={`Oil Change Alert — ${alert.vehicleName} (${alert.numberPlate})`}
              message={
                alert.status === 'OVERDUE'
                  ? `Engine oil change is OVERDUE by ${Math.abs(alert.kmRemaining)} KM! Current: ${formatKm(
                      alert.currentOdometer
                    )}, Next Threshold: ${formatKm(alert.nextOilChangeOdometer)}.`
                  : `Oil change due soon in ${alert.kmRemaining} KM. Current: ${formatKm(
                      alert.currentOdometer
                    )}, Next Threshold: ${formatKm(alert.nextOilChangeOdometer)}.`
              }
              actionText="View Vehicle"
              onAction={() => navigate(`/vehicles/${alert.vehicleId}`)}
            />
          ))}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Vehicles"
          value={summary?.totalVehicles || 0}
          subtitle={`${summary?.activeVehicles || 0} Active / ${summary?.inactiveVehicles || 0} Inactive`}
          icon={FaCar}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Active Rides"
          value={summary?.activeRides || 0}
          subtitle="Vehicles currently in transit"
          icon={FaRoute}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Total KM Travelled"
          value={formatKm(summary?.totalKmTravelled || 0)}
          subtitle="Accumulated distance recorded"
          icon={FaTachometerAlt}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Total Fuel Cost"
          value={formatCurrency(summary?.totalFuelCost || 0)}
          subtitle={`${summary?.totalFuelQuantity || 0} Litres refuelled`}
          icon={FaGasPump}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Recharts Analytics Graphics */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Fuel Cost Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Monthly Fuel Expense (₹)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.monthlyFuel}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip formatter={(val) => [formatCurrency(val), 'Total Cost']} />
                  <Area type="monotone" dataKey="totalCost" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vehicle-wise Distance Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Top Vehicle Distance (KM)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.vehicleKm}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="vehicleName" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip formatter={(val) => [formatKm(val), 'Distance']} />
                  <Bar dataKey="totalKm" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trips */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">Recent Trips</h3>
            <button
              onClick={() => navigate('/trips')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All
            </button>
          </div>

          {!summary?.recentTrips?.length ? (
            <p className="text-xs text-slate-400 py-4 text-center">No trips recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.recentTrips.map((trip) => (
                <div key={trip._id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-2xs">
                      <VehicleIcon type={trip.vehicle?.vehicleType} className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">{trip.vehicle?.vehicleName || 'Vehicle'}</h4>
                      <p className="text-[11px] text-slate-500">{trip.purpose}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge status={trip.status} />
                    <p className="text-[10px] text-slate-400 mt-1">{formatDate(trip.startDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Fuel Logs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">Recent Fuel Entries</h3>
            <button
              onClick={() => navigate('/fuel')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All
            </button>
          </div>

          {!summary?.recentFuelEntries?.length ? (
            <p className="text-xs text-slate-400 py-4 text-center">No fuel logs recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.recentFuelEntries.map((fuel) => (
                <div key={fuel._id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                      <FaGasPump className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">{fuel.vehicle?.vehicleName}</h4>
                      <p className="text-[11px] text-slate-500">{fuel.quantity} L @ {formatCurrency(fuel.pricePerLitre)}/L</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800">{formatCurrency(fuel.totalAmount)}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(fuel.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
