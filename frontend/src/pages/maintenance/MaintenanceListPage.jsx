import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import VehicleIcon from '../../components/common/VehicleIcon';
import Badge from '../../components/common/Badge';
import { formatKm, formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaWrench, FaExclamationCircle } from 'react-icons/fa';

const MaintenanceListPage = () => {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    maintenanceType: 'General Service',
    date: new Date().toISOString().split('T')[0],
    odometer: '',
    description: '',
    cost: '',
    serviceProvider: '',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const { hasPermission } = useAuth();

  const fetchRecords = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search,
        vehicleId,
        maintenanceType,
        sortBy: 'date',
        sortOrder: 'desc',
      };
      const res = await API.get('/maintenance', { params });
      setRecords(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch maintenance logs:', err);
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
    fetchRecords(1);
    fetchVehicles();
  }, [search, vehicleId, maintenanceType]);

  const handleOpenModal = () => {
    const firstV = vehicles[0];
    setFormData({
      vehicleId: firstV ? firstV._id : '',
      maintenanceType: 'General Service',
      date: new Date().toISOString().split('T')[0],
      odometer: firstV ? firstV.currentOdometer : '',
      description: '',
      cost: '',
      serviceProvider: '',
      notes: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.vehicleId || formData.odometer === '' || !formData.description) {
      setFormError('Vehicle, Odometer, and Description are required.');
      return;
    }

    try {
      setFormLoading(true);
      await API.post('/maintenance', {
        ...formData,
        odometer: Number(formData.odometer),
        cost: Number(formData.cost) || 0,
      });
      setModalOpen(false);
      fetchRecords(1);
    } catch (err) {
      console.error('Maintenance save error:', err);
      setFormError(err.response?.data?.message || 'Failed to record maintenance.');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      cell: (m) => <span className="font-semibold text-slate-800 text-xs">{formatDate(m.date)}</span>,
    },
    {
      header: 'Vehicle',
      cell: (m) => (
        <div className="flex items-center space-x-2">
          <VehicleIcon type={m.vehicle?.vehicleType} className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-800 text-xs">{m.vehicle?.vehicleName}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      cell: (m) => <Badge status="INFO" text={m.maintenanceType} />,
    },
    {
      header: 'Description',
      accessor: 'description',
      cell: (m) => <span className="text-xs text-slate-800 font-medium">{m.description}</span>,
    },
    {
      header: 'Odometer',
      accessor: 'odometer',
      cell: (m) => <span className="text-xs font-semibold text-slate-700">{formatKm(m.odometer)}</span>,
    },
    {
      header: 'Cost',
      accessor: 'cost',
      cell: (m) => <span className="text-xs font-bold text-slate-800">{formatCurrency(m.cost)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">General Maintenance & Repairs</h1>
          <p className="text-xs text-slate-500 mt-1">Vehicle periodic servicing, repairs, and part replacement history</p>
        </div>

        {hasPermission('maintenance.create') && (
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <FaPlus className="w-4 h-4" />
            <span>Record Maintenance</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchRecords(p)}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search description or provider..."
        filters={[
          {
            key: 'vehicleId',
            label: 'All Vehicles',
            options: vehicles.map((v) => ({ label: v.vehicleName, value: v._id })),
          },
          {
            key: 'maintenanceType',
            label: 'All Service Types',
            options: [
              { label: 'General Service', value: 'General Service' },
              { label: 'Brake Service', value: 'Brake Service' },
              { label: 'Battery Replacement', value: 'Battery Replacement' },
              { label: 'AC Service', value: 'AC Service' },
              { label: 'Engine Repair', value: 'Engine Repair' },
              { label: 'Filter Change', value: 'Filter Change' },
              { label: 'Other', value: 'Other' },
            ],
          },
        ]}
        filterValues={{ vehicleId, maintenanceType }}
        onFilterChange={(k, v) => {
          if (k === 'vehicleId') setVehicleId(v);
          if (k === 'maintenanceType') setMaintenanceType(v);
        }}
        emptyMessage="No maintenance records logged."
        renderMobileCard={(m) => (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">{m.vehicle?.vehicleName}</span>
              <Badge status="INFO" text={m.maintenanceType} />
            </div>
            <p className="text-slate-700 font-medium">{m.description}</p>
            <div className="flex justify-between text-slate-500 bg-slate-50 p-2 rounded-lg">
              <span>Odo: {formatKm(m.odometer)}</span>
              <span className="font-bold text-slate-800">{formatCurrency(m.cost)}</span>
            </div>
          </div>
        )}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Vehicle Maintenance"
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
                  {v.vehicleName} ({v.numberPlate})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Maintenance Type *</label>
              <select
                value={formData.maintenanceType}
                onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="General Service">General Service</option>
                <option value="Brake Service">Brake Service</option>
                <option value="Battery Replacement">Battery Replacement</option>
                <option value="AC Service">AC Service</option>
                <option value="Engine Repair">Engine Repair</option>
                <option value="Filter Change">Filter Change</option>
                <option value="Other">Other</option>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Cost (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="4500"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Work Description *</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Brake pad replacement & disc skimming"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Service Provider</label>
            <input
              type="text"
              value={formData.serviceProvider}
              onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
              placeholder="e.g. Bosch Car Service Center"
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : 'Save Maintenance Log'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenanceListPage;
