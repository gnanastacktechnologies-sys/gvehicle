import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import VehicleIcon from '../../components/common/VehicleIcon';
import { formatKm, formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaGasPump, FaExclamationCircle, FaEdit, FaTrash } from 'react-icons/fa';
import OdometerInputWithScan from '../../components/common/OdometerInputWithScan';


const FuelListPage = () => {
  const [fuelEntries, setFuelEntries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [vehicleId, setVehicleId] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Add / Edit Fuel Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    odometer: '',
    fuelType: 'Diesel',
    quantity: '',
    totalAmount: '',
    fuelStation: '',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const { hasPermission, isAdmin } = useAuth();

  const fetchFuel = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        vehicleId,
        fuelType,
        sortBy: 'date',
        sortOrder: 'desc',
      };
      const res = await API.get('/fuel', { params });
      setFuelEntries(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch fuel logs:', err);
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
    fetchFuel(1);
    fetchVehicles();
  }, [vehicleId, fuelType]);

  const handleOpenAddModal = () => {
    setEditingEntry(null);
    const firstV = vehicles[0];
    setFormData({
      vehicleId: firstV ? firstV._id : '',
      date: new Date().toISOString().split('T')[0],
      odometer: firstV ? firstV.currentOdometer : 0,
      fuelType: firstV ? firstV.fuelType : 'Diesel',
      quantity: '',
      totalAmount: '',
      fuelStation: '',
      notes: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (f) => {
    setEditingEntry(f);
    setFormData({
      vehicleId: f.vehicle?._id || f.vehicle || '',
      date: f.date ? f.date.split('T')[0] : new Date().toISOString().split('T')[0],
      odometer: f.odometer,
      fuelType: f.fuelType || 'Diesel',
      quantity: f.quantity,
      totalAmount: f.totalAmount,
      fuelStation: f.fuelStation || '',
      notes: f.notes || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fuel record?')) return;
    try {
      await API.delete(`/fuel/${id}`);
      fetchFuel(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete fuel record.');
    }
  };

  const handleVehicleSelect = (vId) => {
    const foundV = vehicles.find((v) => v._id === vId);
    setFormData((prev) => ({
      ...prev,
      vehicleId: vId,
      odometer: foundV ? foundV.currentOdometer : prev.odometer,
      fuelType: foundV ? foundV.fuelType : prev.fuelType,
    }));
  };

  const computedPricePerLitre =
    formData.quantity && formData.totalAmount && Number(formData.quantity) > 0
      ? (Number(formData.totalAmount) / Number(formData.quantity)).toFixed(2)
      : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.vehicleId || !formData.quantity || !formData.totalAmount || formData.odometer === '') {
      setFormError('Vehicle, Odometer, Quantity and Total Price are required.');
      return;
    }

    try {
      setFormLoading(true);
      const payload = {
        ...formData,
        odometer: Number(formData.odometer),
        quantity: Number(formData.quantity),
        totalAmount: Number(formData.totalAmount),
      };

      if (editingEntry) {
        await API.put(`/fuel/${editingEntry._id}`, payload);
      } else {
        await API.post('/fuel', payload);
      }
      setModalOpen(false);
      fetchFuel(pagination.page);
    } catch (err) {
      console.error('Fuel add/edit error:', err);
      setFormError(err.response?.data?.message || 'Failed to save fuel entry.');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      cell: (f) => <span className="font-semibold text-slate-800 text-xs">{formatDate(f.date)}</span>,
    },
    {
      header: 'Vehicle',
      cell: (f) => (
        <div className="flex items-center space-x-2">
          <VehicleIcon type={f.vehicle?.vehicleType} className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-800 text-xs">{f.vehicle?.vehicleName}</span>
        </div>
      ),
    },
    {
      header: 'Odometer',
      accessor: 'odometer',
      cell: (f) => <span className="text-xs font-semibold text-slate-700">{formatKm(f.odometer)}</span>,
    },
    {
      header: 'Fuel Type',
      accessor: 'fuelType',
      cell: (f) => <span className="text-xs text-slate-600">{f.fuelType}</span>,
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      cell: (f) => <span className="text-xs font-semibold text-slate-800">{f.quantity} L</span>,
    },
    {
      header: 'Price / Litre',
      accessor: 'pricePerLitre',
      cell: (f) => <span className="text-xs text-slate-600">{formatCurrency(f.pricePerLitre)}</span>,
    },
    {
      header: 'Total Amount',
      accessor: 'totalAmount',
      cell: (f) => <span className="text-xs font-bold text-amber-600">{formatCurrency(f.totalAmount)}</span>,
    },
    {
      header: 'Station',
      accessor: 'fuelStation',
      cell: (f) => <span className="text-xs text-slate-500">{f.fuelStation || '—'}</span>,
    },
    {
      header: 'Actions',
      cell: (f) => (
        <div className="flex items-center space-x-2">
          {(hasPermission('fuel.edit') || isAdmin) && (
            <button
              onClick={() => handleOpenEditModal(f)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Edit Fuel Log"
            >
              <FaEdit className="w-4 h-4" />
            </button>
          )}
          {(hasPermission('fuel.delete') || isAdmin) && (
            <button
              onClick={() => handleDelete(f._id)}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Fuel Log"
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fuel Refuel Records</h1>
          <p className="text-xs text-slate-500 mt-1">Track fuel logs, litres added, and refuelling expenses</p>
        </div>

        {(hasPermission('fuel.create') || isAdmin) && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-amber-100 transition-all cursor-pointer"
          >
            <FaPlus className="w-4 h-4" />
            <span>Add Fuel Log</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={fuelEntries}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchFuel(p)}
        filters={[
          {
            key: 'vehicleId',
            label: 'All Vehicles',
            options: vehicles.map((v) => ({ label: v.vehicleName, value: v._id })),
          },
          {
            key: 'fuelType',
            label: 'All Fuel Types',
            options: [
              { label: 'Diesel', value: 'Diesel' },
              { label: 'Petrol', value: 'Petrol' },
              { label: 'CNG', value: 'CNG' },
              { label: 'Electric', value: 'Electric' },
            ],
          },
        ]}
        filterValues={{ vehicleId, fuelType }}
        onFilterChange={(key, val) => {
          if (key === 'vehicleId') setVehicleId(val);
          if (key === 'fuelType') setFuelType(val);
        }}
        emptyMessage="No fuel records recorded."
        renderMobileCard={(f) => (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">{f.vehicle?.vehicleName}</span>
              <span className="font-bold text-amber-600 text-sm">{formatCurrency(f.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{f.quantity} Litres @ {formatCurrency(f.pricePerLitre)}/L</span>
              <span>{formatDate(f.date)}</span>
            </div>
            <div className="text-slate-400">Odo: {formatKm(f.odometer)} • Station: {f.fuelStation || 'N/A'}</div>
            <div className="flex justify-end space-x-2 pt-1 border-t border-slate-100">
              {(hasPermission('fuel.edit') || isAdmin) && (
                <button
                  onClick={() => handleOpenEditModal(f)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <FaEdit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
              {(hasPermission('fuel.delete') || isAdmin) && (
                <button
                  onClick={() => handleDelete(f._id)}
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

      {/* Add / Edit Fuel Entry Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEntry ? 'Edit Fuel Log' : 'Record Fuel Addition'}
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
                  {v.vehicleName} ({v.numberPlate})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Station</label>
              <input
                type="text"
                value={formData.fuelStation}
                onChange={(e) => setFormData({ ...formData, fuelStation: e.target.value })}
                placeholder="e.g. Indian Oil, HP Pump"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity (Litres) *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="40"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Price (₹) *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                placeholder="4000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-amber-700"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex justify-between items-center text-xs">
            <span className="text-amber-800 font-semibold">Calculated Rate / Litre:</span>
            <span className="text-base font-bold text-amber-700">₹{computedPricePerLitre} / L</span>
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
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : editingEntry ? 'Update Fuel Log' : 'Save Fuel Log'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default FuelListPage;

