import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import VehicleIcon from '../../components/common/VehicleIcon';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate, formatKm } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaCircleNotch, FaExclamationCircle } from 'react-icons/fa';

const TyresListPage = () => {
  const [tyres, setTyres] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicleId, setVehicleId] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    installationDate: new Date().toISOString().split('T')[0],
    brand: '',
    model: '',
    position: 'All Four',
    quantity: 4,
    cost: '',
    odometer: '',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const { hasPermission } = useAuth();

  const fetchTyres = async (page = 1) => {
    try {
      setLoading(true);
      const res = await API.get('/tyres', { params: { page, limit: 10, vehicleId } });
      setTyres(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch tyres:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await API.get('/vehicles?limit=100');
      setVehicles(res.data.data);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  };

  useEffect(() => {
    fetchTyres(1);
    fetchVehicles();
  }, [vehicleId]);

  const handleOpenModal = () => {
    const firstV = vehicles[0];
    setFormData({
      vehicleId: firstV ? firstV._id : '',
      installationDate: new Date().toISOString().split('T')[0],
      brand: 'Michelin',
      model: 'Primacy 4ST',
      position: 'All Four',
      quantity: 4,
      cost: '',
      odometer: firstV ? firstV.currentOdometer : 0,
      notes: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleVehicleSelect = (vId) => {
    const foundV = vehicles.find((v) => v._id === vId);
    setFormData({
      ...formData,
      vehicleId: vId,
      odometer: foundV ? foundV.currentOdometer : formData.odometer,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.vehicleId || !formData.brand) {
      setFormError('Vehicle and Tyre Brand are required.');
      return;
    }

    try {
      setFormLoading(true);
      await API.post('/tyres', {
        ...formData,
        quantity: Number(formData.quantity) || 4,
        cost: Number(formData.cost) || 0,
        odometer: Number(formData.odometer) || 0,
      });
      setModalOpen(false);
      fetchTyres(1);
    } catch (err) {
      console.error('Tyre add error:', err);
      setFormError(err.response?.data?.message || 'Failed to record tyre installation.');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: 'Installation Date',
      accessor: 'installationDate',
      cell: (t) => <span className="font-semibold text-slate-800 text-xs">{formatDate(t.installationDate)}</span>,
    },
    {
      header: 'Vehicle',
      cell: (t) => (
        <div className="flex items-center space-x-2">
          <VehicleIcon type={t.vehicle?.vehicleType} className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-800 text-xs">{t.vehicle?.vehicleName}</span>
        </div>
      ),
    },
    {
      header: 'Brand / Model',
      cell: (t) => <span className="text-xs text-slate-700 font-medium">{t.brand} {t.model} ({t.position})</span>,
    },
    {
      header: 'Current Odometer Reading',
      cell: (t) => <span className="text-xs font-semibold text-slate-800">{formatKm(t.odometer || t.vehicle?.currentOdometer || 0)}</span>,
    },
    {
      header: 'Replacement Status',
      cell: (t) => <Badge status={t.statusDetails?.status} text={t.statusDetails?.status} />,
    },
    {
      header: 'Cost',
      accessor: 'cost',
      cell: (t) => <span className="text-xs font-bold text-slate-800">{formatCurrency(t.cost)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tyre Installation & Odometer Tracking</h1>
          <p className="text-xs text-slate-500 mt-1">Track tyre installations and current odometer replacement logs</p>
        </div>

        {hasPermission('tyres.create') && (
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <FaPlus className="w-4 h-4" />
            <span>Record Tyre Replacement</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={tyres}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchTyres(p)}
        filters={[
          {
            key: 'vehicleId',
            label: 'All Vehicles',
            options: vehicles.map((v) => ({ label: v.vehicleName, value: v._id })),
          },
        ]}
        filterValues={{ vehicleId }}
        onFilterChange={(k, v) => setVehicleId(v)}
        emptyMessage="No tyre records found."
        renderMobileCard={(t) => (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">{t.vehicle?.vehicleName}</span>
              <Badge status={t.statusDetails?.status} />
            </div>
            <div className="text-slate-600">{t.brand} {t.model} ({t.position})</div>
            <div className="flex justify-between text-slate-500 bg-slate-50 p-2 rounded-lg">
              <span>Installed: {formatDate(t.installationDate)}</span>
              <span>Odometer: <strong>{formatKm(t.odometer || t.vehicle?.currentOdometer || 0)}</strong></span>
            </div>
          </div>
        )}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Tyre Replacement"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
              <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Vehicle *</label>
            <select
              value={formData.vehicleId}
              onChange={(e) => handleVehicleSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.vehicleName} ({v.numberPlate}) — Odo: {formatKm(v.currentOdometer)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand *</label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Michelin, Bridgestone, MRF"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Primacy 4ST"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Installation Date</label>
              <input
                type="date"
                value={formData.installationDate}
                onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Odometer Reading (KM) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.odometer}
                onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                placeholder="50000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Cost (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="32000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : 'Save Tyre Log'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TyresListPage;
