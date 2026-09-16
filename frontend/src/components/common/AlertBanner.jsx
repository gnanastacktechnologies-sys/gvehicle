import React from 'react';
import { FaExclamationTriangle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

const AlertBanner = ({ type = 'warning', title, message, actionText, onAction }) => {
  let style = 'bg-amber-50 border-amber-200 text-amber-900';
  let Icon = FaExclamationTriangle;
  let iconColor = 'text-amber-500';

  if (type === 'danger') {
    style = 'bg-rose-50 border-rose-200 text-rose-900';
    Icon = FaTimesCircle;
    iconColor = 'text-rose-500';
  } else if (type === 'info') {
    style = 'bg-indigo-50 border-indigo-200 text-indigo-900';
    Icon = FaInfoCircle;
    iconColor = 'text-indigo-500';
  }

  return (
    <div className={`p-4 rounded-xl border flex items-start space-x-3 ${style}`}>
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
      <div className="flex-1">
        {title && <h4 className="text-sm font-semibold mb-0.5">{title}</h4>}
        <p className="text-xs leading-relaxed opacity-90">{message}</p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="text-xs font-semibold underline hover:no-underline px-2 py-1"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
