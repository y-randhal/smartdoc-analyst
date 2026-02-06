/**
 * Chat-related interfaces for SmartDoc Analyst
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: DocumentSource[];
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

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: DocumentSource[];
}

export interface Conversation {
  id: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: Date;
}
