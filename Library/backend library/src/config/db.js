import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ENV_FILE = path.resolve(__dirname, '../../.env');
const ROOT_ENV_FILE = path.resolve(__dirname, '../../../.env');
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'local_db.json');

if (fs.existsSync(ROOT_ENV_FILE)) {
  dotenv.config({ path: ROOT_ENV_FILE });
}
if (fs.existsSync(BACKEND_ENV_FILE)) {
  dotenv.config({ path: BACKEND_ENV_FILE });
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
    // Configure public DNS resolution for Atlas SRV queries on Windows
    if (mongoURI.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (dnsErr) {
        // Continue if custom DNS set is not permitted in sandbox
      }
    }

    try {
      console.log('🔄 Connecting to MongoDB Atlas...');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out after 7s')), 7000)
      );
      await Promise.race([
        mongoose.connect(mongoURI, {
          serverSelectionTimeoutMS: 6000,
          connectTimeoutMS: 6000,
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
