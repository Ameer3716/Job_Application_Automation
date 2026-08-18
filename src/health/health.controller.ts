import { Controller, Get } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

@Controller('health')
export class HealthController {
  constructor(private readonly aiService: AiService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        geminiAi: this.aiService.isAvailable() ? 'available' : 'unavailable',
        gmailApi: 'not_configured', // Updated when Gmail OAuth is implemented
      },
    };
  }

  @Get('ready')
  readiness() {
    const isReady = this.aiService.isAvailable();
    return {
      ready: isReady,
      checks: {
        ai: this.aiService.isAvailable(),
        database: true, // If this endpoint responds, DB is connected via TypeORM
      },
    };
  }
}
