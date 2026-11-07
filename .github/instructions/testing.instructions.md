---
applyTo: 'apps/backend/**'
---

# Testing Conventions

Backend tests use **Vitest** with two configs:

| Kind | Config                              | Files                                 | Runs                           |
| ---- | ----------------------------------- | ------------------------------------- | ------------------------------ |
| Unit | `apps/backend/vitest.config.ts`     | `src/**/*.spec.ts` (next to the code) | in parallel                    |
| E2E  | `apps/backend/vitest.config.e2e.ts` | `test/**/*.e2e-spec.ts`               | one file at a time (shared DB) |

E2E tests boot the full `AppModule` and call it over HTTP (`supertest`) against a separate **`wirdi_test`** database.

## Commands (from the repo root)

| Command              | What it does                                             |
| -------------------- | -------------------------------------------------------- |
| `pnpm test`          | Unit tests in every package (`turbo test`)               |
| `pnpm test:e2e`      | Backend e2e tests                                        |
| `pnpm db:seed`       | Seed the **dev** database (same seed the e2e setup uses) |
| `pnpm db:reset:test` | Drop and rebuild the test DB from the migrations         |

Backend-only (inside `apps/backend`): `pnpm test:watch`, `pnpm test:cov`, `pnpm test:debug`.

Requires **Node 22+** (Vitest 5). The production image still runs on Node 20.

## Test database & env

- `apps/backend/.env.test` (committed) points at `wirdi_test` on the docker-compose MySQL (port 3305).
- Per-machine overrides go in **`apps/backend/.env.test.local`** (gitignored), e.g. a different port.
- Precedence: shell variables > `.env.test.local` > `.env.test`.
- Every test entry point refuses to run unless `DATABASE_NAME` ends with `_test`.
- Create the database once: `CREATE DATABASE wirdi_test;` — migrations are applied automatically.
- After a migration is **rewritten in place**, run `pnpm db:reset:test` (`migrate deploy` only applies new ones).

## How an e2e run works

1. `test/setup/test-env.ts` loads the env (also runs in every worker via `setupFiles`).
2. `test/setup/global-setup.ts` runs once: `prisma migrate deploy` → `seedData()` (the **same** seed as `pnpm db:seed`).
3. Each spec file boots its own app, runs, and closes it.
4. Teardown empties the database with `cleanUpDatabase()`.
5. Crons (`ScheduleModule`) are not registered when `NODE_ENV=test`.

## Folder layout

```
apps/backend/
  vitest.config.ts / vitest.config.e2e.ts
  src/**/*.spec.ts            ← unit tests
  test/
    setup/                    ← test-env, global-setup, reset-test-db
    utils/
      test-app.ts             ← createTestApp()
      auth.ts                 ← authedRequest() / unauthedRequest()
      clock.ts                ← setToday() / restoreClock() / day()
      group.ts                ← setGroupStatus() / pauseAndResume() / getWeeks()
    [module]/[feature].e2e-spec.ts
```

## Writing an e2e test

```ts
import type { INestApplication } from '@nestjs/common';
import { createTestApp } from '../utils/test-app';
import { authedRequest, unauthedRequest } from '../utils/auth';

describe('Group status (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 403 for a student', async () => {
    const student = await authedRequest(app, 'STUDENT');
    await student.patch('/api/group/some-id').send({}).expect(403);
  });
});
```

- `createTestApp()` uses the same `configureApp()` as `main.ts` (prefix `/api`, interceptor, filters) and silences logs.
- `authedRequest(app, role)` logs in a **seeded** user (`ADMIN` | `MODERATOR` | `STUDENT`) through `POST /api/auth/login`.
- `unauthedRequest(app)` is a plain request, for 401 cases.
- Seeded logins live in `src/seed/seed.constants.ts` (`SEED_LOGINS`, `SEED_PASSWORD`) — never hard-code phones or passwords in tests.

## Rules

- Test through the **HTTP API**; read the DB directly (`app.get(DatabaseService)`) only to assert side effects.
- Check the response envelope: `{ success: true, data }` or `{ success: false, message }`.
- Cover auth (401), roles (403), validation (400) and the business rule itself.
- Create the data a test needs inside the test, with unique names (`randomUUID()`); don't depend on other files' data.
- Don't change seeded rows other tests rely on — create your own group/learners instead.
- When a rule depends on "today", use `setToday('2026-01-13')` (fakes only `Date`, so the DB driver keeps working) and call `restoreClock()` in `afterEach`.
- Build data with seed helpers from `src/seed/` (e.g. `seedGroupWithWeeks`) so dev and tests share them.
- Pause/resume over any duration: `pauseAndResume(admin, groupId, { pausedOn, resumedOn })`.
- Pure functions (e.g. date utils) get **unit** tests, not e2e tests.
