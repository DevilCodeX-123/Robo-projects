import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_ENV_FILE = path.resolve(__dirname, '../../../.env');
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'local_db.json');

if (fs.existsSync(ROOT_ENV_FILE)) {
  dotenv.config({ path: ROOT_ENV_FILE });
}
dotenv.config();

export let isMongoConnected = false;

// In-memory / file fallback store for zero-friction local execution
export const localStore = {
  users: [],
  seniors: [],
  components: [],
  requests: [],
  transactions: [],
  projects: [],
  maintenance: [],
  notifications: [],
  auditLogs: []
};

export const saveLocalStore = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(localStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local store:', err.message);
  }
};

export const loadLocalStore = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      Object.assign(localStore, data);
      if (!Array.isArray(localStore.seniors)) localStore.seniors = [];
      console.log('📦 Loaded existing local store data from', DATA_FILE);
    }
  } catch (err) {
    console.error('Error reading local store:', err.message);
  }
};

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (mongoURI && mongoURI.trim() !== '') {
    try {
      console.log('🔄 Connecting to MongoDB Atlas...');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out after 3.5s')), 3500)
      );
      await Promise.race([
        mongoose.connect(mongoURI, {
          serverSelectionTimeoutMS: 3000,
          connectTimeoutMS: 3000,
        }),
        timeoutPromise
      ]);
      isMongoConnected = true;
      console.log('✅ Successfully connected to MongoDB Atlas!');
      return;
    } catch (error) {
      console.warn('⚠️  Could not connect to MongoDB Atlas:', error.message);
      console.warn('🔄 Switching to high-performance local store fallback.');
    }
  } else {
    console.log('ℹ️  No MONGODB_URI specified in .env. Using local database persistence.');
  }

  isMongoConnected = false;
  loadLocalStore();
};
