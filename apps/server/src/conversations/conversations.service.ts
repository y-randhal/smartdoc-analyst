import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type {
  Conversation,
  ConversationMessage,
  ConversationSummary,
} from '@smartdoc-analyst/api-interfaces';

interface StoredConversation {
  id: string;
  messages: Array<Omit<ConversationMessage, 'timestamp'> & { timestamp: string }>;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ConversationsService implements OnModuleInit {
  private readonly conversations = new Map<string, Conversation>();
  private storagePath: string;

  constructor(private readonly config: ConfigService) {
    const dataDir = this.config.get<string>('DATA_DIR') ?? join(process.cwd(), 'data');
    this.storagePath = join(dataDir, 'conversations.json');
  }

  async onModuleInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    try {
      const raw = await readFile(this.storagePath, 'utf-8');
      const stored: StoredConversation[] = JSON.parse(raw);
      this.conversations.clear();
      for (const s of stored) {
        const messages: ConversationMessage[] = s.messages.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        this.conversations.set(s.id, {
          id: s.id,
          messages,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        });
      }
    } catch {
      // File doesn't exist or invalid - start fresh
    }
  }

  private async save(): Promise<void> {
    try {
      const dir = join(this.storagePath, '..');
      await mkdir(dir, { recursive: true });
      const stored: StoredConversation[] = Array.from(this.conversations.values()).map(
        (c) => ({
          id: c.id,
          messages: c.messages.map((m) => ({
            ...m,
            timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
          })),
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })
      );
      await writeFile(this.storagePath, JSON.stringify(stored, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save conversations:', err);
    }
  }

  list(): ConversationSummary[] {
    return Array.from(this.conversations.values())
      .map((c) => ({
        id: c.id,
        title: this.getTitle(c),
        updatedAt: c.updatedAt,
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  get(id: string): Conversation | null {
    return this.conversations.get(id) ?? null;
  }

  create(): Conversation {
    const id = crypto.randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      id,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conversation);
    this.save();
    return conversation;
  }

  getOrCreate(id: string | undefined): Conversation {
    if (id) {
      const existing = this.conversations.get(id);
      if (existing) return existing;
    }
    return this.create();
  }

  appendUserMessage(conversationId: string, message: ConversationMessage): void {
    const conv = this.conversations.get(conversationId);
    if (!conv) return;

    conv.messages.push(message);
    conv.updatedAt = new Date();
    this.save();
  }

  appendAssistantMessage(conversationId: string, message: ConversationMessage): void {
    const conv = this.conversations.get(conversationId);
    if (!conv) return;

    conv.messages.push(message);
    conv.updatedAt = new Date();
    this.save();
  }

  delete(id: string): boolean {
    const deleted = this.conversations.delete(id);
    if (deleted) this.save();
    return deleted;
  }

  private getTitle(conv: Conversation): string {
    const firstUser = conv.messages.find((m) => m.role === 'user');
    if (firstUser?.content) {
      const trimmed = firstUser.content.trim();
      return trimmed.length > 50 ? trimmed.slice(0, 50) + '...' : trimmed;
    }
    return 'New conversation';
  }
}
