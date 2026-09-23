import mongoose from 'mongoose';
import dns from 'dns';

// Configure Node.js DNS to use Google (8.8.8.8) / Cloudflare (1.1.1.1) if allowed
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore in restricted serverless sandboxes
}

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gvehicle';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;
