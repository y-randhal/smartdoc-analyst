/**
 * RAG (Retrieval Augmented Generation) interfaces
 */

export interface RAGContext {
  query: string;
  documents: RetrievedDocument[];
}

export interface RetrievedDocument {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  score: number;
}

export interface RAGConfig {
  topK?: number;
  similarityThreshold?: number;
}

export interface IngestionResponse {
  chunks: number;
  filename: string;
}
