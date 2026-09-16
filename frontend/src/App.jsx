import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layouts/MainLayout';

import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import VehiclesListPage from './pages/vehicles/VehiclesListPage';
import VehicleDetailPage from './pages/vehicles/VehicleDetailPage';
import TripsListPage from './pages/trips/TripsListPage';
import PersonalTripsPage from './pages/trips/PersonalTripsPage';
import FuelListPage from './pages/fuel/FuelListPage';
import OilChangesListPage from './pages/oil/OilChangesListPage';
import TyresListPage from './pages/tyres/TyresListPage';
import MaintenanceListPage from './pages/maintenance/MaintenanceListPage';
import UsersListPage from './pages/users/UsersListPage';
import ReportsPage from './pages/reports/ReportsPage';
import AuditLogPage from './pages/audit/AuditLogPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/profile/ProfilePage';

// Protected Route Component Wrapper
const ProtectedRoute = ({ children, requiredPerm }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPerm && !hasPermission(requiredPerm)) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 mt-10">
        <h2 className="text-lg font-bold text-rose-600">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">You do not have permission to view this module ({requiredPerm}).</p>
      </div>
    );
  }

  return children;
};

// Layout Protected Route
const LayoutRoute = ({ children, requiredPerm }) => {
  return (
    <ProtectedRoute requiredPerm={requiredPerm}>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <LayoutRoute requiredPerm="dashboard.view">
            <DashboardPage />
          </LayoutRoute>
        }
      />

      <Route
        path="/vehicles"
        element={
          <LayoutRoute requiredPerm="vehicles.view">
            <VehiclesListPage />
          </LayoutRoute>
        }
      />

      <Route
        path="/vehicles/:id"
        element={
          <LayoutRoute requiredPerm="vehicles.view">
            <VehicleDetailPage />
          </LayoutRoute>
        }
      />

      <Route
        path="/trips"
        element={
          <LayoutRoute requiredPerm="trips.view">
            <TripsListPage />
          </LayoutRoute>
        }
      />

      <Route
        path="/personal-trips"
        element={
          <LayoutRoute requiredPerm="trips.view">
            <PersonalTripsPage />
          </LayoutRoute>
        }
      />

      <Route
        path="/fuel"
        element={
          <LayoutRoute requiredPerm="fuel.view">
            <FuelListPage />
          </LayoutRoute>
        }
      />

      <Route
        path="/oil-changes"
        element={
          <LayoutRoute requiredPerm="oil.view">
            <OilChangesListPage />
          </LayoutRoute>
        }
      />

      <Route
        path="/tyres"
        element={
          <LayoutRoute requiredPerm="tyres.view">
            <TyresListPage />
          </LayoutRoute>
        }
      />

      <Route
        path="/maintenance"
        element={
          <LayoutRoute requiredPerm="maintenance.view">
            <MaintenanceListPage />
          </LayoutRoute>
        }
      />

      <Route
        path="/users"
        element={
          <LayoutRoute requiredPerm="users.view">
            <UsersListPage />
          </LayoutRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <LayoutRoute requiredPerm="reports.view">
            <ReportsPage />
          </LayoutRoute>
        }
      />

      <Route
        path="/audit-logs"
        element={
          <LayoutRoute requiredPerm="audit.view">
            <AuditLogPage />
          </LayoutRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <LayoutRoute>
            <SettingsPage />
          </LayoutRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <LayoutRoute>
            <ProfilePage />
          </LayoutRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
