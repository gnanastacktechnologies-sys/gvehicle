import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'app_settings' },
    tripPurposes: {
      type: [String],
      default: [
        'Office Commute',
        'Client Meeting',
        'Customer Delivery',
        'Site Visit',
        'Vendor Visit',
        'Emergency Maintenance',
        'Personal Ride',
        'Refueling / Fuel Station Visit',
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Setting', settingSchema);
