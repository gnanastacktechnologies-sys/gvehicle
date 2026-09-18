import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import VehicleIcon from '../../components/common/VehicleIcon';
import Badge from '../../components/common/Badge';
import { formatKm, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaEye, FaEdit, FaTrash, FaExclamationCircle } from 'react-icons/fa';

const VehiclesListPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehicleName: '',
    numberPlate: '',
    vehicleType: 'Car',
    currentOdometer: 0,
    fuelType: 'Diesel',
    engineOilChangeIntervalKm: 5000,
    make: '',
    model: '',
    year: '',
    color: '',
    engineNumber: '',
    chassisNumber: '',
    notes: '',
    status: 'ACTIVE',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const { hasPermission, isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchVehicles = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search,
        vehicleType,
        status,
        sortBy,
        sortOrder,
      };
      const res = await API.get('/vehicles', { params });
      setVehicles(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles(1);
  }, [search, vehicleType, status, sortBy, sortOrder]);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({
      vehicleName: '',
      numberPlate: '',
      vehicleType: 'Car',
      currentOdometer: '',
      fuelType: 'Diesel',
      engineOilChangeIntervalKm: 5000,
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      engineNumber: '',
      chassisNumber: '',
      notes: '',
      status: 'ACTIVE',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVehicle(v);
    setFormData({
      vehicleName: v.vehicleName || '',
      numberPlate: v.numberPlate || '',
      vehicleType: v.vehicleType || 'Car',
      currentOdometer: v.currentOdometer || 0,
      fuelType: v.fuelType || 'Diesel',
      engineOilChangeIntervalKm: v.engineOilChangeIntervalKm || 5000,
      make: v.make || '',
      model: v.model || '',
      year: v.year || '',
      color: v.color || '',
      engineNumber: v.engineNumber || '',
      chassisNumber: v.chassisNumber || '',
      notes: v.notes || '',
      status: v.status || 'ACTIVE',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.vehicleName || !formData.numberPlate || !formData.vehicleType || formData.currentOdometer === '') {
      setFormError('Vehicle Name, Number Plate, Vehicle Type, and Current Odometer are required.');
      return;
    }

    const payload = {
      ...formData,
      currentOdometer: Number(formData.currentOdometer) || 0,
      engineOilChangeIntervalKm: Number(formData.engineOilChangeIntervalKm) || 5000,
    };

    try {
      setFormLoading(true);
      if (editingVehicle) {
        await API.put(`/vehicles/${editingVehicle._id}`, payload);
      } else {
        await API.post('/vehicles', payload);
      }
      setModalOpen(false);
      fetchVehicles(pagination.page);
    } catch (err) {
      console.error('Vehicle form save error:', err);
      setFormError(err.response?.data?.message || 'Failed to save vehicle.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await API.delete(`/vehicles/${id}`);
      fetchVehicles(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete vehicle.');
    }
  };

  const columns = [
    {
      header: 'Vehicle',
      accessor: 'vehicleName',
      cell: (v) => (
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-100 rounded-xl text-indigo-600">
            <VehicleIcon type={v.vehicleType} className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 block">{v.vehicleName}</span>
            <span className="text-xs text-slate-400">{v.make} {v.model}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Number Plate',
      accessor: 'numberPlate',
      cell: (v) => <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-xs">{v.numberPlate}</span>,
    },
    {
      header: 'Type',
      accessor: 'vehicleType',
      cell: (v) => <span className="text-xs font-medium text-slate-600">{v.vehicleType}</span>,
    },
    {
      header: 'Current Odometer',
      accessor: 'currentOdometer',
      cell: (v) => <span className="font-semibold text-slate-800">{formatKm(v.currentOdometer)}</span>,
    },
    {
      header: 'Oil Status',
      cell: (v) => <Badge status={v.oilStatus?.status} text={`${v.oilStatus?.status} (${v.oilStatus?.kmRemaining} KM left)`} />,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (v) => <Badge status={v.status} />,
    },
    {
      header: 'Actions',
      cell: (v) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/vehicles/${v._id}`)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            title="View Vehicle Profile"
          >
            <FaEye className="w-4 h-4" />
          </button>
          {(hasPermission('vehicles.edit') || isAdmin) && (
            <button
              onClick={() => handleOpenEdit(v)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Edit Vehicle"
            >
              <FaEdit className="w-4 h-4" />
            </button>
          )}
          {(hasPermission('vehicles.delete') || isAdmin) && (
            <button
              onClick={() => handleDelete(v._id)}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Vehicle"
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fleet Vehicle Management</h1>
          <p className="text-xs text-slate-500 mt-1">Manage all registered fleet vehicles and odometer records</p>
        </div>

        {(hasPermission('vehicles.create') || isAdmin) && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <FaPlus className="w-4 h-4" />
            <span>Add New Vehicle</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={vehicles}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchVehicles(p)}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search vehicle name or plate..."
        filters={[
          {
            key: 'vehicleType',
            label: 'All Vehicle Types',
            options: [
              { label: 'Car', value: 'Car' },
              { label: 'Bike', value: 'Bike' },
              { label: 'Van', value: 'Van' },
              { label: 'Truck', value: 'Truck' },
              { label: 'Bus', value: 'Bus' },
              { label: 'Auto', value: 'Auto' },
              { label: 'Other', value: 'Other' },
            ],
          },
          {
            key: 'status',
            label: 'All Statuses',
            options: [
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
            ],
          },
        ]}
        filterValues={{ vehicleType, status }}
        onFilterChange={(key, val) => {
          if (key === 'vehicleType') setVehicleType(val);
          if (key === 'status') setStatus(val);
        }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={(col, order) => {
          setSortBy(col);
          setSortOrder(order);
        }}
        emptyMessage="No fleet vehicles registered."
        renderMobileCard={(v) => (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <VehicleIcon type={v.vehicleType} className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{v.vehicleName}</h4>
                  <span className="font-mono text-xs text-slate-500 font-bold">{v.numberPlate}</span>
                </div>
              </div>
              <Badge status={v.status} />
            </div>
            <div className="text-xs text-slate-600 flex justify-between bg-slate-50 p-2.5 rounded-xl">
              <span>Odometer: <strong>{formatKm(v.currentOdometer)}</strong></span>
              <span>Oil: <Badge status={v.oilStatus?.status} /></span>
            </div>
            <div className="flex justify-end space-x-2 pt-1">
              <button
                onClick={() => navigate(`/vehicles/${v._id}`)}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
              >
                <FaEye className="w-3.5 h-3.5" />
                <span>View</span>
              </button>
              {(hasPermission('vehicles.edit') || isAdmin) && (
                <button
                  onClick={() => handleOpenEdit(v)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <FaEdit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
              {(hasPermission('vehicles.delete') || isAdmin) && (
                <button
                  onClick={() => handleDelete(v._id)}
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

      {/* Add / Edit Vehicle Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVehicle ? 'Edit Vehicle Profile' : 'Add New Fleet Vehicle'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
              <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
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
                placeholder="Toyota Innova"
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
                placeholder="TN 33 AB 1234"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Odometer (KM) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.currentOdometer}
                onChange={(e) => setFormData({ ...formData, currentOdometer: e.target.value })}
                placeholder="e.g. 45230"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Oil Change Interval (KM)</label>
              <input
                type="number"
                min="100"
                value={formData.engineOilChangeIntervalKm}
                onChange={(e) => setFormData({ ...formData, engineOilChangeIntervalKm: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Make</label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                placeholder="Toyota"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Innova Crysta"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
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
              {formLoading ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VehiclesListPage;
