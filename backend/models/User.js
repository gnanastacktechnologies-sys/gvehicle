import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ALL_PERMISSIONS = [
  'dashboard.view',
  'vehicles.view',
  'vehicles.create',
  'vehicles.edit',
  'vehicles.delete',
  'trips.view',
  'trips.create',
  'trips.edit',
  'trips.delete',
  'fuel.view',
  'fuel.create',
  'fuel.edit',
  'fuel.delete',
  'oil.view',
  'oil.create',
  'oil.edit',
  'oil.delete',
  'tyres.view',
  'tyres.create',
  'tyres.edit',
  'tyres.delete',
  'maintenance.view',
  'maintenance.create',
  'maintenance.edit',
  'maintenance.delete',
  'users.view',
  'users.create',
  'users.edit',
  'users.delete',
  'reports.view',
  'audit.view'
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'USER'],
      default: 'USER',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export { ALL_PERMISSIONS };
export default User;
