import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  FaCog,
  FaPlus,
  FaTrash,
  FaSave,
  FaRedo,
  FaRoute,
  FaCheckCircle,
  FaExclamationCircle,
} from 'react-icons/fa';

const DEFAULT_PURPOSES = [
  'Office Commute',
  'Client Meeting',
  'Customer Delivery',
  'Site Visit',
  'Vendor Visit',
  'Emergency Maintenance',
  'Personal Ride',
  'Refueling / Fuel Station Visit',
];

const SettingsPage = () => {
  const [purposes, setPurposes] = useState([]);
  const [newPurposeInput, setNewPurposeInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toast = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/settings');
      if (res.data.data && Array.isArray(res.data.data.tripPurposes)) {
        setPurposes(res.data.data.tripPurposes);
      } else {
        setPurposes(DEFAULT_PURPOSES);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Could not load app settings from backend. Showing defaults.');
      setPurposes(DEFAULT_PURPOSES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAddPurpose = (e) => {
    e.preventDefault();
    const clean = newPurposeInput.trim();
    if (!clean) return;

    if (purposes.some((p) => p.toLowerCase() === clean.toLowerCase())) {
      toast.warning(`"${clean}" is already in your preset list!`);
      return;
    }

    setPurposes([...purposes, clean]);
    setNewPurposeInput('');
    toast.info(`Added "${clean}" to temporary list. Click Save Settings to persist.`);
  };

  const handleRemovePurpose = (indexToRemove) => {
    const removedName = purposes[indexToRemove];
    setPurposes(purposes.filter((_, idx) => idx !== indexToRemove));
    toast.info(`Removed "${removedName}". Click Save Settings to commit changes.`);
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('Restore preset trip purposes to system default list?')) {
      setPurposes(DEFAULT_PURPOSES);
      toast.info('Restored system defaults. Remember to click Save Settings!');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      await API.put('/settings', { tripPurposes: purposes });
      toast.success('Trip purpose presets updated successfully!');
    } catch (err) {
      console.error('Save settings error:', err);
      setError(err.response?.data?.message || 'Failed to save settings.');
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center space-y-3 animate-pulse">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent" />
        <p className="text-xs font-semibold text-slate-600">Loading App & Trip Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2.5">
            <FaCog className="text-indigo-600 w-6 h-6" />
            <span>App & Trip Settings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure system defaults and preset trip purposes for Start/Stop ride entry
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50"
        >
          <FaSave className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
          <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Trip Purposes Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <FaRoute className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Preset Trip Purposes</h3>
              <p className="text-xs text-slate-500">
                Drivers can 1-click select these trip purposes when starting a ride, or type a custom purpose.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Reset to default preset purposes"
          >
            <FaRedo className="w-3 h-3 text-slate-500" />
            <span>Restore Defaults</span>
          </button>
        </div>

        {/* Add New Preset Purpose Form */}
        <form onSubmit={handleAddPurpose} className="flex gap-2">
          <input
            type="text"
            value={newPurposeInput}
            onChange={(e) => setNewPurposeInput(e.target.value)}
            placeholder="Add new preset trip purpose (e.g. Branch Audit, Vendor Meeting)"
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <FaPlus className="w-3 h-3" />
            <span>Add Preset</span>
          </button>
        </form>

        {/* Active Purpose Chips List */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 block">
            Active Presets ({purposes.length}):
          </span>

          {purposes.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No preset purposes configured. Drivers will type manually.</p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {purposes.map((purpose, index) => (
                <div
                  key={index}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-2 group hover:border-indigo-200 hover:bg-indigo-50/50 transition-all"
                >
                  <span>{purpose}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePurpose(index)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                    title={`Remove "${purpose}"`}
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Save Action Footer */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50"
        >
          <FaSave className="w-4 h-4" />
          <span>{saving ? 'Saving System Settings...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
