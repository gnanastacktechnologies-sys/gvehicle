import React from 'react';
import { FaCar, FaMotorcycle, FaShuttleVan, FaTruck, FaBus, FaTaxi, FaGasPump } from 'react-icons/fa';

const VehicleIcon = ({ type, className = 'w-5 h-5' }) => {
  const normalized = (type || '').toLowerCase();

  switch (normalized) {
    case 'car':
      return <FaCar className={className} />;
    case 'bike':
    case 'motorcycle':
      return <FaMotorcycle className={className} />;
    case 'van':
      return <FaShuttleVan className={className} />;
    case 'truck':
      return <FaTruck className={className} />;
    case 'bus':
      return <FaBus className={className} />;
    case 'auto':
    case 'rickshaw':
    case 'taxi':
      return <FaTaxi className={className} />;
    default:
      return <FaGasPump className={className} />;
  }
};

export default VehicleIcon;
