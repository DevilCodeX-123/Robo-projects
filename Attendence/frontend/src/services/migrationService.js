// RC-TEAMS Migration Service
// Runs once on startup to clear legacy v1 keys and seed realistic demo data if fresh.

import { storage } from './storage';

const LEGACY_KEYS = [
  'robotics_members', 'robotics_pending', 'robotics_inventory',
  'robotics_issued_items', 'robotics_events', 'robotics_transactions',
  'robotics_activities', 'robotics_credentials', 'robotics_api_config',
  'robotics_forms', 'robotics_responses', 'robotics_broadcast_sends',
  'robotics_certificate_batches', 'robotics_active_user'
];

export function runMigration() {
  const done = localStorage.getItem('rcteams_v2_migrated');
  if (done !== 'true') {
    // Clear legacy keys
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    Object.keys(localStorage)
      .filter(k => k.startsWith('robotics_'))
      .forEach(k => localStorage.removeItem(k));

    localStorage.setItem('rcteams_v2_migrated', 'true');
    console.info('[RC-TEAMS] Migration complete: legacy data cleared.');
  }

  // Seed realistic demo data if no members exist
  if (storage.getMembers().length === 0) {
    storage.seedDemoData();
    console.info('[RC-TEAMS] Initialized with realistic club demo data.');
  }
}
