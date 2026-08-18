import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Get config service
  const configService = app.get(ConfigService);

  // Security headers
  app.use(helmet());

  // Response compression
  app.use(compression());

  // Enable CORS for frontend
  const allowedOrigins = configService.get('ALLOWED_ORIGINS')?.split(',') || [
    'http://localhost:3001',
    'http://localhost:5173',
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Emergency stop check
  if (configService.get('EMERGENCY_STOP') === 'true') {
    logger.warn('⚠️  EMERGENCY_STOP is enabled — all outbound actions are blocked');
  }

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  logger.log(`🚀 Application running on: http://localhost:${port}`);
  logger.log(`📋 API docs: http://localhost:${port}/api`);
  logger.log(`❤️  Health check: http://localhost:${port}/api/health`);
}
bootstrap();
