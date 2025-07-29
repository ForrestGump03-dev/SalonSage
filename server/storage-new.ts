import { SQLiteStorage } from './sqlite-storage';

// Create and export a single instance of SQLiteStorage
const databasePath = process.env.DATABASE_PATH || "./data/salon_sage.db";
export const storage = new SQLiteStorage(databasePath);

// Re-export the IStorage interface for type compatibility
export type { IStorage } from './sqlite-storage';
