// RC-TEAMS Database Proxy — points to storage service
// All mock seed data has been removed.
import { storage } from './services/storage';

export const db = storage;
export default storage;
