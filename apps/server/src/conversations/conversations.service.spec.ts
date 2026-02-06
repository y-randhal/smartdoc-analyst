import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { ConversationsService } from './conversations.service';

describe('ConversationsService', () => {
  let service: ConversationsService;

  beforeEach(async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'conv-test-'));
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(dataDir) },
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new conversation', () => {
    const conv = service.create();
    expect(conv.id).toBeDefined();
    expect(conv.messages).toEqual([]);
    expect(conv.createdAt).toBeInstanceOf(Date);
    expect(conv.updatedAt).toBeInstanceOf(Date);
  });

  it('should list conversations', () => {
    const c1 = service.create();
    const c2 = service.create();
    const list = service.list();
    expect(list.length).toBe(2);
    expect(list.map((l) => l.id)).toContain(c1.id);
    expect(list.map((l) => l.id)).toContain(c2.id);
  });

  it('should get conversation by id', () => {
    const conv = service.create();
    const found = service.get(conv.id);
    expect(found).toEqual(conv);
    expect(service.get('nonexistent')).toBeNull();
  });

  it('should append messages', () => {
    const conv = service.create();
    service.appendUserMessage(conv.id, {
      id: 'msg-1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
    });
    service.appendAssistantMessage(conv.id, {
      id: 'msg-2',
      role: 'assistant',
      content: 'Hi',
      timestamp: new Date(),
    });
    const found = service.get(conv.id);
    expect(found?.messages.length).toBe(2);
    expect(found?.messages[0].content).toBe('Hello');
    expect(found?.messages[1].content).toBe('Hi');
  });

  it('should delete conversation', () => {
    const conv = service.create();
    expect(service.delete(conv.id)).toBe(true);
    expect(service.get(conv.id)).toBeNull();
    expect(service.delete('nonexistent')).toBe(false);
  });

  it('getOrCreate should return existing or create new', () => {
    const conv = service.create();
    const same = service.getOrCreate(conv.id);
    expect(same).toBe(conv);
    const fresh = service.getOrCreate('nonexistent');
    expect(fresh.id).toBeDefined();
    expect(fresh.id).not.toBe(conv.id);
  });
});
