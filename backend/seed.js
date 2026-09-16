import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User, { ALL_PERMISSIONS } from './models/User.js';
import Vehicle from './models/Vehicle.js';
import Trip from './models/Trip.js';
import FuelEntry from './models/FuelEntry.js';
import OilChange from './models/OilChange.js';
import Tyre from './models/Tyre.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log('Seeding database...');

    // 1. Check or Create Admin Account from environment variables
    const adminName = process.env.ADMIN_NAME || 'Gnanasekaran';
    const adminEmail = process.env.ADMIN_EMAIL || 'gnanasekaran@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Gnana@123';

    let admin = await User.findOne({ $or: [{ email: adminEmail }, { name: adminName }, { role: 'ADMIN' }] });

    if (!admin) {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        phone: '+91 9876543210',
        role: 'ADMIN',
        status: 'ACTIVE',
        permissions: ALL_PERMISSIONS,
      });
      console.log(`Created default Admin user from ENV: ${adminName} (${adminEmail})`);
    } else {
      console.log(`Updating existing Admin user from ENV: ${admin.name} -> ${adminName}`);
      admin.name = adminName;
      admin.email = adminEmail;
      admin.password = adminPassword;
      admin.role = 'ADMIN';
      admin.status = 'ACTIVE';
      admin.permissions = ALL_PERMISSIONS;
      await admin.save();
    }

    // 2. Check or Create Driver/Staff Account
    const driverEmail = 'driver@gvehicle.com';
    let driver = await User.findOne({ email: driverEmail });
    if (!driver) {
      driver = await User.create({
        name: 'John Driver',
        email: driverEmail,
        password: 'Driver@123456',
        phone: '+91 9123456789',
        role: 'USER',
        status: 'ACTIVE',
        permissions: [
          'dashboard.view',
          'vehicles.view',
          'trips.view',
          'trips.create',
          'trips.edit',
          'fuel.view',
          'fuel.create',
          'oil.view',
          'tyres.view',
          'maintenance.view',
        ],
      });
      console.log(`Created default Driver user: ${driverEmail} / Driver@123456`);
    }

    // 3. Check or Create Initial Vehicles
    const vehicleCount = await Vehicle.countDocuments();
    if (vehicleCount === 0) {
      const v1 = await Vehicle.create({
        vehicleName: 'Toyota Innova Crysta',
        numberPlate: 'TN 33 AB 1234',
        vehicleType: 'Car',
        currentOdometer: 45230,
        make: 'Toyota',
        model: 'Innova Crysta 2.4 Z',
        year: 2022,
        color: 'Pearl White',
        fuelType: 'Diesel',
        engineOilChangeIntervalKm: 5000,
        lastOilChangeOdometer: 43000,
        lastOilChangeDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        notes: 'Executive transport car',
        status: 'ACTIVE',
      });

      const v2 = await Vehicle.create({
        vehicleName: 'Honda Activa 6G',
        numberPlate: 'TN 33 CD 5678',
        vehicleType: 'Bike',
        currentOdometer: 12450,
        make: 'Honda',
        model: 'Activa 6G DLX',
        year: 2023,
        color: 'Matte Grey',
        fuelType: 'Petrol',
        engineOilChangeIntervalKm: 3000,
        lastOilChangeOdometer: 10000,
        lastOilChangeDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        notes: 'Local office errands scooter',
        status: 'ACTIVE',
      });

      const v3 = await Vehicle.create({
        vehicleName: 'Tata Prima Truck',
        numberPlate: 'TN 33 EF 9012',
        vehicleType: 'Truck',
        currentOdometer: 88500,
        make: 'Tata Motors',
        model: 'Prima 2830.K',
        year: 2021,
        color: 'Blue',
        fuelType: 'Diesel',
        engineOilChangeIntervalKm: 10000,
        lastOilChangeOdometer: 79000,
        lastOilChangeDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        notes: 'Heavy goods logistics truck',
        status: 'ACTIVE',
      });

      console.log('Sample vehicles created.');

      // 4. Create Sample Completed Trips
      await Trip.create([
        {
          vehicle: v1._id,
          user: driver._id,
          purpose: 'Airport Drop & Client Visit',
          startOdometer: 45150,
          endOdometer: 45230,
          distance: 80,
          startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 4 * 3600 * 1000),
          status: 'COMPLETED',
          notes: 'Smooth ride, no issues',
        },
        {
          vehicle: v2._id,
          user: driver._id,
          purpose: 'Document Courier Delivery',
          startOdometer: 12400,
          endOdometer: 12450,
          distance: 50,
          startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 3600 * 1000),
          status: 'COMPLETED',
          notes: 'City traffic trip',
        },
      ]);

      // 5. Create Sample Fuel Entries
      await FuelEntry.create([
        {
          vehicle: v1._id,
          user: driver._id,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          odometer: 45150,
          fuelType: 'Diesel',
          quantity: 40,
          pricePerLitre: 95,
          totalAmount: 3800,
          fuelStation: 'Indian Oil Bunk - Main Rd',
          notes: 'Full tank refill',
        },
        {
          vehicle: v2._id,
          user: driver._id,
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          odometer: 12400,
          fuelType: 'Petrol',
          quantity: 5,
          pricePerLitre: 102,
          totalAmount: 510,
          fuelStation: 'HP Petrol Pump',
          notes: 'Normal fill',
        },
      ]);

      // 6. Create Sample Oil Change Record
      await OilChange.create({
        vehicle: v1._id,
        user: admin._id,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        odometer: 43000,
        oilType: 'Synthetic 5W-30',
        oilBrand: 'Castrol MAGNATEC',
        quantity: 5.5,
        cost: 3500,
        serviceProvider: 'Toyota Authorized Service',
        nextOilChangeOdometer: 48000,
        notes: 'Regular periodic oil change',
      });

      // 7. Create Sample Tyre Record
      await Tyre.create({
        vehicle: v1._id,
        user: admin._id,
        installationDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        brand: 'Michelin',
        model: 'Primacy 4ST',
        position: 'All Four',
        quantity: 4,
        cost: 32000,
        expectedReplacementDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        notes: 'New tubeless tyres set',
      });

      console.log('Sample trips, fuel, oil, and tyre records seeded successfully.');
    }

    console.log('Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedData();
