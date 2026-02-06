import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { ChatService } from './chat.service';
import { ConversationsService } from './conversations.service';
import type { ChatMessage } from '@smartdoc-analyst/api-interfaces';

describe('ChatService', () => {
  let service: ChatService;
  let conversationsService: ConversationsService;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ChatService, ConversationsService],
    });
    service = TestBed.inject(ChatService);
    conversationsService = TestBed.inject(ConversationsService);
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
    // Default mock: return empty stream so sendMessage doesn't fail
    mockFetch.mockImplementation(
      () =>
        Promise.resolve({
          ok: true,
          body: {
            getReader: () => ({
              read: () => Promise.resolve({ done: true, value: undefined }),
              releaseLock: jest.fn(),
            }),
          },
        }) as unknown as Promise<Response>
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMessages', () => {
    it('should return empty array initially', () => {
      expect(service.getMessages()).toEqual([]);
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages and reset state', () => {
      service.sendMessage('test');
      expect(service.getMessages().length).toBeGreaterThan(0);

      service.clearMessages();
      expect(service.getMessages()).toEqual([]);
      expect(service.getConversationId()).toBeNull();
      service.error$.subscribe((error) => expect(error).toBeNull());
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      service.clearError();
      const error = await firstValueFrom(service.error$);
      expect(error).toBeNull();
    });
  });

  describe('removeLastAssistantMessage', () => {
    it('should remove last assistant message if present', () => {
      service.sendMessage('test');
      const initialLength = service.getMessages().length;
      const lastMessage = service.getMessages()[initialLength - 1];

      if (lastMessage?.role === 'assistant') {
        service.removeLastAssistantMessage();
        expect(service.getMessages().length).toBe(initialLength - 1);
      }
    });

    it('should not remove anything if last message is not assistant', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'test',
          timestamp: new Date(),
        },
      ];
      (service as unknown as { messagesSubject: { next: (m: ChatMessage[]) => void } }).messagesSubject.next(messages);
      const initialLength = service.getMessages().length;

      service.removeLastAssistantMessage();
      expect(service.getMessages().length).toBe(initialLength);
    });
  });

  describe('loadConversation', () => {
    it('should load messages and set conversation ID', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi there',
          timestamp: new Date(),
        },
      ];

      service.loadConversation(messages, 'conv-123');
      expect(service.getMessages()).toEqual(messages);
      expect(service.getConversationId()).toBe('conv-123');
    });
  });

  describe('sendMessage', () => {
    it('should add user and assistant messages immediately', () => {
      const prompt = 'Test question';
      service.sendMessage(prompt);

      const messages = service.getMessages();
      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe(prompt);
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].content).toBe('');
    });

    it('should set loading state to true when sending', (done) => {
      service.loading$.subscribe((loading) => {
        if (loading) {
          expect(loading).toBe(true);
          done();
        }
      });
      service.sendMessage('test');
    });

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      service.sendMessage('test').subscribe();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      let hasError = false;
      service.error$.subscribe((error) => {
        if (error) hasError = true;
      });
      expect(hasError).toBe(true);
    });

    it('should handle stream response with content chunks', async () => {
      const mockReader = {
        read: jest.fn(),
        releaseLock: jest.fn(),
      };

      const encoder = new TextEncoder();
      const chunks = [
        encoder.encode(JSON.stringify({ content: 'Hello' }) + '\n'),
        encoder.encode(JSON.stringify({ content: ' World' }) + '\n'),
        encoder.encode(JSON.stringify({ sources: [] }) + '\n'),
      ];

      let chunkIndex = 0;
      mockReader.read.mockImplementation(() => {
        if (chunkIndex < chunks.length) {
          return Promise.resolve({
            done: false,
            value: chunks[chunkIndex++],
          });
        }
        return Promise.resolve({ done: true, value: undefined });
      });

      const mockResponse: Partial<Response> = {
        ok: true,
        body: {
          getReader: () => mockReader,
        } as unknown as ReadableStream<Uint8Array>,
      };

      mockFetch.mockResolvedValueOnce(mockResponse as Response);

      service.sendMessage('test').subscribe();

      await new Promise((resolve) => setTimeout(resolve, 200));

      const messages = service.getMessages();
      const assistantMsg = messages.find((m) => m.role === 'assistant');
      expect(assistantMsg?.content).toBe('Hello World');
    });

    it('should handle conversationId in stream response', async () => {
      const mockReader = {
        read: jest.fn(),
        releaseLock: jest.fn(),
      };

      const encoder = new TextEncoder();
      mockReader.read.mockResolvedValueOnce({
        done: false,
        value: encoder.encode(JSON.stringify({ conversationId: 'conv-123' }) + '\n'),
      });
      mockReader.read.mockResolvedValueOnce({ done: true, value: undefined });

      const mockResponse: Partial<Response> = {
        ok: true,
        body: {
          getReader: () => mockReader,
        } as unknown as ReadableStream<Uint8Array>,
      };

      mockFetch.mockResolvedValueOnce(mockResponse as Response);
      const refreshSpy = jest.spyOn(conversationsService, 'refreshList');

      service.sendMessage('test').subscribe();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(service.getConversationId()).toBe('conv-123');
      expect(refreshSpy).toHaveBeenCalled();
    });
  });
});
