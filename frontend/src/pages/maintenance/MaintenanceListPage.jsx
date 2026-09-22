import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import VehicleIcon from '../../components/common/VehicleIcon';
import Badge from '../../components/common/Badge';
import { formatKm, formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaWrench, FaExclamationCircle, FaEdit, FaTrash } from 'react-icons/fa';
import OdometerInputWithScan from '../../components/common/OdometerInputWithScan';
import { useToast } from '../../context/ToastContext';

const MaintenanceListPage = () => {
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
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

  // Preset Service Providers from Settings
  const [presetServiceProviders, setPresetServiceProviders] = useState([
    'Authorized Dealer Service Center',
    'Bosch Service Center',
    'GoMechanic Workshop',
    'Local Garage / Mechanic',
    'In-house Fleet Workshop',
  ]);

  const { hasPermission, isAdmin } = useAuth();

  const fetchPresetServiceProviders = async () => {
    try {
      const res = await API.get('/settings');
      if (res.data.data && Array.isArray(res.data.data.serviceProviders)) {
        setPresetServiceProviders(res.data.data.serviceProviders);
      }
    } catch (err) {
      console.warn('Could not load settings service providers:', err);
    }
  };

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
      console.error('Failed to fetch maintenance records:', err);
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
    fetchRecords(1);
    fetchVehicles();
    fetchPresetServiceProviders();
  }, [search, vehicleId, maintenanceType]);

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    const defaultV = vehicles[0];
    setFormData({
      vehicleId: defaultV ? defaultV._id : '',
      maintenanceType: 'General Service',
      date: new Date().toISOString().split('T')[0],
      odometer: defaultV ? defaultV.currentOdometer : '',
      description: '',
      cost: '',
      serviceProvider: '',
      notes: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (m) => {
    setEditingRecord(m);
    setFormData({
      vehicleId: m.vehicle?._id || '',
      maintenanceType: m.maintenanceType || 'General Service',
      date: m.date ? new Date(m.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      odometer: m.odometer !== undefined ? m.odometer : '',
      description: m.description || '',
      cost: m.cost !== undefined ? m.cost : '',
      serviceProvider: m.serviceProvider || '',
      notes: m.notes || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this maintenance record?')) return;
    try {
      await API.delete(`/maintenance/${id}`);
      toast.success('Maintenance record deleted successfully.');
      fetchRecords(pagination.page);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete maintenance log.';
      toast.error(msg);
    }
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
      const payload = {
        ...formData,
        odometer: Number(formData.odometer),
        cost: Number(formData.cost) || 0,
      };

      if (editingRecord) {
        await API.put(`/maintenance/${editingRecord._id}`, payload);
        toast.success('Maintenance service record updated! 🔧');
      } else {
        await API.post('/maintenance', payload);
        toast.success('Maintenance service log recorded! 🔧');
      }
      setModalOpen(false);
      fetchRecords(pagination.page);
    } catch (err) {
      console.error('Maintenance save error:', err);
      const msg = err.response?.data?.message || 'Failed to save maintenance.';
      setFormError(msg);
      toast.error(msg);
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
    {
      header: 'Actions',
      cell: (m) => (
        <div className="flex items-center space-x-2">
          {(hasPermission('maintenance.edit') || isAdmin) && (
            <button
              onClick={() => handleOpenEditModal(m)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Edit Maintenance Log"
            >
              <FaEdit className="w-4 h-4" />
            </button>
          )}
          {(hasPermission('maintenance.delete') || isAdmin) && (
            <button
              onClick={() => handleDelete(m._id)}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Maintenance Log"
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">General Maintenance & Repairs</h1>
          <p className="text-xs text-slate-500 mt-1">Vehicle periodic servicing, repairs, and part replacement history</p>
        </div>

        {(hasPermission('maintenance.create') || isAdmin) && (
          <button
            onClick={handleOpenAddModal}
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
            <div className="flex justify-end space-x-2 pt-1 border-t border-slate-100">
              {(hasPermission('maintenance.edit') || isAdmin) && (
                <button
                  onClick={() => handleOpenEditModal(m)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <FaEdit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
              {(hasPermission('maintenance.delete') || isAdmin) && (
                <button
                  onClick={() => handleDelete(m._id)}
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
        title={editingRecord ? 'Edit Vehicle Maintenance Log' : 'Record Vehicle Maintenance'}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              Records odometer reading at time of service for maintenance history logs.
            </p>
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Service Provider / Workshop</label>
              <span className="text-[10px] text-slate-400 font-medium">Select preset or type custom</span>
            </div>

            {/* Preset Service Provider Quick Select Chips */}
            {presetServiceProviders.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                {presetServiceProviders.map((preset, idx) => {
                  const isSelected = formData.serviceProvider === preset;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, serviceProvider: preset })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            )}

            <input
              type="text"
              value={formData.serviceProvider}
              onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
              placeholder="e.g. Authorized Dealer, Bosch Service Center, Local Garage"
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
              {formLoading ? 'Saving...' : editingRecord ? 'Update Maintenance Log' : 'Save Maintenance Log'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenanceListPage;

