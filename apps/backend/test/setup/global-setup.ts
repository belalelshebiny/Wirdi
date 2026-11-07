import { execSync } from 'node:child_process';
import './test-env';

/** Runs once per e2e run: migrate the test DB and load the same seed as dev. */
export default async function setup() {
  execSync('prisma migrate deploy', { stdio: 'inherit', env: process.env });

  // Imported after the env is loaded: the seed client reads DATABASE_* on import.
  const { seedData } = await import('../../src/seed/seed.js');
  const { cleanUpDatabase } = await import('../../src/seed/cleanup.seed.js');
  const { prismaSeedClient } = await import('../../src/seed/seed.util.js');

  await seedData(prismaSeedClient);

  return async () => {
    await cleanUpDatabase(prismaSeedClient);
    await prismaSeedClient.$disconnect();
  };
}
