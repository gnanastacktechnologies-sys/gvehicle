import AuditLog from '../models/AuditLog.js';

export const logAudit = ({ user, action, module, recordId = null, previousValue = null, newValue = null, notes = '' }) => {
  if (!user) return;
  const userId = typeof user === 'object' ? user._id || user.id : user;

  // Asynchronous non-blocking background write
  AuditLog.create({
    user: userId,
    action,
    module,
    recordId: recordId ? recordId.toString() : null,
    previousValue,
    newValue,
    notes,
  }).catch((err) => {
    console.error('Background audit log error:', err.message);
  });
};
