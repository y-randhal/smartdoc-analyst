/**
 * Chat-related interfaces for SmartDoc Analyst
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  prompt: string;
  conversationId?: string;
}

export interface ChatResponse {
  message: string;
  sources?: DocumentSource[];
  conversationId?: string;
}

export interface DocumentSource {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  score?: number;
}
