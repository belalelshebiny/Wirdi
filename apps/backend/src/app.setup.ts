import { NestExpressApplication } from '@nestjs/platform-express';
import { ResponseInterceptor } from './interceptor/response.interceptor';
import {
  HttpExceptionFilter,
  ImageKitExceptionFilter,
  PrismaExceptionFilter,
  UncaughtExceptionFilter,
  ZodExceptionFilter,
} from './exceptions/exception';
import { AppLogger } from './modules/logging/app-logger.service';
import { isDevelopment } from './utils/util';

/** App-wide configuration shared by main.ts and the e2e tests, so both behave the same. */
export function configureApp(app: NestExpressApplication) {
  const appLogger = app.get(AppLogger);
  app.useLogger(appLogger);
  app.set('trust proxy', 'loopback');
  if (isDevelopment) {
    app.enableCors({
      origin: '*', // Adjust this to your frontend URL and port
    });
  }
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalFilters(
    new UncaughtExceptionFilter(appLogger),
    new ImageKitExceptionFilter(appLogger),
    new PrismaExceptionFilter(appLogger),
    new ZodExceptionFilter(appLogger),
    new HttpExceptionFilter(appLogger)
  );
}
