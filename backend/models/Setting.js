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
    fuelStations: {
      type: [String],
      default: [
        'IndianOil (IOCL)',
        'Bharat Petroleum (BPCL)',
        'Hindustan Petroleum (HPCL)',
        'Shell',
        'Nayara Energy',
        'Reliance Petroleum',
      ],
    },
    oilBrands: {
      type: [String],
      default: [
        'Castrol',
        'Motul',
        'Shell Helix',
        'Gulf Oil',
        'Servo (IOCL)',
        'Mobil 1',
        'TotalEnergies',
        'Valvoline',
      ],
    },
    tyreBrands: {
      type: [String],
      default: [
        'MRF',
        'CEAT',
        'Apollo Tyres',
        'TVS Eurogrip',
        'JK Tyre',
        'Bridgestone',
        'Michelin',
        'Goodyear',
      ],
    },
    serviceProviders: {
      type: [String],
      default: [
        'Authorized Dealer Service Center',
        'Bosch Service Center',
        'GoMechanic Workshop',
        'Local Garage / Mechanic',
        'In-house Fleet Workshop',
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Setting', settingSchema);
