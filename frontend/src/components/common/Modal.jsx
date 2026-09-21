import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

let activeModalsCount = 0;

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      activeModalsCount++;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';
      document.documentElement.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (isOpen) {
        activeModalsCount = Math.max(0, activeModalsCount - 1);
        window.removeEventListener('keydown', handleKeyDown);

        if (activeModalsCount === 0) {
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
          document.documentElement.style.overflow = '';
        }
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center overscroll-contain">
        <div
          className={`relative w-full ${maxWidth} transform overflow-hidden rounded-2xl bg-white p-4 sm:p-6 text-left align-middle shadow-2xl transition-all border border-slate-100 my-auto`}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 sm:pb-4 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-hidden cursor-pointer"
              aria-label="Close dialog"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="max-h-[80vh] overflow-y-auto overscroll-contain pr-0.5 space-y-2">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
