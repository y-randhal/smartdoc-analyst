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
  documentId: string;
  chunks: number;
  filename: string;
}

export interface IndexedDocument {
  id: string;
  filename: string;
  chunks: number;
  uploadedAt: string;
}

export interface DocumentListResponse {
  documents: IndexedDocument[];
}
