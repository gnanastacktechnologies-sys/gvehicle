import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
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
    purpose: {
      type: String,
      required: [true, 'Trip purpose is required'],
      trim: true,
    },
    tripType: {
      type: String,
      enum: ['BUSINESS', 'PERSONAL'],
      default: 'BUSINESS',
    },
    startOdometer: {
      type: Number,
      required: [true, 'Start odometer is required'],
      min: 0,
    },
    endOdometer: {
      type: Number,
      default: null,
      min: 0,
    },
    distance: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED'],
      default: 'ACTIVE',
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

tripSchema.index({ vehicle: 1, status: 1 });
tripSchema.index({ user: 1 });
tripSchema.index({ startDate: -1 });

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
