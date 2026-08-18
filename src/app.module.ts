import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationsModule } from './applications/applications.module';
import { CvsModule } from './cvs/cvs.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { EmailModule } from './email/email.module';
import { ExportModule } from './export/export.module';
import { HealthModule } from './health/health.module';
import { Application } from './applications/entities/application.entity';
import { CV } from './cvs/entities/cv.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database — always use SSL for Supabase
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [Application, CV],
        synchronize: configService.get('NODE_ENV') !== 'production',
        ssl: {
          rejectUnauthorized: false,
        },
        // Connection pool settings
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
      }),
      inject: [ConfigService],
    }),

    // Rate limiting — 60 requests per minute per IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),

    // Feature modules
    ApplicationsModule,
    CvsModule,
    AuthModule,
    AiModule,
    EmailModule,
    ExportModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
