export const formatKm = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0 KM';
  return `${Number(value).toLocaleString('en-IN')} KM`;
};

export const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '₹0';
  return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
