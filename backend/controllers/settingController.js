import Setting from '../models/Setting.js';

// Get current system settings (create default if missing)
export const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({ key: 'app_settings' });
    if (!settings) {
      settings = await Setting.create({ key: 'app_settings' });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

// Update system settings
export const updateSettings = async (req, res) => {
  try {
    const { tripPurposes, fuelStations, oilBrands, tyreBrands, serviceProviders } = req.body;

    let settings = await Setting.findOne({ key: 'app_settings' });
    if (!settings) {
      settings = new Setting({ key: 'app_settings' });
    }

    const sanitizeList = (list) => {
      if (!Array.isArray(list)) return undefined;
      const cleaned = list.map((p) => String(p).trim()).filter(Boolean);
      return Array.from(new Set(cleaned));
    };

    if (tripPurposes !== undefined) settings.tripPurposes = sanitizeList(tripPurposes);
    if (fuelStations !== undefined) settings.fuelStations = sanitizeList(fuelStations);
    if (oilBrands !== undefined) settings.oilBrands = sanitizeList(oilBrands);
    if (tyreBrands !== undefined) settings.tyreBrands = sanitizeList(tyreBrands);
    if (serviceProviders !== undefined) settings.serviceProviders = sanitizeList(serviceProviders);

    await settings.save();
    res.json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};
