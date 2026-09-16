import User, { ALL_PERMISSIONS } from '../models/User.js';
import { logAudit } from '../utils/auditLogger.js';

export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, status, permissions } = req.body;

    if (!name || !password) {
      return res.status(400).json({ success: false, message: 'Name and password are required' });
    }

    const cleanEmail = email ? email.toLowerCase().trim() : '';

    if (cleanEmail) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'User with this email already exists' });
      }
    }

    const newUser = await User.create({
      name,
      email: cleanEmail,
      phone,
      password,
      role: role || 'USER',
      status: status || 'ACTIVE',
      permissions: Array.isArray(permissions) ? permissions : [],
    });

    await logAudit({
      user: req.user._id,
      action: 'USER_CREATED',
      module: 'USERS',
      recordId: newUser._id,
      newValue: { name, email: cleanEmail, role, status, permissions },
      notes: `User ${newUser.name} created by ${req.user.name}`,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { name, email, phone, role, status, permissions, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const previousValue = {
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions: user.permissions,
    };

    if (name) user.name = name;
    if (email !== undefined) {
      const cleanEmail = email ? email.toLowerCase().trim() : '';
      if (cleanEmail && cleanEmail !== user.email) {
        const existing = await User.findOne({ email: cleanEmail });
        if (existing) {
          return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }
      }
      user.email = cleanEmail;
    }
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;
    if (Array.isArray(permissions)) user.permissions = permissions;
    if (password) user.password = password; // pre('save') hook will hash password

    await user.save();

    await logAudit({
      user: req.user._id,
      action: 'USER_UPDATED',
      module: 'USERS',
      recordId: user._id,
      previousValue,
      newValue: {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        permissions: user.permissions,
      },
      notes: `User ${user.email} updated by ${req.user.name}`,
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    await logAudit({
      user: req.user._id,
      action: 'USER_DELETED',
      module: 'USERS',
      recordId: req.params.id,
      previousValue: { name: user.name, email: user.email },
      notes: `User ${user.email} deleted by ${req.user.name}`,
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getPermissionsList = async (req, res) => {
  res.json({
    success: true,
    data: ALL_PERMISSIONS,
  });
};
