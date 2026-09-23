import connectDB from '../backend/config/db.js';
import app from '../backend/app.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error('Vercel Serverless Function DB Connection Error:', error);
  }
  return app(req, res);
}
