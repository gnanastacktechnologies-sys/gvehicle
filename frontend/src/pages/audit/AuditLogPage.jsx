import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { formatDateTime } from '../../utils/formatters';
import { FaHistory, FaUserShield } from 'react-icons/fa';

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const res = await API.get('/audit-logs', {
        params: { page, limit: 15, search, module },
      });
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [search, module]);

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'createdAt',
      cell: (l) => <span className="font-semibold text-slate-800 text-xs">{formatDateTime(l.createdAt)}</span>,
    },
    {
      header: 'User',
      cell: (l) => (
        <div className="flex items-center space-x-1.5">
          <FaUserShield className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-semibold text-slate-800 text-xs">{l.user?.name || 'System'}</span>
        </div>
      ),
    },
    {
      header: 'Module',
      accessor: 'module',
      cell: (l) => <Badge status="INFO" text={l.module} />,
    },
    {
      header: 'Action',
      accessor: 'action',
      cell: (l) => <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{l.action}</span>,
    },
    {
      header: 'Notes / Audit Reason',
      accessor: 'notes',
      cell: (l) => <span className="text-xs text-slate-600 font-medium">{l.notes || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center space-x-2">
          <FaHistory className="text-indigo-600" />
          <span>System Audit Activity Trail</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">Immutable record of odometer corrections, user edits, and fleet modifications</p>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchLogs(p)}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search audit notes or action..."
        filters={[
          {
            key: 'module',
            label: 'All Modules',
            options: [
              { label: 'AUTH', value: 'AUTH' },
              { label: 'USERS', value: 'USERS' },
              { label: 'VEHICLES', value: 'VEHICLES' },
              { label: 'TRIPS', value: 'TRIPS' },
              { label: 'FUEL', value: 'FUEL' },
              { label: 'OIL', value: 'OIL' },
              { label: 'TYRES', value: 'TYRES' },
              { label: 'MAINTENANCE', value: 'MAINTENANCE' },
            ],
          },
        ]}
        filterValues={{ module }}
        onFilterChange={(k, v) => setModule(v)}
        emptyMessage="No audit activity recorded."
        renderMobileCard={(l) => (
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-slate-800">{l.action}</span>
              <Badge status="INFO" text={l.module} />
            </div>
            <p className="text-slate-600 font-medium">{l.notes}</p>
            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
              <span>By: {l.user?.name}</span>
              <span>{formatDateTime(l.createdAt)}</span>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default AuditLogPage;
