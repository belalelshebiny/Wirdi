export const SEED_NUMBER = 2032110;
export const TOTAL_MODERATORS = 3;
export const TOTAL_LEARNERS = 40;

export const SEED_PASSWORD = '12345678';

/** Fixed logins created by seedUsers, shared by dev and the e2e tests. */
export const SEED_LOGINS = {
  ADMIN: '+201507770400',
  MODERATOR: '+966500000001',
  // Learners start right after the moderators (see seedUsers).
  STUDENT: `+9665${String(TOTAL_MODERATORS + 1).padStart(8, '0')}`,
} as const;
