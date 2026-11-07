import type { INestApplication } from '@nestjs/common';
import { addDaysToDateStr as addDays, type GroupDto } from '@wirdi/shared';
import { DatabaseService } from 'src/modules/database/database.service';
import { seedGroupWithWeeks } from 'src/seed/group.seed';
import { createTestApp } from '../utils/test-app';
import { authedRequest, unauthedRequest } from '../utils/auth';
import { day, restoreClock, setToday } from '../utils/clock';
import { getWeeks, pauseAndResume, setGroupStatus } from '../utils/group';

// Weeks 1–4 start on Saturdays 2026-01-03 … 2026-01-24. Paused on Tuesday of week 2.
const FIRST_SATURDAY = '2026-01-03';
const PAUSED_ON = '2026-01-13';

describe('Group status: pause & resume (e2e)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let admin: Awaited<ReturnType<typeof authedRequest>>;

  const seedGroup = () => seedGroupWithWeeks(db, { firstSaturday: FIRST_SATURDAY, weekCount: 4 });

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get(DatabaseService);
    admin = await authedRequest(app, 'ADMIN');
  });

  afterEach(() => restoreClock());

  afterAll(async () => {
    await app.close();
  });

  describe('access', () => {
    it('returns 401 without a token', async () => {
      const group = await seedGroup();
      await unauthedRequest(app)
        .patch(`/api/group/${group.id}`)
        .send({ status: 'INACTIVE' })
        .expect(401);
    });

    it('returns 403 for a student', async () => {
      const group = await seedGroup();
      const student = await authedRequest(app, 'STUDENT');
      await student.patch(`/api/group/${group.id}`).send({ status: 'INACTIVE' }).expect(403);
    });
  });

  describe('pausing', () => {
    it('stores when the group became inactive', async () => {
      const group = await seedGroup();

      const paused = await setGroupStatus(admin, group.id, 'INACTIVE', PAUSED_ON);

      expect(paused).toMatchObject({
        status: 'INACTIVE',
        inactiveAt: `${PAUSED_ON}T10:00:00.000Z`,
      });
    });

    it('keeps the original date when INACTIVE is sent again', async () => {
      const group = await seedGroup();
      await setGroupStatus(admin, group.id, 'INACTIVE', PAUSED_ON);

      const again = await setGroupStatus(admin, group.id, 'INACTIVE', '2026-01-20');

      expect(again.inactiveAt).toBe(`${PAUSED_ON}T10:00:00.000Z`);
    });

    it('stores the date when a group is created inactive', async () => {
      const res = await admin
        .post('/api/group')
        .send({ name: 'paused from start', awrad: ['wird'], status: 'INACTIVE' })
        .expect(201);

      expect((res.body as { data: GroupDto }).data.inactiveAt).toEqual(expect.any(String));
    });
  });

  describe('resuming', () => {
    it.each([
      { pause: 'one week', resumedOn: '2026-01-20', week3Start: '2026-01-24' },
      { pause: 'one month', resumedOn: '2026-02-13', week3Start: '2026-02-14' },
      { pause: 'three months', resumedOn: '2026-04-13', week3Start: '2026-04-18' },
      { pause: 'until a Saturday', resumedOn: '2026-02-07', week3Start: '2026-02-07' },
    ])(
      'after $pause, later weeks restart from the upcoming Saturday',
      async ({ resumedOn, week3Start: start }) => {
        const week3Start = day(start);
        const group = await seedGroup();
        const before = await getWeeks(app, group.id);

        const resumed = await pauseAndResume(admin, group.id, { pausedOn: PAUSED_ON, resumedOn });
        const after = await getWeeks(app, group.id);

        expect(resumed).toMatchObject({ status: 'ACTIVE', inactiveAt: null });
        // Weeks 1–2 (the paused week and before) are done and untouched.
        expect(after.slice(0, 2)).toEqual(before.slice(0, 2));
        // Weeks 3–4 keep their ids and numbers, start back-to-back on Saturdays, end on Thursdays.
        expect(after.slice(2)).toEqual([
          { ...before[2], startDate: week3Start, endDate: addDays(week3Start, 5) },
          { ...before[3], startDate: addDays(week3Start, 7), endDate: addDays(week3Start, 12) },
        ]);
      }
    );

    it('moves nothing when resumed before the next week starts', async () => {
      const group = await seedGroup();
      const before = await getWeeks(app, group.id);

      await pauseAndResume(admin, group.id, { pausedOn: PAUSED_ON, resumedOn: '2026-01-15' });

      expect(await getWeeks(app, group.id)).toEqual(before);
    });

    it('keeps schedule images attached to their moved week', async () => {
      const group = await seedGroup();
      const [, , week3] = await getWeeks(app, group.id);
      await db.scheduleImage.create({
        data: { weekId: week3.id, name: 'week 3', imageUrl: 'https://img/3', imagekitFileId: 'f3' },
      });

      await pauseAndResume(admin, group.id, { pausedOn: PAUSED_ON, resumedOn: '2026-02-13' });

      const image = await db.scheduleImage.findUniqueOrThrow({
        where: { weekId: week3.id },
        include: { week: true },
      });
      expect(image.week.startDate.toISOString()).toBe('2026-02-14T00:00:00.000Z');
    });

    it('only flips the status for a legacy inactive group without a pause date', async () => {
      const group = await seedGroupWithWeeks(db, {
        firstSaturday: FIRST_SATURDAY,
        weekCount: 4,
        status: 'INACTIVE',
      });
      const before = await getWeeks(app, group.id);

      const resumed = await setGroupStatus(admin, group.id, 'ACTIVE', '2026-03-04');

      expect(resumed.status).toBe('ACTIVE');
      expect(await getWeeks(app, group.id)).toEqual(before);
    });

    it('moves the weeks only once when resumed twice at the same time', async () => {
      const group = await seedGroup();
      await setGroupStatus(admin, group.id, 'INACTIVE', PAUSED_ON);

      setToday('2026-02-13');
      const resume = () =>
        admin.patch(`/api/group/${group.id}`).send({ status: 'ACTIVE' }).expect(200);
      await Promise.all([resume(), resume()]);

      const [, , week3, week4] = await getWeeks(app, group.id);
      expect(week3.startDate).toBe('2026-02-14');
      expect(week4.startDate).toBe('2026-02-21');
    });

    it('can pause and resume more than once', async () => {
      const group = await seedGroup();

      await pauseAndResume(admin, group.id, { pausedOn: PAUSED_ON, resumedOn: '2026-02-04' });
      // Week 3 now starts 2026-02-07; pause during it and resume a month later.
      await pauseAndResume(admin, group.id, { pausedOn: '2026-02-10', resumedOn: '2026-03-11' });

      const [, , week3, week4] = await getWeeks(app, group.id);
      expect(week3.startDate).toBe('2026-02-07');
      expect(week4.startDate).toBe('2026-03-14');
    });
  });
});
