import { ConsoleLogger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from 'src/app.module';
import { configureApp } from 'src/app.setup';
import { AppLogger } from 'src/modules/logging/app-logger.service';

/** Swallows logs so expected 4xx errors don't flood the output or write log files. */
class SilentLogger extends ConsoleLogger {
  constructor() {
    super({ logLevels: [] });
  }
  logBackendError() {}
  logClientError() {}
}

/** Boots the full AppModule with the same configuration as main.ts. */
export async function createTestApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AppLogger)
    .useClass(SilentLogger)
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureApp(app);
  await app.init();
  return app;
}
