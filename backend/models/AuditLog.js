import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    module: {
      type: String,
      required: true,
      enum: ['AUTH', 'USERS', 'VEHICLES', 'TRIPS', 'FUEL', 'OIL', 'TYRES', 'MAINTENANCE', 'SETTINGS'],
    },
    recordId: {
      type: String,
      default: null,
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
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

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1 });
auditLogSchema.index({ user: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
