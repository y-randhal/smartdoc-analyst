import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import { Pinecone } from '@pinecone-database/pinecone';
import { ChatGroq } from '@langchain/groq';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';

jest.mock('@pinecone-database/pinecone');
jest.mock('@langchain/groq');
jest.mock('@langchain/community/embeddings/hf');

describe('HealthService', () => {
  let service: HealthService;
  let configGet: jest.Mock;

  beforeEach(async () => {
    configGet = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: ConfigService,
          useValue: {
            get: configGet,
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkEnvironment', () => {
    it('should return true for all services when keys are configured', () => {
      configGet.mockImplementation((key: string) => {
        if (['PINECONE_API_KEY', 'GROQ_API_KEY', 'HUGGINGFACE_API_KEY'].includes(key)) {
          return 'test-key';
        }
        return undefined;
      });

      const result = service.checkEnvironment();
      expect(result.pinecone).toBe(true);
      expect(result.groq).toBe(true);
      expect(result.huggingface).toBe(true);
    });

    it('should return false for missing keys', () => {
      configGet.mockReturnValue(undefined);
      const result = service.checkEnvironment();
      expect(result.pinecone).toBe(false);
      expect(result.groq).toBe(false);
      expect(result.huggingface).toBe(false);
    });
  });

  describe('checkPinecone', () => {
    it('should return unavailable when API key is missing', async () => {
      configGet.mockReturnValue(undefined);
      const result = await service.checkPinecone();
      expect(result.available).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('should return available when connection succeeds', async () => {
      configGet.mockImplementation((key: string) => {
        if (key === 'PINECONE_API_KEY') return 'test-key';
        if (key === 'PINECONE_INDEX_NAME') return 'test-index';
        return undefined;
      });

      const mockIndex = {
        describeIndexStats: jest.fn().mockResolvedValue({}),
      };
      (Pinecone as jest.Mock).mockImplementation(() => ({
        Index: jest.fn().mockReturnValue(mockIndex),
      }));

      const result = await service.checkPinecone();
      expect(result.available).toBe(true);
      expect(result.latency).toBeDefined();
    });

    it('should return unavailable when connection fails', async () => {
      configGet.mockImplementation((key: string) => {
        if (key === 'PINECONE_API_KEY') return 'test-key';
        if (key === 'PINECONE_INDEX_NAME') return 'test-index';
        return undefined;
      });

      const mockIndex = {
        describeIndexStats: jest.fn().mockRejectedValue(new Error('Connection failed')),
      };
      (Pinecone as jest.Mock).mockImplementation(() => ({
        Index: jest.fn().mockReturnValue(mockIndex),
      }));

      const result = await service.checkPinecone();
      expect(result.available).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('checkGroq', () => {
    it('should return unavailable when API key is missing', async () => {
      configGet.mockReturnValue(undefined);
      const result = await service.checkGroq();
      expect(result.available).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('should return available when connection succeeds', async () => {
      configGet.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return 'test-key';
        return undefined;
      });

      const mockLLM = {
        invoke: jest.fn().mockResolvedValue('response'),
      };
      (ChatGroq as unknown as jest.Mock).mockImplementation(() => mockLLM);

      const result = await service.checkGroq();
      expect(result.available).toBe(true);
      expect(result.latency).toBeDefined();
    });
  });

  describe('checkHuggingFace', () => {
    it('should return unavailable when API key is missing', async () => {
      configGet.mockReturnValue(undefined);
      const result = await service.checkHuggingFace();
      expect(result.available).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('should return available when connection succeeds', async () => {
      configGet.mockImplementation((key: string) => {
        if (key === 'HUGGINGFACE_API_KEY') return 'test-key';
        return undefined;
      });

      const mockEmbeddings = {
        embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
      };
      (HuggingFaceInferenceEmbeddings as jest.Mock).mockImplementation(() => mockEmbeddings);

      const result = await service.checkHuggingFace();
      expect(result.available).toBe(true);
      expect(result.latency).toBeDefined();
    });
  });

  describe('checkAllServices', () => {
    it('should check all services in parallel', async () => {
      configGet.mockImplementation((key: string) => {
        if (['PINECONE_API_KEY', 'GROQ_API_KEY', 'HUGGINGFACE_API_KEY'].includes(key)) {
          return 'test-key';
        }
        if (key === 'PINECONE_INDEX_NAME') return 'test-index';
        return undefined;
      });

      const mockIndex = {
        describeIndexStats: jest.fn().mockResolvedValue({}),
      };
      (Pinecone as jest.Mock).mockImplementation(() => ({
        Index: jest.fn().mockReturnValue(mockIndex),
      }));

      const mockLLM = {
        invoke: jest.fn().mockResolvedValue('response'),
      };
      (ChatGroq as unknown as jest.Mock).mockImplementation(() => mockLLM);

      const mockEmbeddings = {
        embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
      };
      (HuggingFaceInferenceEmbeddings as jest.Mock).mockImplementation(() => mockEmbeddings);

      const result = await service.checkAllServices();
      expect(result.allHealthy).toBe(true);
      expect(result.pinecone.available).toBe(true);
      expect(result.groq.available).toBe(true);
      expect(result.huggingface.available).toBe(true);
    });
  });
});
