import React from 'react';

const Badge = ({ status, text }) => {
  const norm = (status || '').toUpperCase();
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  if (norm === 'ACTIVE' || norm === 'COMPLETED' || norm === 'NORMAL') {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (norm === 'DUE_SOON' || norm === 'WARNING') {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (norm === 'OVERDUE' || norm === 'INACTIVE' || norm === 'DANGER') {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (norm === 'IN_PROGRESS' || norm === 'INFO') {
    badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }

  const displayText = text || norm.replace('_', ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {displayText}
    </span>
  );
};

export default Badge;
