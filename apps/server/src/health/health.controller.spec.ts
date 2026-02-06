import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let configGet: jest.Mock;

  beforeEach(async () => {
    configGet = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: ConfigService,
          useValue: { get: configGet },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return status ok when all env vars are set', () => {
    configGet.mockImplementation((key: string) => {
      if (['PINECONE_API_KEY', 'GROQ_API_KEY', 'HUGGINGFACE_API_KEY'].includes(key)) return 'key';
      return undefined;
    });

    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.checks.env).toEqual({
      pinecone: true,
      groq: true,
      huggingface: true,
    });
    expect(result.timestamp).toBeDefined();
  });

  it('should return status degraded when env vars are missing', () => {
    configGet.mockReturnValue(undefined);

    const result = controller.check();
    expect(result.status).toBe('degraded');
    expect(result.checks.env).toEqual({
      pinecone: false,
      groq: false,
      huggingface: false,
    });
  });
});
