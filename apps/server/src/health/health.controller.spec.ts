import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;
  let configGet: jest.Mock;

  beforeEach(async () => {
    configGet = jest.fn();
    const mockHealthService = {
      checkEnvironment: jest.fn(),
      checkAllServices: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: ConfigService,
          useValue: { get: configGet },
        },
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return status ok when all env vars are set (quick check)', async () => {
    (healthService.checkEnvironment as jest.Mock).mockReturnValue({
      pinecone: true,
      groq: true,
      huggingface: true,
    });

    const result = await controller.check();
    expect(result.status).toBe('ok');
    expect(result.env).toEqual({
      pinecone: true,
      groq: true,
      huggingface: true,
    });
    expect(result.timestamp).toBeDefined();
    expect(result.services).toBeUndefined();
  });

  it('should return status degraded when env vars are missing', async () => {
    (healthService.checkEnvironment as jest.Mock).mockReturnValue({
      pinecone: false,
      groq: false,
      huggingface: false,
    });

    const result = await controller.check();
    expect(result.status).toBe('degraded');
    expect(result.env).toEqual({
      pinecone: false,
      groq: false,
      huggingface: false,
    });
  });

  it('should perform full service checks when checkServices=true', async () => {
    (healthService.checkEnvironment as jest.Mock).mockReturnValue({
      pinecone: true,
      groq: true,
      huggingface: true,
    });

    (healthService.checkAllServices as jest.Mock).mockResolvedValue({
      pinecone: { available: true, latency: 100 },
      groq: { available: true, latency: 200 },
      huggingface: { available: true, latency: 150 },
      allHealthy: true,
    });

    const result = await controller.check('true');
    expect(result.status).toBe('ok');
    expect(result.services).toBeDefined();
    expect(result.services?.allHealthy).toBe(true);
    expect(result.services?.pinecone.available).toBe(true);
  });

  it('should return degraded when services are not responding', async () => {
    (healthService.checkEnvironment as jest.Mock).mockReturnValue({
      pinecone: true,
      groq: true,
      huggingface: true,
    });

    (healthService.checkAllServices as jest.Mock).mockResolvedValue({
      pinecone: { available: false, error: 'Connection timeout' },
      groq: { available: true, latency: 200 },
      huggingface: { available: true, latency: 150 },
      allHealthy: false,
    });

    const result = await controller.check('true');
    expect(result.status).toBe('degraded');
    expect(result.services?.allHealthy).toBe(false);
    expect(result.services?.pinecone.available).toBe(false);
  });
});
