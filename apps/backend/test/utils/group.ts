import type { INestApplication } from '@nestjs/common';
import { dateToISODateOnly } from '@wirdi/shared';
import type { GroupDto, GroupStatus } from '@wirdi/shared';
import { DatabaseService } from 'src/modules/database/database.service';
import type { authedRequest } from './auth';
import { setToday } from './clock';

type Agent = Awaited<ReturnType<typeof authedRequest>>;

/** Changes a group's status through the API on the given day and returns the updated group. */
export async function setGroupStatus(
  agent: Agent,
  groupId: string,
  status: GroupStatus,
  on: string
) {
  setToday(on);
  const res = await agent.patch(`/api/group/${groupId}`).send({ status }).expect(200);
  return (res.body as { data: GroupDto }).data;
}

/** Pauses a group on `pausedOn` and activates it again on `resumedOn` — any duration. */
export async function pauseAndResume(
  agent: Agent,
  groupId: string,
  dates: { pausedOn: string; resumedOn: string }
) {
  await setGroupStatus(agent, groupId, 'INACTIVE', dates.pausedOn);
  return setGroupStatus(agent, groupId, 'ACTIVE', dates.resumedOn);
}

/** The group's weeks as plain dates, ordered by week number. */
export async function getWeeks(app: INestApplication, groupId: string) {
  const weeks = await app.get(DatabaseService).week.findMany({
    where: { groupId },
    orderBy: { weekNumber: 'asc' },
  });
  return weeks.map((w) => ({
    id: w.id,
    weekNumber: w.weekNumber,
    startDate: dateToISODateOnly(w.startDate),
    endDate: dateToISODateOnly(w.endDate),
  }));
}
