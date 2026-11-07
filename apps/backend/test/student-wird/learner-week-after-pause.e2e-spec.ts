import type { INestApplication } from '@nestjs/common';
import type { LearnerGroupOverviewDto } from '@wirdi/shared';
import { DatabaseService } from 'src/modules/database/database.service';
import { seedGroupWithWeeks } from 'src/seed/group.seed';
import { SEED_LOGINS } from 'src/seed/seed.constants';
import { createTestApp } from '../utils/test-app';
import { authedRequest } from '../utils/auth';
import { restoreClock, setToday } from '../utils/clock';
import { pauseAndResume } from '../utils/group';

// Policy: on Saturday the learner sees the previous week until it is fully recorded.
// After a pause the previous week is the old paused week, which must not block the learner.
describe('Learner week on Saturday after a group pause (e2e)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let admin: Awaited<ReturnType<typeof authedRequest>>;
  let student: Awaited<ReturnType<typeof authedRequest>>;

  /** A group with 4 weeks from 2026-01-03 where the seeded student is an active learner. */
  async function seedGroupWithStudent() {
    const group = await seedGroupWithWeeks(db, {
      firstSaturday: '2026-01-03',
      weekCount: 4,
      withScheduleImages: true,
    });
    const { id: studentId } = await db.user.findUniqueOrThrow({
      where: { phone: SEED_LOGINS.STUDENT },
    });
    await db.groupMember.create({
      data: { groupId: group.id, studentId, joinedAt: new Date('2026-01-01T00:00:00Z') },
    });
    return group;
  }

  async function learnerWeekNumberOn(groupId: string, saturday: string) {
    setToday(saturday);
    const res = await student.get(`/api/student-wird/my-group/${groupId}/overview`).expect(200);
    const overview = (res.body as { data: LearnerGroupOverviewDto }).data;
    if (overview.type !== 'overview')
      throw new Error(`Expected an overview, got ${overview.reason}`);
    return overview.week.weekNumber;
  }

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get(DatabaseService);
    admin = await authedRequest(app, 'ADMIN');
    student = await authedRequest(app, 'STUDENT');
  });

  afterEach(() => restoreClock());

  afterAll(async () => {
    await app.close();
  });

  it('without a pause, keeps showing the unfinished previous week (existing policy)', async () => {
    const group = await seedGroupWithStudent();

    // Saturday 2026-01-10 starts week 2; week 1 has no records yet.
    expect(await learnerWeekNumberOn(group.id, '2026-01-10')).toBe(1);
  });

  it('after a pause, shows the new week instead of the old paused week', async () => {
    const group = await seedGroupWithStudent();
    // Paused during week 2, resumed a month later: week 3 moves to Saturday 2026-02-14.
    await pauseAndResume(admin, group.id, { pausedOn: '2026-01-13', resumedOn: '2026-02-13' });

    expect(await learnerWeekNumberOn(group.id, '2026-02-14')).toBe(3);
  });

  it('after a pause, the following Saturday still applies the policy to week 3', async () => {
    const group = await seedGroupWithStudent();
    await pauseAndResume(admin, group.id, { pausedOn: '2026-01-13', resumedOn: '2026-02-13' });

    // Saturday 2026-02-21 starts week 4; week 3 (right before it) has no records yet.
    expect(await learnerWeekNumberOn(group.id, '2026-02-21')).toBe(3);
  });
});
