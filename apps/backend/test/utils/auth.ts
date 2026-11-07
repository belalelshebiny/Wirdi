import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { AuthResponseDto } from '@wirdi/shared';
import { SEED_LOGINS, SEED_PASSWORD } from 'src/seed/seed.constants';

type SeedRole = keyof typeof SEED_LOGINS;

export const unauthedRequest = (app: INestApplication) => request(app.getHttpServer() as App);

/** Logs in a seeded user through the real API and returns an agent that sends its token. */
export async function authedRequest(app: INestApplication, role: SeedRole = 'ADMIN') {
  const res = await unauthedRequest(app)
    .post('/api/auth/login')
    .send({ phone: SEED_LOGINS[role], password: SEED_PASSWORD })
    .expect(201);
  const { accessToken } = (res.body as { data: AuthResponseDto }).data;
  return request.agent(app.getHttpServer() as App).auth(accessToken, { type: 'bearer' });
}
