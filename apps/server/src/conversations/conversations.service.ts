import { Injectable } from '@nestjs/common';
import type {
  Conversation,
  ConversationMessage,
  ConversationSummary,
} from '@smartdoc-analyst/api-interfaces';

@Injectable()
export class ConversationsService {
  private readonly conversations = new Map<string, Conversation>();

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
  }

  appendAssistantMessage(conversationId: string, message: ConversationMessage): void {
    const conv = this.conversations.get(conversationId);
    if (!conv) return;

    conv.messages.push(message);
    conv.updatedAt = new Date();
  }

  delete(id: string): boolean {
    return this.conversations.delete(id);
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
