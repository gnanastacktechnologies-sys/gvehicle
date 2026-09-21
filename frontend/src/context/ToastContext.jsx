import React, { createContext, useContext, useState, useCallback } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = 'success', duration = 3500) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      const newToast = { id, message, type };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 active toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    show: addToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[9999] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((t) => {
          let bgClass = 'bg-slate-900 text-white border-slate-800';
          let icon = <FaCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />;

          if (t.type === 'success') {
            bgClass = 'bg-emerald-900/95 text-emerald-50 border-emerald-700/60 shadow-lg shadow-emerald-950/20';
            icon = <FaCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
          } else if (t.type === 'error') {
            bgClass = 'bg-rose-900/95 text-rose-50 border-rose-700/60 shadow-lg shadow-rose-950/20';
            icon = <FaExclamationCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />;
          } else if (t.type === 'warning') {
            bgClass = 'bg-amber-900/95 text-amber-50 border-amber-700/60 shadow-lg shadow-amber-950/20';
            icon = <FaExclamationTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />;
          } else if (t.type === 'info') {
            bgClass = 'bg-slate-900/95 text-slate-100 border-indigo-500/50 shadow-lg shadow-slate-950/30';
            icon = <FaInfoCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${bgClass}`}
              role="alert"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                {icon}
                <span className="text-xs font-semibold leading-relaxed tracking-wide truncate">{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="p-1.5 ml-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white/70 hover:text-white flex-shrink-0"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
