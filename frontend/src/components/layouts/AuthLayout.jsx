import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex items-center justify-center p-2 bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 mb-3">
          <img src="/logo.png" alt="Gvehicle Logo" className="w-24 h-24 object-contain rounded-2xl" />
        </div>
        <div className="flex items-center justify-center space-x-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gvehicle</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Vehicle & Fleet Management System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 sm:px-10">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-slate-400 font-medium">
          Copyright © 2026 Gnanastack Technologies. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
