import { PrismaClient } from 'generated/prisma/client';

export async function cleanUpDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany();
    await tx.alert.deleteMany();
    await tx.excuse.deleteMany();
    await tx.studentWird.deleteMany();
    await tx.scheduleImage.deleteMany();
    await tx.week.deleteMany();
    await tx.request.deleteMany();
    await tx.groupMember.deleteMany();
    await tx.group.deleteMany();
    await tx.user.deleteMany();
  });
}
