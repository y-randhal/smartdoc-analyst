import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
} from '@smartdoc-analyst/api-interfaces';

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

  readonly messages$ = this.messagesSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  /**
   * Send a prompt and append user message, then stream/append assistant response
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

    this.messagesSubject.next([...this.messagesSubject.value, userMessage]);

    const request: ChatRequest = { prompt };

    return this.http.post<ChatResponse>(this.apiUrl, request).pipe(
      tap((response) => {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
        };
        this.messagesSubject.next([
          ...this.messagesSubject.value,
          assistantMessage,
        ]);
        this.loadingSubject.next(false);
      }),
      catchError((err) => {
        this.loadingSubject.next(false);
        this.errorSubject.next(err?.message ?? 'Failed to get response');
        return of({ message: '', sources: [] });
      })
    );
  }

  /**
   * Get current messages snapshot
   */
  getMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  /**
   * Clear chat history
   */
  clearMessages(): void {
    this.messagesSubject.next([]);
    this.errorSubject.next(null);
  }
}
