// Loads .env.test (variables already set in the shell win) and refuses anything but a *_test database.
// Imported by global-setup and the reset script, and run in every test worker via `setupFiles`.
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(__dirname, '../../.env.test'), quiet: true });
process.env.NODE_ENV = 'test';

if (!process.env.DATABASE_NAME?.endsWith('_test')) {
  throw new Error(
    'Refusing to run: DATABASE_NAME is not a *_test database. Check apps/backend/.env.test.'
  );
}
