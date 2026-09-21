import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import VehicleIcon from '../../components/common/VehicleIcon';
import Badge from '../../components/common/Badge';
import { formatKm, formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaOilCan, FaExclamationCircle, FaEdit, FaTrash } from 'react-icons/fa';
import OdometerInputWithScan from '../../components/common/OdometerInputWithScan';


const OilChangesListPage = () => {
  const [changes, setChanges] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicleId, setVehicleId] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingChange, setEditingChange] = useState(null);
  const [formData, setFormData] = useState({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    odometer: '',
    oilType: 'Synthetic 5W-30',
    oilBrand: '',
    quantity: '',
    cost: '',
    serviceProvider: '',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const { hasPermission, isAdmin } = useAuth();

  const fetchOil = async (page = 1) => {
    try {
      setLoading(true);
      const res = await API.get('/oil-changes', { params: { page, limit: 10, vehicleId } });
      setChanges(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch oil changes:', err);
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
    fetchOil(1);
    fetchVehicles();
  }, [vehicleId]);

  const handleOpenAddModal = () => {
    setEditingChange(null);
    const firstV = vehicles[0];
    setFormData({
      vehicleId: firstV ? firstV._id : '',
      date: new Date().toISOString().split('T')[0],
      odometer: firstV ? firstV.currentOdometer : '',
      oilType: 'Synthetic 5W-30',
      oilBrand: '',
      quantity: 5,
      cost: '',
      serviceProvider: '',
      notes: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (o) => {
    setEditingChange(o);
    setFormData({
      vehicleId: o.vehicle?._id || o.vehicle || '',
      date: o.date ? o.date.split('T')[0] : new Date().toISOString().split('T')[0],
      odometer: o.odometer,
      oilType: o.oilType || 'Synthetic 5W-30',
      oilBrand: o.oilBrand || '',
      quantity: o.quantity || 5,
      cost: o.cost || '',
      serviceProvider: o.serviceProvider || '',
      notes: o.notes || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this oil change record?')) return;
    try {
      await API.delete(`/oil-changes/${id}`);
      fetchOil(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete oil change log.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.vehicleId || formData.odometer === '') {
      setFormError('Vehicle and Odometer reading are required.');
      return;
    }

    try {
      setFormLoading(true);
      const payload = {
        ...formData,
        odometer: Number(formData.odometer),
        cost: Number(formData.cost) || 0,
      };

      if (editingChange) {
        await API.put(`/oil-changes/${editingChange._id}`, payload);
      } else {
        await API.post('/oil-changes', payload);
      }
      setModalOpen(false);
      fetchOil(pagination.page);
    } catch (err) {
      console.error('Oil change save error:', err);
      setFormError(err.response?.data?.message || 'Failed to save oil change.');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      cell: (o) => <span className="font-semibold text-slate-800 text-xs">{formatDate(o.date)}</span>,
    },
    {
      header: 'Vehicle',
      cell: (o) => (
        <div className="flex items-center space-x-2">
          <VehicleIcon type={o.vehicle?.vehicleType} className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-800 text-xs">{o.vehicle?.vehicleName}</span>
        </div>
      ),
    },
    {
      header: 'Odometer',
      accessor: 'odometer',
      cell: (o) => <span className="text-xs font-semibold text-slate-700">{formatKm(o.odometer)}</span>,
    },
    {
      header: 'Oil Brand / Type',
      cell: (o) => <span className="text-xs text-slate-700 font-medium">{o.oilBrand} ({o.oilType})</span>,
    },
    {
      header: 'Next Oil Change Threshold',
      accessor: 'nextOilChangeOdometer',
      cell: (o) => <span className="text-xs font-bold text-indigo-600">{formatKm(o.nextOilChangeOdometer)}</span>,
    },
    {
      header: 'Cost',
      accessor: 'cost',
      cell: (o) => <span className="text-xs font-bold text-slate-800">{formatCurrency(o.cost)}</span>,
    },
    {
      header: 'Actions',
      cell: (o) => (
        <div className="flex items-center space-x-2">
          {(hasPermission('oil.edit') || isAdmin) && (
            <button
              onClick={() => handleOpenEditModal(o)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Edit Oil Log"
            >
              <FaEdit className="w-4 h-4" />
            </button>
          )}
          {(hasPermission('oil.delete') || isAdmin) && (
            <button
              onClick={() => handleDelete(o._id)}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Oil Log"
            >
              <FaTrash className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Engine Oil Change Logs</h1>
          <p className="text-xs text-slate-500 mt-1">Odometer interval tracking & upcoming change thresholds</p>
        </div>

        {(hasPermission('oil.create') || isAdmin) && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <FaPlus className="w-4 h-4" />
            <span>Log Oil Change</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={changes}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchOil(p)}
        filters={[
          {
            key: 'vehicleId',
            label: 'All Vehicles',
            options: vehicles.map((v) => ({ label: v.vehicleName, value: v._id })),
          },
        ]}
        filterValues={{ vehicleId }}
        onFilterChange={(k, v) => setVehicleId(v)}
        emptyMessage="No engine oil changes logged."
        renderMobileCard={(o) => (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">{o.vehicle?.vehicleName}</span>
              <span className="font-bold text-indigo-600">{formatCurrency(o.cost)}</span>
            </div>
            <div className="text-slate-600">{o.oilBrand} ({o.oilType})</div>
            <div className="flex justify-between text-slate-500 bg-slate-50 p-2 rounded-lg">
              <span>Changed: {formatKm(o.odometer)}</span>
              <span>Next Due: <strong>{formatKm(o.nextOilChangeOdometer)}</strong></span>
            </div>
            <div className="flex justify-end space-x-2 pt-1 border-t border-slate-100">
              {(hasPermission('oil.edit') || isAdmin) && (
                <button
                  onClick={() => handleOpenEditModal(o)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <FaEdit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
              {(hasPermission('oil.delete') || isAdmin) && (
                <button
                  onClick={() => handleDelete(o._id)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <FaTrash className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        )}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingChange ? 'Edit Engine Oil Change Log' : 'Log Engine Oil Change'}
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
              onChange={(e) => {
                const v = vehicles.find((item) => item._id === e.target.value);
                setFormData({
                  ...formData,
                  vehicleId: e.target.value,
                  odometer: v ? v.currentOdometer : formData.odometer,
                });
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.vehicleName} ({v.numberPlate}) — Interval: {formatKm(v.engineOilChangeIntervalKm)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Service Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <OdometerInputWithScan
              label="Odometer Reading (KM) *"
              required
              min={0}
              value={formData.odometer}
              onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
              placeholder="e.g. 154230"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Records odometer reading at oil change service for log history and interval tracking.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Oil Brand</label>
              <input
                type="text"
                value={formData.oilBrand}
                onChange={(e) => setFormData({ ...formData, oilBrand: e.target.value })}
                placeholder="Castrol, Mobil 1, Shell"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service Cost (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="3500"
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
              {formLoading ? 'Saving...' : editingChange ? 'Update Oil Change' : 'Save Oil Change'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OilChangesListPage;

