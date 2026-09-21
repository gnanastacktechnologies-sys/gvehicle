import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import DataTable from '../../components/common/DataTable';
import VehicleIcon from '../../components/common/VehicleIcon';
import Badge from '../../components/common/Badge';
import StatCard from '../../components/common/StatCard';
import Modal from '../../components/common/Modal';
import { formatKm, formatDate, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaRoute, FaPlayCircle, FaStopCircle, FaExclamationCircle, FaTachometerAlt, FaTrash } from 'react-icons/fa';
import OdometerInputWithScan from '../../components/common/OdometerInputWithScan';


const PersonalTripsPage = () => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Stats
  const [totalPersonalKm, setTotalPersonalKm] = useState(0);

  // Stop Ride Modal State
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [activeTripToStop, setActiveTripToStop] = useState(null);
  const [endOdometer, setEndOdometer] = useState('');
  const [stopNotes, setStopNotes] = useState('');
  const [stopError, setStopError] = useState('');
  const [stopLoading, setStopLoading] = useState(false);

  const { hasPermission, isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchPersonalTrips = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search,
        vehicleId,
        status,
        tripType: 'PERSONAL',
        sortBy: 'startDate',
        sortOrder: 'desc',
      };
      const res = await API.get('/trips', { params });
      setTrips(res.data.data);
      setPagination(res.data.pagination);

      // Compute total personal distance
      const sumKm = res.data.data.reduce((acc, t) => acc + (t.distance || 0), 0);
      setTotalPersonalKm(sumKm);
    } catch (err) {
      console.error('Failed to fetch personal trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await API.get('/vehicles?status=ACTIVE&limit=100');
      setVehicles(res.data.data);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  };

  useEffect(() => {
    fetchPersonalTrips(1);
    fetchVehicles();
  }, [search, vehicleId, status]);

  const handleOpenStop = (trip) => {
    setActiveTripToStop(trip);
    setEndOdometer(trip.startOdometer);
    setStopNotes('');
    setStopError('');
    setStopModalOpen(true);
  };

  const handleStopRideSubmit = async (e) => {
    e.preventDefault();
    setStopError('');

    const endOdoNum = Number(endOdometer);
    if (endOdometer === '' || isNaN(endOdoNum)) {
      setStopError('Please enter a valid ending odometer reading.');
      return;
    }

    if (endOdoNum < activeTripToStop.startOdometer) {
      setStopError(
        `Ending odometer (${endOdoNum} KM) cannot be lower than starting odometer (${activeTripToStop.startOdometer} KM).`
      );
      return;
    }

    try {
      setStopLoading(true);
      await API.put(`/trips/${activeTripToStop._id}/stop`, {
        endOdometer: endOdoNum,
        notes: stopNotes,
      });
      setStopModalOpen(false);
      fetchPersonalTrips(pagination.page);
    } catch (err) {
      console.error('Stop ride error:', err);
      setStopError(err.response?.data?.message || 'Failed to stop ride.');
    } finally {
      setStopLoading(false);
    }
  };

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Are you sure you want to delete this personal trip record?')) return;
    try {
      await API.delete(`/trips/${id}`);
      fetchPersonalTrips(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete trip.');
    }
  };

  const columns = [
    {
      header: 'Date & Time',
      accessor: 'startDate',
      cell: (t) => (
        <div>
          <span className="font-semibold text-slate-800 block text-xs">{formatDateTime(t.startDate)}</span>
          {t.endDate && <span className="text-[10px] text-slate-400">Ended: {formatDateTime(t.endDate)}</span>}
        </div>
      ),
    },
    {
      header: 'Vehicle',
      cell: (t) => (
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <VehicleIcon type={t.vehicle?.vehicleType} className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 block text-xs">{t.vehicle?.vehicleName || 'Vehicle'}</span>
            <span className="font-mono text-[11px] text-slate-500 font-bold">{t.vehicle?.numberPlate}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'User',
      cell: (t) => <span className="text-xs text-slate-700 font-medium">{t.user?.name || 'Driver'}</span>,
    },
    {
      header: 'Personal Purpose',
      accessor: 'purpose',
      cell: (t) => <span className="text-xs text-slate-800 font-medium">{t.purpose}</span>,
    },
    {
      header: 'Start Odo',
      accessor: 'startOdometer',
      cell: (t) => <span className="text-xs font-semibold text-slate-700">{formatKm(t.startOdometer)}</span>,
    },
    {
      header: 'End Odo',
      cell: (t) => (
        <span className="text-xs font-semibold text-slate-700">
          {t.status === 'COMPLETED' ? formatKm(t.endOdometer) : '— In Progress'}
        </span>
      ),
    },
    {
      header: 'Personal Distance',
      cell: (t) => (
        <span className="text-xs font-bold text-amber-600">
          {t.status === 'COMPLETED' ? formatKm(t.distance) : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (t) => <Badge status={t.status} />,
    },
    {
      header: 'Action',
      cell: (t) => (
        <div className="flex items-center space-x-1.5">
          {t.status === 'ACTIVE' && (hasPermission('trips.edit') || isAdmin) && (
            <button
              onClick={() => handleOpenStop(t)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center space-x-1 cursor-pointer"
            >
              <FaStopCircle className="w-3.5 h-3.5" />
              <span>Stop Ride</span>
            </button>
          )}
          {(hasPermission('trips.delete') || isAdmin) && (
            <button
              onClick={() => handleDeleteTrip(t._id)}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Trip Record"
            >
              <FaTrash className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center space-x-2">
            <FaUser className="text-indigo-600" />
            <span>Personal Trips Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Dedicated logs for personal vehicle usage and distance tracking</p>
        </div>

        {hasPermission('trips.create') && (
          <button
            onClick={() => navigate('/trips?action=start&defaultCategory=PERSONAL')}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <FaPlayCircle className="w-4 h-4" />
            <span>Start Personal Ride</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Personal Trips"
          value={pagination.total || 0}
          subtitle="Total personal usage logs recorded"
          icon={FaUser}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Personal KM Travelled"
          value={formatKm(totalPersonalKm)}
          subtitle="Cumulative distance on personal rides"
          icon={FaTachometerAlt}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      <DataTable
        columns={columns}
        data={trips}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchPersonalTrips(p)}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search personal trip purpose..."
        filters={[
          {
            key: 'vehicleId',
            label: 'All Vehicles',
            options: vehicles.map((v) => ({ label: `${v.vehicleName} (${v.numberPlate})`, value: v._id })),
          },
          {
            key: 'status',
            label: 'All Statuses',
            options: [
              { label: 'Active Ride', value: 'ACTIVE' },
              { label: 'Completed', value: 'COMPLETED' },
            ],
          },
        ]}
        filterValues={{ vehicleId, status }}
        onFilterChange={(key, val) => {
          if (key === 'vehicleId') setVehicleId(val);
          if (key === 'status') setStatus(val);
        }}
        emptyMessage="No personal trips recorded."
        renderMobileCard={(t) => (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <VehicleIcon type={t.vehicle?.vehicleType} className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-800">{t.vehicle?.vehicleName}</span>
              </div>
              <Badge status={t.status} />
            </div>
            <p className="text-slate-700 font-medium">{t.purpose}</p>
            <div className="bg-slate-50 p-2.5 rounded-xl space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Start Odo:</span>
                <span className="font-semibold text-slate-800">{formatKm(t.startOdometer)}</span>
              </div>
              {t.status === 'COMPLETED' && (
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span className="text-slate-600 font-bold">Personal Distance:</span>
                  <span className="font-bold text-amber-600">{formatKm(t.distance)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              {t.status === 'ACTIVE' && (hasPermission('trips.edit') || isAdmin) && (
                <button
                  onClick={() => handleOpenStop(t)}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <FaStopCircle className="w-3.5 h-3.5" />
                  <span>Stop Ride</span>
                </button>
              )}
              {(hasPermission('trips.delete') || isAdmin) && (
                <button
                  onClick={() => handleDeleteTrip(t._id)}
                  className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <FaTrash className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        )}
      />

      {/* Stop Ride Modal */}
      <Modal
        isOpen={stopModalOpen}
        onClose={() => setStopModalOpen(false)}
        title="Stop Active Personal Ride"
      >
        <form onSubmit={handleStopRideSubmit} className="space-y-4">
          {stopError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
              <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
              <span>{stopError}</span>
            </div>
          )}

          {activeTripToStop && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-semibold text-slate-800">{activeTripToStop.vehicle?.vehicleName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Personal Purpose:</span>
                <span className="font-semibold text-slate-800">{activeTripToStop.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Starting Odometer:</span>
                <span className="font-semibold text-indigo-600">{formatKm(activeTripToStop.startOdometer)}</span>
              </div>
            </div>
          )}

          <div>
            <OdometerInputWithScan
              label="Ending Odometer Reading (KM) *"
              required
              min={activeTripToStop?.startOdometer || 0}
              value={endOdometer}
              onChange={(e) => setEndOdometer(e.target.value)}
              placeholder="e.g. 154850"
            />
          </div>


          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows="2"
              value={stopNotes}
              onChange={(e) => setStopNotes(e.target.value)}
              placeholder="Comments on personal ride..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStopModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={stopLoading}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 disabled:opacity-50 flex items-center space-x-1.5"
            >
              <FaStopCircle className="w-3.5 h-3.5" />
              <span>{stopLoading ? 'Saving...' : 'Complete Personal Trip'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PersonalTripsPage;
