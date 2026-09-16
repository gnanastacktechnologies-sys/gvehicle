import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logAudit } from '../utils/auditLogger.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'gvehicle_super_secret_jwt_key_2026_prod', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/username and password' });
    }

    const cleanInput = email.trim();

    // Search user by email OR name (username)
    const user = await User.findOne({
      $or: [
        { email: cleanInput.toLowerCase() },
        { name: { $regex: `^${cleanInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
      ],
    }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Your account is currently inactive.' });
    }

    const token = generateToken(user._id);

    await logAudit({
      user: user._id,
      action: 'USER_LOGIN',
      module: 'AUTH',
      notes: `User logged in from ${req.ip || 'client'}`,
    });

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    user.password = newPassword;
    await user.save();

    await logAudit({
      user: user._id,
      action: 'PASSWORD_CHANGE',
      module: 'AUTH',
      notes: 'User updated their password',
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordReset = async (req, res, next) => {
  try {
    const { email, phone, newPassword } = req.body;

    if (!email || !phone || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, registered mobile number, and new password are required.',
      });
    }

    const cleanInput = email.trim();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const user = await User.findOne({
      $or: [
        { email: cleanInput.toLowerCase() },
        { name: { $regex: `^${cleanInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
      ],
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification failed: Email and mobile number do not match our registered records.',
      });
    }

    const userPhoneClean = (user.phone || '').replace(/[^0-9]/g, '');

    if (!userPhoneClean || userPhoneClean !== cleanPhone) {
      return res.status(400).json({
        success: false,
        message: 'Verification failed: Email and mobile number do not match our registered records.',
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit({
      user: user._id,
      action: 'FORGOT_PASSWORD_RESET',
      module: 'AUTH',
      notes: `Password reset via mobile & email verification for ${user.email}`,
    });

    res.json({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    if (name) user.name = name.trim();

    if (email !== undefined) {
      const cleanEmail = email ? email.toLowerCase().trim() : '';
      if (cleanEmail && cleanEmail !== user.email) {
        const existing = await User.findOne({ email: cleanEmail });
        if (existing) {
          return res.status(400).json({ success: false, message: 'This email address is already registered to another account.' });
        }
      }
      user.email = cleanEmail;
    }

    if (phone !== undefined) user.phone = phone.trim();

    await user.save();

    await logAudit({
      user: user._id,
      action: 'UPDATE_PROFILE',
      module: 'AUTH',
      notes: `User ${user.email} updated profile (Name: ${user.name}, Phone: ${user.phone})`,
    });

    res.json({
      success: true,
      message: 'Profile details updated successfully!',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};
