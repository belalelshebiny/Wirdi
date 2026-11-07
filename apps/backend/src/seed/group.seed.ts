import { randomUUID } from 'node:crypto';
import {
  addDaysToDateStr,
  dateOnlyToUTC,
  getWeekEndDate,
  type GroupStatus,
  type ISODateOnlyString,
} from '@wirdi/shared';
import type { Prisma, PrismaClient } from 'generated/prisma/client';

type ScheduleImageSeed = { name: string; imageUrl: string; imagekitFileId: string };

/** Creates a Saturday → Thursday week, optionally with its schedule image. */
export function createWeek(
  prisma: Prisma.TransactionClient,
  input: {
    groupId: string;
    weekNumber: number;
    startDate: ISODateOnlyString;
    scheduleImage?: ScheduleImageSeed;
  }
) {
  return prisma.week.create({
    data: {
      groupId: input.groupId,
      weekNumber: input.weekNumber,
      startDate: dateOnlyToUTC(input.startDate),
      endDate: dateOnlyToUTC(getWeekEndDate(input.startDate)),
      ...(input.scheduleImage && { scheduleImage: { create: input.scheduleImage } }),
    },
  });
}

/** Creates a group with `weekCount` back-to-back weeks starting on `firstSaturday`, atomically. */
export async function seedGroupWithWeeks(
  prisma: PrismaClient,
  opts: {
    firstSaturday: string;
    weekCount: number;
    status?: GroupStatus;
    withScheduleImages?: boolean;
  }
) {
  return prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: { name: `group-${randomUUID().slice(0, 8)}`, awrad: ['wird'], status: opts.status },
    });

    for (let i = 0; i < opts.weekCount; i++) {
      await createWeek(tx, {
        groupId: group.id,
        weekNumber: i + 1,
        startDate: addDaysToDateStr(opts.firstSaturday as ISODateOnlyString, i * 7),
        ...(opts.withScheduleImages && {
          scheduleImage: {
            name: `week ${i + 1}`,
            imageUrl: `https://example.com/week-${i + 1}.jpg`,
            imagekitFileId: `week-${i + 1}`,
          },
        }),
      });
    }

    return group;
  });
}
