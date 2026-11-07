# وِرْدي (Wirdi)

**Wirdi** is an Arabic web app for tracking daily Quran recitation assessments (wird) within study groups. Each learner must record their daily wird — حفظ، مراجعة، تلاوة — with their assigned mate, from Saturday to Thursday. Missing sessions trigger accountability alerts and can auto-deactivate a learner, keeping the group disciplined and progressing.

---

## 🏗️ Structure

```
wirdi/
├── apps/
│   ├── backend/          NestJS + Prisma + MySQL
│   └── client/           React 19 + Vite + Tailwind v4 (RTL, Arabic UI)
└── packages/
    └── shared/           Shared DTOs, Zod schemas, and utilities
```

---

## ⚙️ Tech Stack

| Layer       | Tech                                                                |
| ----------- | ------------------------------------------------------------------- |
| Frontend    | React 19, Vite, TypeScript, Tailwind v4, shadcn/ui, React Router v7 |
| Backend     | NestJS 11, Prisma 7, MySQL 8                                        |
| Auth        | JWT (30 days), Argon2 hashing                                       |
| Validation  | Zod (shared factory schemas)                                        |
| State/Query | TanStack Query v5, Zustand                                          |
| Forms       | React Hook Form                                                     |
| Logging     | Winston + daily-rotate-file                                         |
| Monorepo    | Turborepo + pnpm workspaces                                         |

---

## 🌱 Domain Concepts

- **Group (مجموعة)** — A study group with a timezone, moderator, and a list of members
- **Week (أسبوع)** — A 6-day period (Saturday → Thursday) belonging to a group; auto-incremented
- **Student Wird (وِرْد الطالب)** — A daily recitation record (attended / missed / late) for a student in a specific week
- **Group Member** — A student enrolled in a group, optionally paired with a mate (الزميل المقروء عليه)
- **Request (طلب)** — An excuse or re-activation request submitted by a student, reviewed by a moderator
- **Schedule Image** — schedule image uploaded for a given week

---

## 🚀 Local Setup

### Prerequisites

- Node.js 22+ (tests need it; production runs on 20), pnpm 9+, Docker

### 1. Clone & install

```bash
git clone <repo-url>
cd wirdi
pnpm install
```

### 2. Start the database

```bash
docker-compose up -d
```

### 3. Configure environment

Copy `.env.example` to `.env` in `apps/backend/` and set:

```
DATABASE_URL="mysql://root:PASSWORD@localhost:3305/wirdi"
JWT_SECRET="your-secret"
```

### 4. Run migrations & seed

```bash
pnpm --filter @wirdi/backend prisma:migrate:dev
pnpm db:seed
```

### 5. Start dev servers

```bash
# From root
pnpm dev
```

- Client: http://localhost:3000
- API: http://localhost:5000/api

---

## 🔑 Seeded Accounts

Login is by phone. All accounts use the password `12345678` (`SEED_LOGINS` in `apps/backend/src/seed/seed.constants.ts`).

| Role      | Phone         |
| --------- | ------------- |
| Admin     | +201507770400 |
| Moderator | +966500000001 |
| Student   | +966500000004 |

---

## 📦 Scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `pnpm dev`           | Start all apps in watch mode         |
| `pnpm build`         | Build all apps                       |
| `pnpm typecheck`     | TypeScript check across all packages |
| `pnpm lint`          | Lint all packages                    |
| `pnpm format`        | Format with Prettier                 |
| `pnpm test`          | Unit tests in all packages           |
| `pnpm test:e2e`      | Backend e2e tests (`wirdi_test` DB)  |
| `pnpm db:seed`       | Seed the dev database                |
| `pnpm db:reset:test` | Rebuild the test database            |

Testing setup and conventions: [.github/instructions/testing.instructions.md](.github/instructions/testing.instructions.md)
