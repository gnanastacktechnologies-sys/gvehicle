import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

dotenv.config();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 17203;

const server = app.listen(PORT, () => {
  console.log(`Gvehicle Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

  // Automated 24/7 Keep-Alive Self-Ping for Render / Free Hosting
  const serverUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL;
  if (serverUrl) {
    const pingUrl = `${serverUrl.replace(/\/$/, '')}/api/health`;
    console.log(`[Keep-Alive] 24/7 Self-Ping initialized for ${pingUrl}`);
    
    // Ping every 10 minutes (600,000 ms) to prevent Render sleep mode (15 min inactivity timeout)
    setInterval(async () => {
      try {
        const response = await fetch(pingUrl);
        const data = await response.json();
        console.log(`[Keep-Alive] 24/7 Self-Ping status: ${response.status} (${data.status}) at ${new Date().toISOString()}`);
      } catch (err) {
        console.error(`[Keep-Alive] Self-Ping error: ${err.message}`);
      }
    }, 10 * 60 * 1000);
  } else {
    console.log('[Keep-Alive] Set RENDER_EXTERNAL_URL or SERVER_URL in environment variables to enable 24/7 self-ping.');
  }
});

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  server.close(() => process.exit(1));
});
