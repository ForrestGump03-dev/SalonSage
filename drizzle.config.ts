import type { Config } from "drizzle-kit";

// Per SQLite locale, non abbiamo bisogno di DATABASE_URL
const databasePath = process.env.DATABASE_PATH || "./data/salon_sage.db";

export default {
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: databasePath,
  },
} satisfies Config;
