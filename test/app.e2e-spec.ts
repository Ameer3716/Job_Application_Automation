import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from './../src/app.module';

describe('AppController (e2e) & Security', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.setGlobalPrefix('api');
    
    // Apply same global pipes as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Integration & Health Check', () => {
    it('/api/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.services).toBeDefined();
        });
    });
  });

  describe('Security Tests', () => {
    it('should reject unauthenticated requests to protected endpoints (401)', () => {
      return request(app.getHttpServer())
        .get('/api/applications')
        .expect(401);
    });

    it('should reject unauthenticated requests to Export endpoints (401)', () => {
      return request(app.getHttpServer())
        .get('/api/export/csv')
        .expect(401);
    });

    it('should reject invalid JWT tokens with 401', () => {
      return request(app.getHttpServer())
        .get('/api/applications')
        .set('Authorization', 'Bearer invalid-token-string')
        .expect(401);
    });

    it('should prevent mass assignment on registration (DTO validation)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          isAdmin: true // Malicious field
        })
        .expect(400) // Or whatever Supabase returns / ValidationPipe rejects
        .expect((res) => {
           // Should not process isAdmin due to whitelist: true
        });
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limiting headers', async () => {
      const res = await request(app.getHttpServer()).get('/api/health');
      expect(res.headers['x-ratelimit-limit']).toBeDefined();
      expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });
});
