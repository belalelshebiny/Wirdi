// Rebuilds the test database from the migrations (`pnpm db:reset:test`).
// Needed after a migration is rewritten in place: `migrate deploy` in global-setup only applies new ones.
import { execSync } from 'node:child_process';
import './test-env';

execSync('prisma migrate reset --force', { stdio: 'inherit', env: process.env });
