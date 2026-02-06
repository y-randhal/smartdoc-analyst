import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  DocumentSource,
} from '@smartdoc-analyst/api-interfaces';
import { ConversationsService } from './conversations.service';

/**
 * ChatService - RxJS-based service for managing chat message stream
 * Provides reactive state management for the chat UI
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly apiUrl = `${environment.apiUrl}/chat`;
  private readonly messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly conversationIdSubject = new BehaviorSubject<string | null>(null);
  private readonly conversationsService = inject(ConversationsService);

  readonly messages$ = this.messagesSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();
  readonly conversationId$ = this.conversationIdSubject.asObservable();

  getConversationId(): string | null {
    return this.conversationIdSubject.value;
  }

  /**
   * Send a prompt and stream assistant response in real time
   */
  sendMessage(prompt: string): Observable<ChatResponse> {
    this.errorSubject.next(null);
    this.loadingSubject.next(true);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    const assistantId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      sources: [],
    };

    this.messagesSubject.next([
      ...this.messagesSubject.value,
      userMessage,
      assistantMessage,
    ]);

    const request: ChatRequest = {
      prompt,
      conversationId: this.conversationIdSubject.value ?? undefined,
    };

    fetch(`${this.apiUrl}/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(res.statusText || 'Stream request failed');
        }
        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        let accumulatedContent = '';

        const updateAssistant = (updates: Partial<ChatMessage>) => {
          const messages = this.messagesSubject.value;
          const idx = messages.findIndex((m) => m.id === assistantId);
          if (idx === -1) return;
          messages[idx] = { ...messages[idx], ...updates };
          this.messagesSubject.next([...messages]);
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const event = JSON.parse(line) as {
                  content?: string;
                  sources?: DocumentSource[];
                  conversationId?: string;
                  error?: string;
                };
                if (event.error) {
                  this.errorSubject.next(event.error);
                  break;
                }
                if (event.conversationId) {
                  this.conversationIdSubject.next(event.conversationId);
                  this.conversationsService.refreshList();
                }
                if (event.content) {
                  accumulatedContent += event.content;
                  updateAssistant({ content: accumulatedContent });
                }
                if (event.sources) {
                  updateAssistant({ sources: event.sources });
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      })
      .catch((err) => {
        this.errorSubject.next(err?.message ?? 'Failed to get response');
      })
      .finally(() => {
        this.loadingSubject.next(false);
      });

    return of({ message: '', sources: [] });
  }

  /**
   * Get current messages snapshot
   */
  getMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  removeLastAssistantMessage(): void {
    const messages = this.messagesSubject.value;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      this.messagesSubject.next(messages.slice(0, -1));
    }
  }

  /**
   * Clear chat history and start new conversation
   */
  clearMessages(): void {
    this.messagesSubject.next([]);
    this.conversationIdSubject.next(null);
    this.errorSubject.next(null);
  }

  /**
   * Load a conversation and set as current
   */
  loadConversation(messages: ChatMessage[], conversationId: string): void {
    this.messagesSubject.next(messages);
    this.conversationIdSubject.next(conversationId);
    this.errorSubject.next(null);
  }
}
