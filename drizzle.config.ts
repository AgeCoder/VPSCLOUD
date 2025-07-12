import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  out: './drizzle',
  // schema: './lib/db/schema.ts',
  // dialect: 'postgresql',
  schema: './lib/localdb/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL_LOCAL!,
    // url: process.env.DATABASE_URL!,
  },
});