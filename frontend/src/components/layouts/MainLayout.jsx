import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaChartPie,
  FaCar,
  FaRoute,
  FaUser,
  FaGasPump,
  FaOilCan,
  FaCircleNotch,
  FaWrench,
  FaUsers,
  FaChartBar,
  FaHistory,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUserCircle,
} from 'react-icons/fa';

const getInitials = (name) => {
  if (!name) return 'US';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const MainLayout = ({ children }) => {
  const { user, logout, hasPermission, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FaChartPie, perm: 'dashboard.view' },
    { name: 'Vehicles', path: '/vehicles', icon: FaCar, perm: 'vehicles.view' },
    { name: 'Trips History', path: '/trips', icon: FaRoute, perm: 'trips.view' },
    { name: 'Personal Trips', path: '/personal-trips', icon: FaUser, perm: 'trips.view' },
    { name: 'Fuel Records', path: '/fuel', icon: FaGasPump, perm: 'fuel.view' },
    { name: 'Oil Changes', path: '/oil-changes', icon: FaOilCan, perm: 'oil.view' },
    { name: 'Tyre Tracking', path: '/tyres', icon: FaCircleNotch, perm: 'tyres.view' },
    { name: 'Maintenance', path: '/maintenance', icon: FaWrench, perm: 'maintenance.view' },
    { name: 'Users & Roles', path: '/users', icon: FaUsers, perm: 'users.view' },
    { name: 'Reports', path: '/reports', icon: FaChartBar, perm: 'reports.view' },
    { name: 'Audit Trail', path: '/audit-logs', icon: FaHistory, perm: 'audit.view' },
    { name: 'My Profile', path: '/profile', icon: FaUserCircle, perm: 'all' },
  ];

  const allowedNav = navigationItems.filter((item) => !item.perm || item.perm === 'all' || hasPermission(item.perm));

  const isActivePath = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col md:flex-row">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 h-screen bg-white border-r border-slate-200 z-30 overscroll-contain" style={{ overscrollBehavior: 'contain' }}>
        <div className="flex items-center space-x-3 px-5 h-16 border-b border-slate-100 flex-shrink-0">
          <img src="/logo.png" alt="Gvehicle" className="w-10 h-10 object-contain rounded-lg" />
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-base font-extrabold text-slate-800 leading-tight">Gvehicle</h1>
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-indigo-600 uppercase">Fleet Manager</span>
          </div>
        </div>

        {/* Menu Items with Isolated Scrolling */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 overscroll-contain" style={{ overscrollBehavior: 'contain' }}>
          {allowedNav.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Bottom User Info & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <Link to="/profile" title="View Profile Settings" className="flex items-center space-x-3 overflow-hidden group cursor-pointer">
              <div className="p-2 bg-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all rounded-xl text-indigo-600 font-bold text-xs uppercase">
                {getInitials(user?.name)}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{user?.name}</p>
                <p className="text-[10px] font-medium text-slate-400 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </Link>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
            >
              <FaSignOutAlt className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header - Left Aligned Menu Bar with 2-Letter Circle Profile Avatar */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-3.5 h-16 flex items-center justify-between shadow-2xs">
        {/* Left Side: Menu Bar Icon & App Logo */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors focus:outline-hidden cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
          </button>
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Gvehicle" className="w-8 h-8 object-contain rounded-lg" />
            <span className="text-base font-extrabold text-slate-800 tracking-tight">Gvehicle</span>
          </div>
        </div>

        {/* Right Side: 2-Letter Avatar Circle & Logout Button in Mobile View */}
        <div className="flex items-center space-x-2.5">
          <Link
            to="/profile"
            title={`View Profile (${user?.name || 'User'})`}
            className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center font-extrabold text-xs uppercase shadow-xs transition-all cursor-pointer ring-2 ring-indigo-100 active:scale-95"
          >
            {getInitials(user?.name)}
          </Link>
          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <FaSignOutAlt className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop & Left Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white border-r border-slate-200 overscroll-contain" style={{ overscrollBehavior: 'contain' }}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <img src="/logo.png" alt="Gvehicle" className="w-8 h-8 object-contain rounded-lg" />
                <span className="font-bold text-slate-800">Gvehicle Fleet</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1 overscroll-contain" style={{ overscrollBehavior: 'contain' }}>
              {allowedNav.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-indigo-50 text-indigo-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  title="View Profile"
                  className="flex items-center space-x-2.5 overflow-hidden cursor-pointer group"
                >
                  <div className="p-2 bg-indigo-100 text-indigo-700 font-bold text-xs uppercase rounded-xl flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {getInitials(user?.name)}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer flex-shrink-0"
                >
                  <FaSignOutAlt className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 md:pl-64 min-h-screen flex flex-col">
        <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">{children}</div>
        <footer className="py-4 text-center text-xs text-slate-400 font-medium border-t border-slate-200/60 mt-auto bg-white/50">
          Copyright © 2026 Gnanastack Technologies. All rights reserved.
        </footer>
      </main>
    </div>
  );
};

export default MainLayout;
