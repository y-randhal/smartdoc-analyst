import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ConversationsService } from '../conversations/conversations.service';

const mockGenerateResponse = jest.fn();
const mockGenerateResponseStream = jest.fn();

jest.mock('@smartdoc-analyst/ai-engine', () => ({
  RAGService: jest.fn().mockImplementation(() => ({
    generateResponse: mockGenerateResponse,
    generateResponseStream: mockGenerateResponseStream,
  })),
}));

describe('ChatService', () => {
  let service: ChatService;

  const mockConversationsService = {
    get: jest.fn(),
    getOrCreate: jest.fn(),
    appendUserMessage: jest.fn(),
    appendAssistantMessage: jest.fn(),
  };

  beforeEach(async () => {
    mockGenerateResponse.mockReset();
    mockGenerateResponseStream.mockReset();
    mockConversationsService.get.mockReset();
    mockConversationsService.getOrCreate.mockReset();
    mockConversationsService.appendUserMessage.mockReset();
    mockConversationsService.appendAssistantMessage.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const env: Record<string, string> = {
                GROQ_API_KEY: 'gq',
                PINECONE_API_KEY: 'pk',
                HUGGINGFACE_API_KEY: 'hf',
                PINECONE_INDEX_NAME: 'idx',
              };
              return env[key];
            }),
          },
        },
        {
          provide: ConversationsService,
          useValue: mockConversationsService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processPrompt', () => {
    it('should return answer and sources from RAG', async () => {
      mockGenerateResponse.mockResolvedValue({
        answer: 'Test answer',
        sources: [{ id: 's1', content: 'ctx', metadata: {}, score: 0.9 }],
      });
      mockConversationsService.get.mockReturnValue(null);

      const result = await service.processPrompt('Hello');
      expect(result.message).toBe('Test answer');
      expect(result.sources).toHaveLength(1);
      expect(result.sources![0].id).toBe('s1');
      expect(mockGenerateResponse).toHaveBeenCalledWith('Hello', 4, []);
    });

    it('should pass conversation history when conversationId provided', async () => {
      mockGenerateResponse.mockResolvedValue({ answer: 'Hi', sources: [] });
      mockConversationsService.get.mockReturnValue({
        id: 'conv-1',
        messages: [
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Hello!' },
        ],
      });

      await service.processPrompt('Bye', 'conv-1');
      expect(mockGenerateResponse).toHaveBeenCalledWith('Bye', 4, [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello!' },
      ]);
    });
  });

  describe('processPromptStream', () => {
    it('should yield chunks and sources', async () => {
      const conv = { id: 'conv-1', messages: [] };
      mockConversationsService.getOrCreate.mockReturnValue(conv);
      mockGenerateResponseStream.mockImplementation(async function* () {
        yield { type: 'chunk' as const, content: 'Hello ' };
        yield { type: 'chunk' as const, content: 'world' };
        yield { type: 'sources' as const, sources: [{ id: 's1', content: 'x', metadata: {}, score: 0.8 }] };
      });

      const events: unknown[] = [];
      for await (const e of service.processPromptStream('Hi')) {
        events.push(e);
      }

      expect(events[0]).toEqual({ conversationId: 'conv-1' });
      expect(events[1]).toEqual({ content: 'Hello ', conversationId: 'conv-1' });
      expect(events[2]).toEqual({ content: 'world', conversationId: 'conv-1' });
      expect(events[3]).toMatchObject({ sources: [{ id: 's1' }], conversationId: 'conv-1' });
      expect(mockConversationsService.appendUserMessage).toHaveBeenCalledWith('conv-1', expect.any(Object));
      expect(mockConversationsService.appendAssistantMessage).toHaveBeenCalledWith(
        'conv-1',
        expect.objectContaining({ content: 'Hello world', role: 'assistant' })
      );
    });
  });
});
