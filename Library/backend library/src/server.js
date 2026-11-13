import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, isMongoConnected } from './config/db.js';
import apiRoutes from './routes/api.js';
import { seedDatabase } from './seeds/seedData.js';
import { dataService } from './services/dataService.js';
import { syncSeniorUserAccount } from './controllers/seniorController.js';
import { processReturnReminders } from './controllers/notificationController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIST = path.resolve(__dirname, '../../frontend/dist');

const app = express();
const PORT = process.env.PORT || 5000;

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(
  new Set(['http://localhost:5173', 'http://127.0.0.1:5173', ...configuredOrigins])
);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: isMongoConnected ? 'MongoDB Atlas' : 'Local Persistence Engine',
    appName: 'Robotics Club — Component Management System'
  });
});

// Mount API Routes
app.use('/api', apiRoutes);

// Serve built frontend bundle in production when dist exists
if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(FRONTEND_DIST, 'index.html'))) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database has no components yet
    const existingComponents = await dataService.getComponents();
    if (existingComponents.length === 0) {
      console.log('⚡ Empty database detected. Seeding initial robotics data...');
      await seedDatabase();
    }

    // Ensure SENIOR user accounts and senior directory records stay linked without creating duplicates
    const allSeniors = await dataService.getSeniors();
    for (const senior of allSeniors) {
      if (senior.linkedUserId) continue;
      const syncResult = await syncSeniorUserAccount({
        seniorName: senior.fullName || 'Senior',
        email: senior.email,
        phoneNumber: senior.phoneNumber || '',
        department: senior.department || 'Robotics Club',
        position: senior.position || 'Senior Coordinator'
      });
      if (syncResult.linkedUserId) {
        await dataService.updateSenior(senior._id || senior.id, {
          linkedUserId: syncResult.linkedUserId
        });
      }
    }

    // Run overdue & return-deadline reminder checks on startup and every 6 hours
    await processReturnReminders();
    setInterval(() => {
      processReturnReminders().catch(err => console.error('Reminder scheduler error:', err.message));
    }, 6 * 60 * 60 * 1000).unref();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🤖 Robotics Club API Server running on port ${PORT}`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`💾 Database: ${isMongoConnected ? 'MongoDB Atlas' : 'Local File Persistence Engine'}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
