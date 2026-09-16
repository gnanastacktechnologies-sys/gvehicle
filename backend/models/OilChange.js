import mongoose from 'mongoose';

const oilChangeSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      default: Date.now,
    },
    odometer: {
      type: Number,
      required: [true, 'Odometer reading at oil change is required'],
      min: 0,
    },
    oilType: {
      type: String,
      default: 'Synthetic',
      trim: true,
    },
    oilBrand: {
      type: String,
      default: '',
      trim: true,
    },
    quantity: {
      type: Number,
      default: 0,
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
    nextOilChangeOdometer: {
      type: Number,
      required: true,
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

oilChangeSchema.index({ vehicle: 1, date: -1 });

const OilChange = mongoose.model('OilChange', oilChangeSchema);
export default OilChange;
