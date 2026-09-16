import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    vehicleName: {
      type: String,
      required: [true, 'Vehicle Name is required'],
      trim: true,
    },
    numberPlate: {
      type: String,
      required: [true, 'Number Plate is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle Type is required'],
      enum: ['Car', 'Bike', 'Van', 'Truck', 'Bus', 'Auto', 'Other'],
      default: 'Car',
    },
    currentOdometer: {
      type: Number,
      required: [true, 'Current Odometer is required'],
      min: [0, 'Odometer cannot be negative'],
      default: 0,
    },
    make: {
      type: String,
      default: '',
      trim: true,
    },
    model: {
      type: String,
      default: '',
      trim: true,
    },
    year: {
      type: Number,
      default: null,
    },
    color: {
      type: String,
      default: '',
      trim: true,
    },
    engineNumber: {
      type: String,
      default: '',
      trim: true,
    },
    chassisNumber: {
      type: String,
      default: '',
      trim: true,
    },
    fuelType: {
      type: String,
      enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'Other'],
      default: 'Diesel',
    },
    engineOilChangeIntervalKm: {
      type: Number,
      default: 5000,
      min: [100, 'Oil change interval must be at least 100 KM'],
    },
    lastOilChangeOdometer: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastOilChangeDate: {
      type: Date,
      default: null,
    },
    tyreInstallationDate: {
      type: Date,
      default: null,
    },
    tyreReplacementDueDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ vehicleName: 1 });
vehicleSchema.index({ status: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
