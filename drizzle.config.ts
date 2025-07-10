import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  out: './drizzle',
  // schema: './lib/db/schema.ts',
  // dialect: 'postgresql',
  schema: './lib/localdb/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: './sqlite.db',
  },
});