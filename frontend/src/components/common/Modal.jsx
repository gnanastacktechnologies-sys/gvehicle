import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

let activeModalsCount = 0;

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg', zIndex = 50 }) => {
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
    <div
      className="fixed inset-0 overflow-y-auto overflow-x-hidden w-full max-w-full touch-pan-y overscroll-contain"
      style={{ zIndex }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
        style={{ zIndex }}
      />

      {/* Modal Container */}
      <div
        className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center overscroll-contain w-full max-w-full overflow-x-hidden relative"
        style={{ zIndex: zIndex + 10 }}
      >
        <div
          className={`relative w-full max-w-[95vw] ${maxWidth} max-h-[88vh] sm:max-h-[90vh] flex flex-col transform overflow-hidden rounded-2xl bg-white p-3.5 sm:p-6 text-left align-middle shadow-2xl transition-all border border-slate-100 my-auto`}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5 sm:pb-4 sm:mb-4 flex-shrink-0">
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
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y pr-0.5 space-y-2 w-full"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
