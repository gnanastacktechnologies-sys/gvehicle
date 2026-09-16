import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    maintenanceType: {
      type: String,
      enum: ['General Service', 'Brake Service', 'Battery Replacement', 'AC Service', 'Engine Repair', 'Filter Change', 'Other'],
      default: 'General Service',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    odometer: {
      type: Number,
      required: [true, 'Odometer reading at maintenance is required'],
      min: 0,
    },
    description: {
      type: String,
      required: [true, 'Maintenance description is required'],
      trim: true,
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    serviceProvider: {
      type: String,
      default: '',
      trim: true,
    },
    nextDueDate: {
      type: Date,
      default: null,
    },
    nextDueOdometer: {
      type: Number,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

maintenanceSchema.index({ vehicle: 1, date: -1 });

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);
export default Maintenance;
