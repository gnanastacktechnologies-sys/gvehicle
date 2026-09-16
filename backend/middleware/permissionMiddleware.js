export const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Admin role has implicit access to all modules and actions
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Check if user has explicit permission string
    if (req.user.permissions && req.user.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Permission denied: Required permission '${permission}' is missing for your account.`,
    });
  };
};
