import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './modules/auth/auth.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { RolesGuard } from './modules/auth/roles.guard';
import { LoggingModule } from './modules/logging/logging.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { resolve } from 'path';
import { GroupMemberModule } from './modules/group-member/group-member.module';
import { GroupModule } from './modules/group/group.module';
import { FileModule } from './modules/file/file.module';
import { ExcuseModule } from './modules/excuse/excuse.module';
import { StudentWirdModule } from './modules/student-wird/student-wird.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AlertModule } from './modules/alert/alert.module';
import { StatsModule } from './modules/stats/stats.module';
import { RequestModule } from './modules/request/request.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: Boolean(process.env.NODE_ENV) && process.env.NODE_ENV !== 'development',
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: resolve(__dirname, '../../../client/build'),
      exclude: ['/api{/*path}'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),
    // Crons must not fire during tests; they would mutate the shared test database.
    ...(process.env.NODE_ENV === 'test' ? [] : [ScheduleModule.forRoot()]),
    DatabaseModule,
    AuthModule,
    UserModule,
    LoggingModule,
    ObservabilityModule,
    GroupMemberModule,
    GroupModule,
    FileModule,
    ExcuseModule,
    StudentWirdModule,
    NotificationModule,
    AlertModule,
    StatsModule,
    RequestModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
