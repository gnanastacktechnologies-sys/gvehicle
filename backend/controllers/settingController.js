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
    const { tripPurposes } = req.body;

    let settings = await Setting.findOne({ key: 'app_settings' });
    if (!settings) {
      settings = new Setting({ key: 'app_settings' });
    }

    if (Array.isArray(tripPurposes)) {
      // Clean and sanitize string values
      const cleaned = tripPurposes.map((p) => String(p).trim()).filter(Boolean);
      settings.tripPurposes = Array.from(new Set(cleaned));
    }

    await settings.save();
    res.json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};
