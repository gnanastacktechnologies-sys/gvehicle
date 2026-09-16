import mongoose from 'mongoose';

const fuelEntrySchema = new mongoose.Schema(
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
      required: [true, 'Odometer reading is required'],
      min: 0,
    },
    fuelType: {
      type: String,
      default: 'Diesel',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity in litres is required'],
      min: [0.01, 'Quantity must be greater than 0'],
    },
    pricePerLitre: {
      type: Number,
      required: [true, 'Price per litre is required'],
      min: [0, 'Price cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    fuelStation: {
      type: String,
      default: '',
      trim: true,
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

fuelEntrySchema.index({ vehicle: 1, date: -1 });

const FuelEntry = mongoose.model('FuelEntry', fuelEntrySchema);
export default FuelEntry;
