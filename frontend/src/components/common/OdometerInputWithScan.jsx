import React, { useState } from 'react';
import { FaCamera } from 'react-icons/fa';
import OdometerScannerModal from './OdometerScannerModal';

const OdometerInputWithScan = ({
  value,
  onChange,
  label = 'Odometer Reading (KM) *',
  placeholder = 'e.g. 154230',
  required = false,
  min = 0,
  disabled = false,
  className = '',
}) => {
  const [scannerOpen, setScannerOpen] = useState(false);

  return (
    <div>
      {label && <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>}
      <div className="flex items-center space-x-2">
        <input
          type="number"
          required={required}
          min={min}
          disabled={disabled}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden ${className}`}
        />
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          disabled={disabled}
          title="Scan Odometer with Camera"
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer flex-shrink-0 disabled:opacity-50 shadow-sm shadow-indigo-100"
        >
          <FaCamera className="w-3.5 h-3.5 text-white" />
          <span>Scan Odometer</span>
        </button>
      </div>

      <OdometerScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        initialValue={value}
        onConfirm={(scannedValue) => {
          // Synthetic change event to work seamlessly with React form state handlers
          const syntheticEvent = {
            target: {
              name: 'odometer',
              value: String(scannedValue),
            },
          };
          onChange(syntheticEvent);
        }}
      />
    </div>
  );
};

export default OdometerInputWithScan;
