import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { FaUserPlus, FaEdit, FaTrash, FaExclamationCircle, FaShieldAlt, FaEye, FaEyeSlash } from 'react-icons/fa';

const UsersListPage = () => {
  const [users, setUsers] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'USER',
    status: 'ACTIVE',
    permissions: [],
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const { hasPermission, user: currentUser } = useAuth();

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10, search, role, status };
      const res = await API.get('/users', { params });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await API.get('/users/permissions');
      setAllPermissions(res.data.data);
    } catch (err) {
      console.error('Failed to fetch permissions list:', err);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    fetchPermissions();
  }, [search, role, status]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'USER',
      status: 'ACTIVE',
      permissions: ['dashboard.view', 'vehicles.view', 'trips.view', 'trips.create', 'fuel.view'],
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      password: '',
      role: u.role || 'USER',
      status: u.status || 'ACTIVE',
      permissions: u.permissions || [],
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleTogglePermission = (perm) => {
    if (formData.permissions.includes(perm)) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter((p) => p !== perm),
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, perm],
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || (!editingUser && !formData.password)) {
      setFormError('Name and password are required.');
      return;
    }

    try {
      setFormLoading(true);
      if (editingUser) {
        await API.put(`/users/${editingUser._id}`, formData);
      } else {
        await API.post('/users', formData);
      }
      setModalOpen(false);
      fetchUsers(pagination.page);
    } catch (err) {
      console.error('User save error:', err);
      setFormError(err.response?.data?.message || 'Failed to save user account.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await API.delete(`/users/${id}`);
      fetchUsers(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const columns = [
    {
      header: 'User Name',
      accessor: 'name',
      cell: (u) => (
        <div>
          <span className="font-semibold text-slate-800 block text-xs">{u.name}</span>
          <span className="text-[11px] text-slate-400">{u.email}</span>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'role',
      cell: (u) => <Badge status={u.role === 'ADMIN' ? 'INFO' : 'NORMAL'} text={u.role} />,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (u) => <Badge status={u.status} />,
    },
    {
      header: 'Permissions Count',
      cell: (u) => (
        <span className="text-xs text-slate-600 font-medium">
          {u.role === 'ADMIN' ? 'Full Access (Admin)' : `${u.permissions?.length || 0} granted`}
        </span>
      ),
    },
    {
      header: 'Joined Date',
      cell: (u) => <span className="text-xs text-slate-400">{formatDate(u.createdAt)}</span>,
    },
    {
      header: 'Actions',
      cell: (u) => (
        <div className="flex items-center space-x-2">
          {hasPermission('users.edit') && (
            <button
              onClick={() => handleOpenEdit(u)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Edit User & Permissions"
            >
              <FaEdit className="w-4 h-4" />
            </button>
          )}
          {hasPermission('users.delete') && u._id !== currentUser?._id && (
            <button
              onClick={() => handleDelete(u._id)}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete User"
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">User Account & Permissions</h1>
          <p className="text-xs text-slate-500 mt-1">Manage user access control and module-level permissions</p>
        </div>

        {hasPermission('users.create') && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <FaUserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchUsers(p)}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email or phone..."
        filters={[
          {
            key: 'role',
            label: 'All Roles',
            options: [
              { label: 'Admin', value: 'ADMIN' },
              { label: 'User / Driver', value: 'USER' },
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
        filterValues={{ role, status }}
        onFilterChange={(k, v) => {
          if (k === 'role') setRole(v);
          if (k === 'status') setStatus(v);
        }}
        emptyMessage="No user accounts found."
        renderMobileCard={(u) => (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-800">{u.name}</h4>
                <p className="text-slate-400">{u.email}</p>
              </div>
              <Badge status={u.status} />
            </div>
            <div className="flex justify-between text-slate-600 bg-slate-50 p-2 rounded-lg">
              <span>Role: <strong>{u.role}</strong></span>
              <span>Permissions: {u.role === 'ADMIN' ? 'All' : u.permissions?.length}</span>
            </div>
          </div>
        )}
      />

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit User & Permissions' : 'Create User Account'}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="driver@gvehicle.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {editingUser ? 'Password (leave blank to keep unchanged)' : 'Password *'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="USER">User / Staff</option>
                <option value="ADMIN">System Admin (Full Permissions)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive (Deactivated)</option>
              </select>
            </div>
          </div>

          {/* Permission Editor Matrix */}
          {formData.role !== 'ADMIN' && (
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1.5">
                <FaShieldAlt className="text-indigo-600" />
                <span>Granted Module Permissions</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                {allPermissions.map((perm) => {
                  const checked = formData.permissions.includes(perm);
                  return (
                    <label
                      key={perm}
                      className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer p-1 rounded-sm hover:bg-slate-200/50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleTogglePermission(perm)}
                        className="rounded-xs text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-mono text-[11px]">{perm}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

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
              {formLoading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersListPage;
