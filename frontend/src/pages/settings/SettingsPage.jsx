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
  FaGasPump,
  FaOilCan,
  FaCircleNotch,
  FaWrench,
  FaExclamationCircle,
} from 'react-icons/fa';

const DEFAULT_SETTINGS = {
  tripPurposes: [
    'Office Commute',
    'Client Meeting',
    'Customer Delivery',
    'Site Visit',
    'Vendor Visit',
    'Emergency Maintenance',
    'Personal Ride',
    'Refueling / Fuel Station Visit',
  ],
  fuelStations: [
    'IndianOil (IOCL)',
    'Bharat Petroleum (BPCL)',
    'Hindustan Petroleum (HPCL)',
    'Shell',
    'Nayara Energy',
    'Reliance Petroleum',
  ],
  oilBrands: [
    'Castrol',
    'Motul',
    'Shell Helix',
    'Gulf Oil',
    'Servo (IOCL)',
    'Mobil 1',
    'TotalEnergies',
    'Valvoline',
  ],
  tyreBrands: [
    'MRF',
    'CEAT',
    'Apollo Tyres',
    'TVS Eurogrip',
    'JK Tyre',
    'Bridgestone',
    'Michelin',
    'Goodyear',
  ],
  serviceProviders: [
    'Authorized Dealer Service Center',
    'Bosch Service Center',
    'GoMechanic Workshop',
    'Local Garage / Mechanic',
    'In-house Fleet Workshop',
  ],
};

const SettingsPage = () => {
  const [settingsData, setSettingsData] = useState(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState('tripPurposes');
  const [inputValues, setInputValues] = useState({
    tripPurposes: '',
    fuelStations: '',
    oilBrands: '',
    tyreBrands: '',
    serviceProviders: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toast = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/settings');
      if (res.data.data) {
        const d = res.data.data;
        setSettingsData({
          tripPurposes: Array.isArray(d.tripPurposes) ? d.tripPurposes : DEFAULT_SETTINGS.tripPurposes,
          fuelStations: Array.isArray(d.fuelStations) ? d.fuelStations : DEFAULT_SETTINGS.fuelStations,
          oilBrands: Array.isArray(d.oilBrands) ? d.oilBrands : DEFAULT_SETTINGS.oilBrands,
          tyreBrands: Array.isArray(d.tyreBrands) ? d.tyreBrands : DEFAULT_SETTINGS.tyreBrands,
          serviceProviders: Array.isArray(d.serviceProviders) ? d.serviceProviders : DEFAULT_SETTINGS.serviceProviders,
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Could not load app settings from backend. Showing defaults.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAddPreset = (categoryKey, e) => {
    e.preventDefault();
    const clean = (inputValues[categoryKey] || '').trim();
    if (!clean) return;

    const currentList = settingsData[categoryKey] || [];
    if (currentList.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      toast.warning(`"${clean}" is already in this preset list!`);
      return;
    }

    setSettingsData({
      ...settingsData,
      [categoryKey]: [...currentList, clean],
    });

    setInputValues({ ...inputValues, [categoryKey]: '' });
    toast.info(`Added "${clean}". Remember to click Save Settings to apply.`);
  };

  const handleRemovePreset = (categoryKey, indexToRemove) => {
    const currentList = settingsData[categoryKey] || [];
    const removedName = currentList[indexToRemove];
    setSettingsData({
      ...settingsData,
      [categoryKey]: currentList.filter((_, idx) => idx !== indexToRemove),
    });
    toast.info(`Removed "${removedName}". Click Save Settings to commit.`);
  };

  const handleRestoreCategoryDefaults = (categoryKey) => {
    if (window.confirm(`Restore defaults for this section?`)) {
      setSettingsData({
        ...settingsData,
        [categoryKey]: DEFAULT_SETTINGS[categoryKey],
      });
      toast.info('Restored defaults. Click Save Settings to commit.');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      await API.put('/settings', settingsData);
      toast.success('All System Presets & Settings updated successfully!');
    } catch (err) {
      console.error('Save settings error:', err);
      setError(err.response?.data?.message || 'Failed to save settings.');
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const tabsConfig = [
    { key: 'tripPurposes', label: 'Trip Purposes', icon: FaRoute, desc: 'Preset trip categories for Start Ride modal' },
    { key: 'fuelStations', label: 'Fuel Stations', icon: FaGasPump, desc: 'Preset gas stations & fuel vendors for refueling logs' },
    { key: 'oilBrands', label: 'Oil Brands', icon: FaOilCan, desc: 'Preset engine oil manufacturers & lubricant brands' },
    { key: 'tyreBrands', label: 'Tyre Brands', icon: FaCircleNotch, desc: 'Preset tyre brands & manufacturers for tyre records' },
    { key: 'serviceProviders', label: 'Service Providers', icon: FaWrench, desc: 'Preset mechanics, workshops & service centers for maintenance' },
  ];

  if (loading) {
    return (
      <div className="py-12 text-center space-y-3 animate-pulse">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent" />
        <p className="text-xs font-semibold text-slate-600">Loading System & Preset Settings...</p>
      </div>
    );
  }

  const activeConfig = tabsConfig.find((t) => t.key === activeTab);
  const ActiveIcon = activeConfig?.icon || FaCog;
  const activeList = settingsData[activeTab] || [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2.5">
            <FaCog className="text-indigo-600 w-6 h-6" />
            <span>Settings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage 1-tap quick presets for Trips, Refueling, Oil Changes, Tyres, and Maintenance
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

      {/* Preset Category Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = (settingsData[tab.key] || []).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Category Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <ActiveIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{activeConfig?.label} Presets</h3>
              <p className="text-xs text-slate-500">{activeConfig?.desc}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleRestoreCategoryDefaults(activeTab)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Reset this section to default presets"
          >
            <FaRedo className="w-3 h-3 text-slate-500" />
            <span>Restore Defaults</span>
          </button>
        </div>

        {/* Add New Preset Item Form */}
        <form onSubmit={(e) => handleAddPreset(activeTab, e)} className="flex gap-2">
          <input
            type="text"
            value={inputValues[activeTab] || ''}
            onChange={(e) => setInputValues({ ...inputValues, [activeTab]: e.target.value })}
            placeholder={`Add new ${activeConfig?.label.toLowerCase()} preset...`}
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

        {/* Preset Chips List */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 block">
            Configured Presets ({activeList.length}):
          </span>

          {activeList.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No preset items added. Drivers will type manually.</p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {activeList.map((item, index) => (
                <div
                  key={index}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-2 group hover:border-indigo-200 hover:bg-indigo-50/50 transition-all"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePreset(activeTab, index)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                    title={`Remove "${item}"`}
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
