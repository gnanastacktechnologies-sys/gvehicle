import mongoose from 'mongoose';

const tyreSchema = new mongoose.Schema(
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
    installationDate: {
      type: Date,
      default: Date.now,
    },
    brand: {
      type: String,
      default: '',
      trim: true,
    },
    model: {
      type: String,
      default: '',
      trim: true,
    },
    position: {
      type: String,
      default: 'All Four',
      trim: true,
    },
    quantity: {
      type: Number,
      default: 4,
      min: 1,
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    odometer: {
      type: Number,
      default: 0,
      min: 0,
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

tyreSchema.index({ vehicle: 1, installationDate: -1 });

const Tyre = mongoose.model('Tyre', tyreSchema);
export default Tyre;
