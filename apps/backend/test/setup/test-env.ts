// Loads the test env and refuses anything but a *_test database.
// Precedence: shell variables > .env.test.local (gitignored, per machine) > .env.test (committed).
// Imported by global-setup and the reset script, and run in every test worker via `setupFiles`.
import { config } from 'dotenv';
import path from 'node:path';

const backendRoot = path.resolve(__dirname, '../..');
config({
  path: [path.join(backendRoot, '.env.test.local'), path.join(backendRoot, '.env.test')],
  quiet: true,
});
process.env.NODE_ENV = 'test';

if (!process.env.DATABASE_NAME?.endsWith('_test')) {
  throw new Error(
    'Refusing to run: DATABASE_NAME is not a *_test database. Check apps/backend/.env.test.'
  );
}
