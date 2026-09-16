import React from 'react';
import { FaSearch, FaSort, FaSortUp, FaSortDown, FaChevronLeft, FaChevronRight, FaInbox } from 'react-icons/fa';

const DataTable = ({
  columns,
  data = [],
  loading = false,
  pagination = { page: 1, limit: 10, total: 0, totalPages: 1 },
  onPageChange,
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  filterValues = {},
  onFilterChange,
  sortBy = '',
  sortOrder = 'desc',
  onSort,
  renderMobileCard,
  emptyMessage = 'No records found',
}) => {
  const handleSortClick = (accessor) => {
    if (!onSort || !accessor) return;
    if (sortBy === accessor) {
      onSort(accessor, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(accessor, 'asc');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
      {/* Top Filter & Search Controls Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
        {/* Search Bar */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        )}

        {/* Dynamic Select Filters */}
        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((f) => (
              <select
                key={f.key}
                value={filterValues[f.key] || ''}
                onChange={(e) => onFilterChange && onFilterChange(f.key, e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-hidden focus:border-indigo-500 transition-all"
              >
                <option value="">{f.label}</option>
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="p-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <FaInbox className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card List View (Visible on small screens) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {data.map((item, idx) => (
              <div key={item._id || idx} className="p-4 hover:bg-slate-50 transition-colors">
                {renderMobileCard ? (
                  renderMobileCard(item)
                ) : (
                  <div className="space-y-2">
                    {columns.map((col) => (
                      <div key={col.header} className="flex justify-between text-sm">
                        <span className="text-slate-400 font-medium">{col.header}:</span>
                        <span className="text-slate-800 font-semibold">
                          {col.cell ? col.cell(item) : item[col.accessor]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-100 font-semibold">
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      onClick={() => col.accessor && handleSortClick(col.accessor)}
                      className={`py-3.5 px-4 ${
                        col.accessor && onSort ? 'cursor-pointer select-none hover:text-slate-700' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{col.header}</span>
                        {col.accessor && onSort && (
                          <span className="text-slate-400">
                            {sortBy === col.accessor ? (
                              sortOrder === 'asc' ? (
                                <FaSortUp className="text-indigo-600" />
                              ) : (
                                <FaSortDown className="text-indigo-600" />
                              )
                            ) : (
                              <FaSort className="opacity-40" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {data.map((item, rowIdx) => (
                  <tr key={item._id || rowIdx} className="hover:bg-slate-50/80 transition-colors">
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="py-3.5 px-4 text-slate-700 align-middle">
                        {col.cell ? col.cell(item) : item[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-sm">
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-semibold text-slate-700">{pagination.total}</span> entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <FaChevronLeft className="w-3 h-3" />
            </button>
            <span className="text-xs font-semibold text-slate-700 px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <FaChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
