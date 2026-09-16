import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({ user, action, module, recordId = null, previousValue = null, newValue = null, notes = '' }) => {
  try {
    if (!user) return;
    const userId = typeof user === 'object' ? user._id || user.id : user;
    await AuditLog.create({
      user: userId,
      action,
      module,
      recordId: recordId ? recordId.toString() : null,
      previousValue,
      newValue,
      notes,
    });
  } catch (err) {
    console.error('Failed to log audit activity:', err.message);
  }
};
