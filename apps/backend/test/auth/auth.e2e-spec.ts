import type { INestApplication } from '@nestjs/common';
import { SEED_LOGINS, SEED_PASSWORD } from 'src/seed/seed.constants';
import { createTestApp } from '../utils/test-app';
import { authedRequest, unauthedRequest } from '../utils/auth';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('logs in a seeded user and returns the success envelope', async () => {
    const res = await unauthedRequest(app)
      .post('/api/auth/login')
      .send({ phone: SEED_LOGINS.ADMIN, password: SEED_PASSWORD })
      .expect(201);

    expect(res.body).toMatchObject({
      success: true,
      data: { user: { phone: SEED_LOGINS.ADMIN, role: 'ADMIN' } },
    });
  });

  it('rejects wrong credentials with the error envelope', async () => {
    const res = await unauthedRequest(app)
      .post('/api/auth/login')
      .send({ phone: SEED_LOGINS.ADMIN, password: 'wrong-password' })
      .expect(401);

    expect(res.body).toMatchObject({ success: false });
  });

  it('returns 401 without a token', async () => {
    await unauthedRequest(app).get('/api/group').expect(401);
  });

  it('returns 403 when the role is not allowed', async () => {
    const student = await authedRequest(app, 'STUDENT');
    await student.post('/api/group').send({}).expect(403);
  });
});
