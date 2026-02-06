import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { join } from 'path';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from '../health/health.module';
import { ConversationsModule } from '../conversations/conversations.module';

describe('API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'e2e-'));
    process.env.DATA_DIR = dataDir;
    process.env.PINECONE_API_KEY = 'pk-test';
    process.env.GROQ_API_KEY = 'gq-test';
    process.env.HUGGINGFACE_API_KEY = 'hf-test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
        HealthModule,
        ConversationsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['/health'] });
    app.enableCors({ origin: true, credentials: true });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return health status', () =>
      request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBeDefined();
          expect(res.body.timestamp).toBeDefined();
          expect(res.body.checks.env).toBeDefined();
        }));
  });

  describe('GET /api/conversations', () => {
    it('should return conversations list', () =>
      request(app.getHttpServer())
        .get('/api/conversations')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        }));
  });

  describe('GET /api/conversations/:id', () => {
    it('should return 404 for nonexistent conversation', () =>
      request(app.getHttpServer())
        .get('/api/conversations/nonexistent-id')
        .expect(404));
  });
});
