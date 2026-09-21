import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import VehicleIcon from '../../components/common/VehicleIcon';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import AlertBanner from '../../components/common/AlertBanner';
import { formatKm, formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import OdometerInputWithScan from '../../components/common/OdometerInputWithScan';
import {
  FaCar,
  FaTachometerAlt,
  FaOilCan,
  FaCircleNotch,
  FaRoute,
  FaGasPump,
  FaWrench,
  FaEdit,
  FaTrash,
  FaPlayCircle,
  FaStopCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';

const VehicleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, hasPermission } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trips');

  // Edit Vehicle Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicleName: '',
    numberPlate: '',
    vehicleType: 'Car',
    currentOdometer: 0,
    fuelType: 'Diesel',
    make: '',
    model: '',
    year: '',
    color: '',
    engineNumber: '',
    chassisNumber: '',
    notes: '',
    status: 'ACTIVE',
  });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Odometer Correction Modal
  const [corrModalOpen, setCorrModalOpen] = useState(false);
  const [corrOdometer, setCorrOdometer] = useState('');
  const [corrReason, setCorrReason] = useState('');
  const [corrError, setCorrError] = useState('');
  const [corrLoading, setCorrLoading] = useState(false);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/vehicles/${id}`);
      setVehicle(res.data.data);
      setCorrOdometer(res.data.data.currentOdometer);
    } catch (err) {
      console.error('Failed to fetch vehicle profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  const handleOdometerCorrection = async (e) => {
    e.preventDefault();
    setCorrError('');
    if (corrOdometer === '' || Number(corrOdometer) < 0 || !corrReason) {
      setCorrError('Please provide a valid odometer reading and explanation reason.');
      return;
    }

    try {
      setCorrLoading(true);
      await API.post(`/vehicles/${id}/odometer-correction`, {
        newOdometer: Number(corrOdometer),
        reason: corrReason,
      });
      setCorrModalOpen(false);
      fetchVehicleDetails();
    } catch (err) {
      console.error('Odometer correction error:', err);
      setCorrError(err.response?.data?.message || 'Failed to update odometer.');
    } finally {
      setCorrLoading(false);
    }
  };

  const handleOpenEdit = () => {
    setFormData({
      vehicleName: vehicle.vehicleName || '',
      numberPlate: vehicle.numberPlate || '',
      vehicleType: vehicle.vehicleType || 'Car',
      currentOdometer: vehicle.currentOdometer || 0,
      fuelType: vehicle.fuelType || 'Diesel',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      color: vehicle.color || '',
      engineNumber: vehicle.engineNumber || '',
      chassisNumber: vehicle.chassisNumber || '',
      notes: vehicle.notes || '',
      status: vehicle.status || 'ACTIVE',
    });
    setEditError('');
    setEditModalOpen(true);
  };

  const handleEditVehicleSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    try {
      setEditLoading(true);
      await API.put(`/vehicles/${id}`, formData);
      setEditModalOpen(false);
      fetchVehicleDetails();
    } catch (err) {
      console.error('Edit vehicle error:', err);
      setEditError(err.response?.data?.message || 'Failed to update vehicle.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete vehicle "${vehicle.vehicleName}" (${vehicle.numberPlate})?`)) return;
    try {
      await API.delete(`/vehicles/${id}`);
      navigate('/vehicles');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete vehicle.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading vehicle details...</div>;
  }

  if (!vehicle) {
    return <div className="p-8 text-center text-slate-500">Vehicle not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Summary Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
              <VehicleIcon type={vehicle.vehicleType} className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{vehicle.vehicleName}</h1>
                <Badge status={vehicle.status} />
              </div>
              <p className="text-sm font-mono font-bold text-indigo-600 mt-0.5">{vehicle.numberPlate}</p>
              <p className="text-xs text-slate-400 mt-1">
                {vehicle.make} {vehicle.model} ({vehicle.year}) • {vehicle.fuelType}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {vehicle.activeRide ? (
              <button
                onClick={() => navigate(`/trips?stopTripId=${vehicle.activeRide._id}`)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center space-x-2 cursor-pointer"
              >
                <FaStopCircle className="w-4 h-4" />
                <span>Stop Active Ride</span>
              </button>
            ) : (
              hasPermission('trips.create') && (
                <button
                  onClick={() => navigate(`/trips?startVehicleId=${vehicle._id}`)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center space-x-2 cursor-pointer"
                >
                  <FaPlayCircle className="w-4 h-4" />
                  <span>Start Ride</span>
                </button>
              )
            )}

            {(isAdmin || hasPermission('vehicles.edit')) && (
              <button
                onClick={handleOpenEdit}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <FaEdit className="w-3.5 h-3.5" />
                <span>Edit Vehicle</span>
              </button>
            )}

            {(isAdmin || hasPermission('vehicles.delete')) && (
              <button
                onClick={handleDeleteVehicle}
                className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <FaTrash className="w-3.5 h-3.5" />
                <span>Delete Vehicle</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setCorrModalOpen(true)}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <FaTachometerAlt className="w-3.5 h-3.5 text-indigo-600" />
                <span>Correct Odometer</span>
              </button>
            )}
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Current Odometer</span>
            <p className="text-xl font-bold text-slate-800 mt-1">{formatKm(vehicle.currentOdometer)}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Next Oil Change</span>
              <Badge status={vehicle.oilStatus?.status} />
            </div>
            <p className="text-xl font-bold text-slate-800 mt-1">
              {formatKm(vehicle.oilStatus?.nextOilChangeOdometer)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {vehicle.oilStatus?.kmRemaining} KM remaining
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Tyre Replacement Due</span>
            <p className="text-xl font-bold text-slate-800 mt-1">
              {formatDate(vehicle.tyreReplacementDueDate)}
            </p>
            {vehicle.tyreStatus && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Status: <Badge status={vehicle.tyreStatus.status} />
              </p>
            )}
          </div>
        </div>
      </div>

      {/* History Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {[
            { id: 'trips', label: 'Trip History', icon: FaRoute },
            { id: 'fuel', label: 'Fuel Records', icon: FaGasPump },
            { id: 'oil', label: 'Oil Changes', icon: FaOilCan },
            { id: 'tyres', label: 'Tyre Logs', icon: FaCircleNotch },
            { id: 'maintenance', label: 'Maintenance', icon: FaWrench },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-5 py-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
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

        {/* Tab Contents */}
        <div className="p-4 sm:p-6">
          {activeTab === 'trips' && (
            <div className="space-y-3">
              {!vehicle.history?.trips?.length ? (
                <p className="text-xs text-slate-400 text-center py-6">No trips recorded for this vehicle.</p>
              ) : (
                vehicle.history.trips.map((t) => (
                  <div key={t._id} className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-semibold text-slate-800">{t.purpose}</h4>
                      <p className="text-slate-500">
                        {formatKm(t.startOdometer)} → {formatKm(t.endOdometer)} ({formatKm(t.distance)})
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge status={t.status} />
                      <p className="text-[10px] text-slate-400 mt-1">{formatDate(t.startDate)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'fuel' && (
            <div className="space-y-3">
              {!vehicle.history?.fuel?.length ? (
                <p className="text-xs text-slate-400 text-center py-6">No fuel entries recorded.</p>
              ) : (
                vehicle.history.fuel.map((f) => (
                  <div key={f._id} className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-semibold text-slate-800">{f.quantity} Litres @ {formatCurrency(f.pricePerLitre)}/L</h4>
                      <p className="text-slate-500">At Odometer: {formatKm(f.odometer)} • Station: {f.fuelStation || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800">{formatCurrency(f.totalAmount)}</span>
                      <p className="text-[10px] text-slate-400 mt-1">{formatDate(f.date)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'oil' && (
            <div className="space-y-3">
              {!vehicle.history?.oil?.length ? (
                <p className="text-xs text-slate-400 text-center py-6">No oil changes logged.</p>
              ) : (
                vehicle.history.oil.map((o) => (
                  <div key={o._id} className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-semibold text-slate-800">{o.oilBrand} ({o.oilType})</h4>
                      <p className="text-slate-500">Odometer: {formatKm(o.odometer)} • Next Due: {formatKm(o.nextOilChangeOdometer)}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800">{formatCurrency(o.cost)}</span>
                      <p className="text-[10px] text-slate-400 mt-1">{formatDate(o.date)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'tyres' && (
            <div className="space-y-3">
              {!vehicle.history?.tyres?.length ? (
                <p className="text-xs text-slate-400 text-center py-6">No tyre replacements logged.</p>
              ) : (
                vehicle.history.tyres.map((ty) => (
                  <div key={ty._id} className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-semibold text-slate-800">{ty.brand} {ty.model} ({ty.position})</h4>
                      <p className="text-slate-500">Quantity: {ty.quantity} • Installed: {formatDate(ty.installationDate)}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800">{formatCurrency(ty.cost)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-3">
              {!vehicle.history?.maintenance?.length ? (
                <p className="text-xs text-slate-400 text-center py-6">No maintenance records logged.</p>
              ) : (
                vehicle.history.maintenance.map((m) => (
                  <div key={m._id} className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-semibold text-slate-800">{m.maintenanceType} — {m.description}</h4>
                      <p className="text-slate-500">Odometer: {formatKm(m.odometer)} • Provider: {m.serviceProvider || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800">{formatCurrency(m.cost)}</span>
                      <p className="text-[10px] text-slate-400 mt-1">{formatDate(m.date)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Admin Odometer Correction Modal */}
      <Modal
        isOpen={corrModalOpen}
        onClose={() => setCorrModalOpen(false)}
        title="Admin Odometer Correction"
      >
        <form onSubmit={handleOdometerCorrection} className="space-y-4">
          {corrError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
              <FaExclamationTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{corrError}</span>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Current vehicle odometer is <strong>{formatKm(vehicle.currentOdometer)}</strong>. Correcting this creates an auditable record.
          </p>

          <div>
            <OdometerInputWithScan
              label="New Odometer Reading (KM) *"
              required
              min={0}
              value={corrOdometer}
              onChange={(e) => setCorrOdometer(e.target.value)}
              placeholder="e.g. 154850"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Reason for Correction *</label>
            <textarea
              required
              rows="3"
              value={corrReason}
              onChange={(e) => setCorrReason(e.target.value)}
              placeholder="Explain why the odometer is being manually adjusted..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCorrModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={corrLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {corrLoading ? 'Saving...' : 'Apply Correction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Vehicle Details"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleEditVehicleSubmit} className="space-y-4">
          {editError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
              <FaExclamationTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Name *</label>
              <input
                type="text"
                required
                value={formData.vehicleName}
                onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Number Plate *</label>
              <input
                type="text"
                required
                value={formData.numberPlate}
                onChange={(e) => setFormData({ ...formData, numberPlate: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Type *</label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
                <option value="Bus">Bus</option>
                <option value="Auto">Auto</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Type</label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Make</label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {editLoading ? 'Saving...' : 'Save Vehicle Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VehicleDetailPage;
