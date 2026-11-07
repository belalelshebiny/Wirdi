import { faker, fakerAR } from '@faker-js/faker';
import type { PrismaClient } from 'generated/prisma/client';

import { cleanUpDatabase } from './cleanup.seed';
import { SEED_NUMBER, TOTAL_MODERATORS, TOTAL_LEARNERS } from './seed.constants';
import { seedUsers } from './user.seed';
import { prismaSeedClient } from './seed.util';
import { seedWirdTracking } from './wird-tracking.seed';

/** Wipes the database and seeds the full dataset. Shared by `prisma db seed` and the e2e setup. */
export const seedData = async (prisma: PrismaClient = prismaSeedClient) => {
  faker.seed(SEED_NUMBER);
  fakerAR.seed(SEED_NUMBER);

  await cleanUpDatabase(prisma);
  await seedUsers({ prisma, totalModerators: TOTAL_MODERATORS, totalLearners: TOTAL_LEARNERS });
  await seedWirdTracking(prisma);
};

// Run only when executed directly (`prisma db seed`), not when imported by the tests.
if (require.main === module) {
  seedData()
    .then(() => console.log('Data seeded successfully'))
    .catch((error) => {
      console.error('Error seeding data:', error);
      process.exitCode = 1;
    })
    .finally(() => prismaSeedClient.$disconnect());
}
