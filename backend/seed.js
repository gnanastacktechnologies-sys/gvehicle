import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User, { ALL_PERMISSIONS } from './models/User.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log('Dropping existing database collections...');
    await mongoose.connection.dropDatabase();
    console.log('Database dropped successfully!');

    console.log('Seeding Admin account only...');

    const adminName = process.env.ADMIN_NAME || 'Gnanasekaran';
    const adminEmail = process.env.ADMIN_EMAIL || 'gnanasekaran@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Gnana@123';

    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      phone: '+91 9876543210',
      role: 'ADMIN',
      status: 'ACTIVE',
      permissions: ALL_PERMISSIONS,
    });

    console.log(`Admin user created: ${admin.name} (${adminEmail}) / Role: ${admin.role}`);
    console.log('Database drop & Admin-only seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedData();
