import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import VehicleIcon from '../../components/common/VehicleIcon';
import { formatKm, formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaGasPump, FaExclamationCircle } from 'react-icons/fa';

const FuelListPage = () => {
  const [fuelEntries, setFuelEntries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [vehicleId, setVehicleId] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Add Fuel Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    odometer: '',
    fuelType: 'Diesel',
    quantity: '',
    pricePerLitre: '',
    fuelStation: '',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const { hasPermission } = useAuth();

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

  const handleOpenModal = () => {
    const firstV = vehicles[0];
    setFormData({
      vehicleId: firstV ? firstV._id : '',
      date: new Date().toISOString().split('T')[0],
      odometer: firstV ? firstV.currentOdometer : 0,
      fuelType: firstV ? firstV.fuelType : 'Diesel',
      quantity: '',
      pricePerLitre: '',
      fuelStation: '',
      notes: '',
    });
    setFormError('');
    setModalOpen(true);
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

  const computedTotal =
    formData.quantity && formData.pricePerLitre
      ? (Number(formData.quantity) * Number(formData.pricePerLitre)).toFixed(2)
      : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.vehicleId || !formData.quantity || !formData.pricePerLitre || formData.odometer === '') {
      setFormError('Vehicle, Odometer, Quantity and Price per Litre are required.');
      return;
    }

    try {
      setFormLoading(true);
      await API.post('/fuel', {
        ...formData,
        odometer: Number(formData.odometer),
        quantity: Number(formData.quantity),
        pricePerLitre: Number(formData.pricePerLitre),
      });
      setModalOpen(false);
      fetchFuel(1);
    } catch (err) {
      console.error('Fuel add error:', err);
      setFormError(err.response?.data?.message || 'Failed to record fuel entry.');
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
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fuel Refuel Records</h1>
          <p className="text-xs text-slate-500 mt-1">Track fuel logs, litres added, and refuelling expenses</p>
        </div>

        {hasPermission('fuel.create') && (
          <button
            onClick={handleOpenModal}
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
          </div>
        )}
      />

      {/* Add Fuel Entry Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Fuel Addition"
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

          <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Odometer (KM) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.odometer}
                onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price / Litre (₹) *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.pricePerLitre}
                onChange={(e) => setFormData({ ...formData, pricePerLitre: e.target.value })}
                placeholder="95.50"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex justify-between items-center text-xs">
            <span className="text-amber-800 font-semibold">Calculated Total Amount:</span>
            <span className="text-base font-bold text-amber-700">₹{computedTotal}</span>
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
              {formLoading ? 'Saving...' : 'Save Fuel Log'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FuelListPage;
