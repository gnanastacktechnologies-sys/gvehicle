import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import VehicleIcon from '../../components/common/VehicleIcon';
import Badge from '../../components/common/Badge';
import { formatKm, formatDate, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { FaPlayCircle, FaStopCircle, FaExclamationCircle, FaPlus, FaUser, FaBriefcase, FaEdit, FaTrash } from 'react-icons/fa';
import OdometerInputWithScan from '../../components/common/OdometerInputWithScan';
import { useToast } from '../../context/ToastContext';


const TripsListPage = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [vehicleId, setVehicleId] = useState(searchParams.get('vehicleId') || '');
  const [status, setStatus] = useState('');
  const [tripTypeFilter, setTripTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Start Ride Modal State
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [startVehicleId, setStartVehicleId] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [startOdometer, setStartOdometer] = useState(0);
  const [purpose, setPurpose] = useState('');
  const [tripType, setTripType] = useState('BUSINESS');
  const [startNotes, setStartNotes] = useState('');
  const [startError, setStartError] = useState('');
  const [startLoading, setStartLoading] = useState(false);

  // Stop Ride Modal State
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [activeTripToStop, setActiveTripToStop] = useState(null);
  const [endOdometer, setEndOdometer] = useState('');
  const [stopNotes, setStopNotes] = useState('');
  const [stopError, setStopError] = useState('');
  const [stopLoading, setStopLoading] = useState(false);

  // Edit Trip Modal State
  const [editTripModalOpen, setEditTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [editFormData, setEditFormData] = useState({
    purpose: '',
    tripType: 'BUSINESS',
    startOdometer: 0,
    endOdometer: '',
    notes: '',
  });
  const [editTripError, setEditTripError] = useState('');
  const [editTripLoading, setEditTripLoading] = useState(false);

  const { hasPermission, isAdmin } = useAuth();

  const fetchTrips = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search,
        vehicleId,
        status,
        tripType: tripTypeFilter,
        startDate,
        endDate,
        sortBy: 'startDate',
        sortOrder: 'desc',
      };
      const res = await API.get('/trips', { params });
      setTrips(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveVehicles = async () => {
    try {
      const res = await API.get('/vehicles?status=ACTIVE&limit=100');
      setVehicles(res.data.data);
    } catch (err) {
      console.error('Failed to fetch vehicles for dropdown:', err);
    }
  };

  useEffect(() => {
    fetchTrips(1);
    fetchActiveVehicles();
  }, [search, vehicleId, status, tripTypeFilter, startDate, endDate]);

  // Handle URL searchParams triggers (e.g. ?action=start or ?startVehicleId=123)
  useEffect(() => {
    const action = searchParams.get('action');
    const paramStartV = searchParams.get('startVehicleId');
    const paramStopT = searchParams.get('stopTripId');

    if (action === 'start' || paramStartV) {
      if (vehicles.length > 0) {
        handleOpenStart(paramStartV || vehicles[0]?._id);
      }
    }

    if (paramStopT) {
      API.get(`/trips/${paramStopT}`).then((res) => {
        if (res.data.success && res.data.data.status === 'ACTIVE') {
          handleOpenStop(res.data.data);
        }
      });
    }
  }, [searchParams, vehicles]);

  const handleOpenStart = (vId = '', defaultCat = '') => {
    setStartError('');
    setPurpose('');
    setStartNotes('');

    const cat = defaultCat || searchParams.get('defaultCategory') || searchParams.get('tripType') || 'BUSINESS';
    setTripType(cat === 'PERSONAL' ? 'PERSONAL' : 'BUSINESS');

    const targetVId = vId || (vehicles[0]?._id || '');
    setStartVehicleId(targetVId);

    const foundV = vehicles.find((v) => v._id === targetVId);
    if (foundV) {
      setSelectedVehicle(foundV);
      setStartOdometer(foundV.currentOdometer);
    }
    setStartModalOpen(true);
  };

  const handleVehicleSelectChange = (e) => {
    const val = e.target.value;
    setStartVehicleId(val);
    const foundV = vehicles.find((v) => v._id === val);
    if (foundV) {
      setSelectedVehicle(foundV);
      setStartOdometer(foundV.currentOdometer);
    }
  };

  const handleStartRideSubmit = async (e) => {
    e.preventDefault();
    setStartError('');

    if (!startVehicleId || !purpose) {
      setStartError('Please select a vehicle and specify the trip purpose.');
      return;
    }

    try {
      setStartLoading(true);
      await API.post('/trips/start', {
        vehicleId: startVehicleId,
        purpose,
        startOdometer: Number(startOdometer),
        tripType,
        notes: startNotes,
      });
      toast.success('Vehicle Ride Started Successfully! 🚗💨');
      setStartModalOpen(false);
      setSearchParams({});
      fetchTrips(1);
      fetchActiveVehicles();
    } catch (err) {
      console.error('Start ride error:', err);
      const msg = err.response?.data?.message || 'Failed to start ride.';
      setStartError(msg);
      toast.error(msg);
    } finally {
      setStartLoading(false);
    }
  };

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

    // Rule 2: Ending odometer MUST be >= starting odometer
    if (endOdoNum < activeTripToStop.startOdometer) {
      const msg = `Ending odometer (${endOdoNum} KM) cannot be lower than starting odometer (${activeTripToStop.startOdometer} KM).`;
      setStopError(msg);
      toast.warning(msg);
      return;
    }

    try {
      setStopLoading(true);
      await API.put(`/trips/${activeTripToStop._id}/stop`, {
        endOdometer: endOdoNum,
        notes: stopNotes,
      });
      toast.success('Vehicle Ride Completed & Saved! 🏁');
      setStopModalOpen(false);
      setSearchParams({});
      fetchTrips(pagination.page);
      fetchActiveVehicles();
    } catch (err) {
      console.error('Stop ride error:', err);
      const msg = err.response?.data?.message || 'Failed to stop ride.';
      setStopError(msg);
      toast.error(msg);
    } finally {
      setStopLoading(false);
    }
  };

  const handleOpenEditTrip = (trip) => {
    setEditingTrip(trip);
    setEditFormData({
      purpose: trip.purpose || '',
      tripType: trip.tripType || 'BUSINESS',
      startOdometer: trip.startOdometer || 0,
      endOdometer: trip.endOdometer !== undefined && trip.endOdometer !== null ? trip.endOdometer : '',
      notes: trip.notes || '',
    });
    setEditTripError('');
    setEditTripModalOpen(true);
  };

  const handleEditTripSubmit = async (e) => {
    e.preventDefault();
    setEditTripError('');
    try {
      setEditTripLoading(true);
      await API.put(`/trips/${editingTrip._id}`, editFormData);
      toast.success('Trip details updated successfully!');
      setEditTripModalOpen(false);
      fetchTrips(pagination.page);
    } catch (err) {
      console.error('Edit trip error:', err);
      const msg = err.response?.data?.message || 'Failed to update trip record.';
      setEditTripError(msg);
      toast.error(msg);
    } finally {
      setEditTripLoading(false);
    }
  };

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trip record?')) return;
    try {
      await API.delete(`/trips/${id}`);
      toast.success('Trip record deleted.');
      fetchTrips(pagination.page);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete trip.';
      toast.error(msg);
    }
  };

  const calculatedDistance =
    endOdometer !== '' && !isNaN(Number(endOdometer)) && activeTripToStop
      ? Number(endOdometer) - activeTripToStop.startOdometer
      : 0;

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
          <div className="p-2 bg-slate-100 rounded-lg text-indigo-600">
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
      header: 'Driver',
      cell: (t) => <span className="text-xs text-slate-700 font-medium">{t.user?.name || 'Driver'}</span>,
    },
    {
      header: 'Category',
      accessor: 'tripType',
      cell: (t) => (
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
            t.tripType === 'PERSONAL'
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          }`}
        >
          {t.tripType === 'PERSONAL' ? 'Personal' : 'Business'}
        </span>
      ),
    },
    {
      header: 'Purpose',
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
      header: 'Distance',
      cell: (t) => (
        <span className="text-xs font-bold text-emerald-600">
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
              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center space-x-1 cursor-pointer"
              title="Stop Ride"
            >
              <FaStopCircle className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
          )}
          {(hasPermission('trips.edit') || isAdmin) && (
            <button
              onClick={() => handleOpenEditTrip(t)}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Edit Trip Details"
            >
              <FaEdit className="w-3.5 h-3.5" />
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Odometer Trip History</h1>
          <p className="text-xs text-slate-500 mt-1">Manual odometer ride tracking and distance logs</p>
        </div>

        {hasPermission('trips.create') && (
          <button
            onClick={() => handleOpenStart()}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <FaPlayCircle className="w-4 h-4" />
            <span>Start New Ride</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={trips}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchTrips(p)}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search trip purpose..."
        filters={[
          {
            key: 'vehicleId',
            label: 'All Vehicles',
            options: vehicles.map((v) => ({ label: `${v.vehicleName} (${v.numberPlate})`, value: v._id })),
          },
          {
            key: 'tripTypeFilter',
            label: 'All Categories',
            options: [
              { label: 'Official / Business', value: 'BUSINESS' },
              { label: 'Personal Trip', value: 'PERSONAL' },
            ],
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
        filterValues={{ vehicleId, status, tripTypeFilter }}
        onFilterChange={(key, val) => {
          if (key === 'vehicleId') setVehicleId(val);
          if (key === 'status') setStatus(val);
          if (key === 'tripTypeFilter') setTripTypeFilter(val);
        }}
        emptyMessage="No trip records found."
        renderMobileCard={(t) => (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <VehicleIcon type={t.vehicle?.vehicleType} className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">{t.vehicle?.vehicleName}</h4>
                  <p className="text-[11px] text-slate-500">{t.purpose}</p>
                </div>
              </div>
              <Badge status={t.status} />
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Start Odometer:</span>
                <span className="font-semibold text-slate-800">{formatKm(t.startOdometer)}</span>
              </div>
              {t.status === 'COMPLETED' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">End Odometer:</span>
                    <span className="font-semibold text-slate-800">{formatKm(t.endOdometer)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1">
                    <span className="text-slate-600 font-bold">Distance Travelled:</span>
                    <span className="font-bold text-emerald-600">{formatKm(t.distance)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="pt-1 flex items-center justify-end space-x-2">
              {t.status === 'ACTIVE' && (hasPermission('trips.edit') || isAdmin) && (
                <button
                  onClick={() => handleOpenStop(t)}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <FaStopCircle className="w-3.5 h-3.5" />
                  <span>Stop Ride</span>
                </button>
              )}
              {(hasPermission('trips.edit') || isAdmin) && (
                <button
                  onClick={() => handleOpenEditTrip(t)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <FaEdit className="w-3.5 h-3.5" />
                  <span>Edit</span>
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

      {/* Start Ride Modal */}
      <Modal
        isOpen={startModalOpen}
        onClose={() => setStartModalOpen(false)}
        title="Start Vehicle Ride"
      >
        <form onSubmit={handleStartRideSubmit} className="space-y-4">
          {startError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
              <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
              <span>{startError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Vehicle *</label>
            <select
              value={startVehicleId}
              onChange={handleVehicleSelectChange}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.vehicleName} ({v.numberPlate}) — Odo: {formatKm(v.currentOdometer)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <OdometerInputWithScan
              label="Starting Odometer Reading (KM) *"
              required
              min={0}
              value={startOdometer}
              onChange={(e) => setStartOdometer(e.target.value)}
              placeholder="e.g. 154230"
            />
            {selectedVehicle && (
              <p className="text-[11px] text-slate-400 mt-1">
                Defaulted to vehicle's last recorded odometer ({formatKm(selectedVehicle.currentOdometer)}). Scan or edit if different.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Trip Category *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTripType('BUSINESS')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  tripType === 'BUSINESS'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FaBriefcase className="w-3.5 h-3.5" />
                <span>Official / Business</span>
              </button>
              <button
                type="button"
                onClick={() => setTripType('PERSONAL')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  tripType === 'PERSONAL'
                    ? 'bg-amber-50 border-amber-600 text-amber-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FaUser className="w-3.5 h-3.5" />
                <span>Personal Ride</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Purpose *</label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Office Visit, Client Delivery, Personal Errands"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Optional Notes</label>
            <textarea
              rows="2"
              value={startNotes}
              onChange={(e) => setStartNotes(e.target.value)}
              placeholder="Additional trip information..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStartModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={startLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-1.5"
            >
              <FaPlayCircle className="w-3.5 h-3.5" />
              <span>{startLoading ? 'Starting...' : 'Confirm & Start Ride'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Stop Ride Modal */}
      <Modal
        isOpen={stopModalOpen}
        onClose={() => setStopModalOpen(false)}
        title="Stop Active Ride"
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
                <span className="text-slate-500">Purpose:</span>
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

          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center text-xs">
            <span className="text-emerald-800 font-semibold">Calculated Distance Travelled:</span>
            <span className="text-lg font-bold text-emerald-700">
              {calculatedDistance >= 0 ? formatKm(calculatedDistance) : 'Invalid'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Completion Notes</label>
            <textarea
              rows="2"
              value={stopNotes}
              onChange={(e) => setStopNotes(e.target.value)}
              placeholder="Any comments regarding the trip..."
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
              <span>{stopLoading ? 'Saving...' : 'Complete & Save Trip'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Trip Modal */}
      <Modal
        isOpen={editTripModalOpen}
        onClose={() => setEditTripModalOpen(false)}
        title="Edit Trip Record"
      >
        <form onSubmit={handleEditTripSubmit} className="space-y-4">
          {editTripError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
              <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
              <span>{editTripError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Trip Category *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEditFormData({ ...editFormData, tripType: 'BUSINESS' })}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  editFormData.tripType === 'BUSINESS'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FaBriefcase className="w-3.5 h-3.5" />
                <span>Official / Business</span>
              </button>
              <button
                type="button"
                onClick={() => setEditFormData({ ...editFormData, tripType: 'PERSONAL' })}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  editFormData.tripType === 'PERSONAL'
                    ? 'bg-amber-50 border-amber-600 text-amber-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FaUser className="w-3.5 h-3.5" />
                <span>Personal Ride</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Purpose *</label>
            <input
              type="text"
              required
              value={editFormData.purpose}
              onChange={(e) => setEditFormData({ ...editFormData, purpose: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <OdometerInputWithScan
                label="Start Odometer (KM) *"
                required
                min={0}
                value={editFormData.startOdometer}
                onChange={(e) => setEditFormData({ ...editFormData, startOdometer: e.target.value })}
                placeholder="e.g. 154000"
              />
            </div>
            <div>
              <OdometerInputWithScan
                label="End Odometer (KM)"
                min={editFormData.startOdometer || 0}
                value={editFormData.endOdometer}
                onChange={(e) => setEditFormData({ ...editFormData, endOdometer: e.target.value })}
                placeholder="Leave blank if active"
              />
            </div>
          </div>


          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Notes</label>
            <textarea
              rows="2"
              value={editFormData.notes}
              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditTripModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editTripLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-1.5"
            >
              <FaEdit className="w-3.5 h-3.5" />
              <span>{editTripLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TripsListPage;
