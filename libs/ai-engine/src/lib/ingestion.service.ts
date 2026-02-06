/**
 * Ingestion Service - Parses documents, chunks them, and upserts to Pinecone
 * Uses same embeddings and vector store as RAG for consistency
 */

import { Document } from '@langchain/core/documents';
import { PineconeStore } from '@langchain/pinecone';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Pinecone } from '@pinecone-database/pinecone';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import type { AIEngineConfig } from './types';

const SUPPORTED_MIME_TYPES = ['application/pdf', 'text/plain', 'text/markdown'];
const MAX_FILE_SIZE_MB = 10;

export interface IngestionResult {
  chunks: number;
  filename: string;
}

export class IngestionService {
  private vectorStore: PineconeStore | null = null;
  private embeddings: HuggingFaceInferenceEmbeddings;
  private config: AIEngineConfig;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(config: AIEngineConfig) {
    this.config = config;
    this.embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: config.huggingFaceApiKey,
      model: config.embeddingModel ?? 'sentence-transformers/all-MiniLM-L6-v2',
    });
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  static isSupportedMimeType(mimeType: string): boolean {
    return SUPPORTED_MIME_TYPES.includes(mimeType);
  }

  static isSupportedFilename(filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop() ?? '';
    return ['pdf', 'txt', 'md'].includes(ext);
  }

  static validateFileSize(sizeBytes: number): void {
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (sizeBytes > maxBytes) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
    }
  }

  private async getVectorStore(): Promise<PineconeStore> {
    if (this.vectorStore) {
      return this.vectorStore;
    }

    const pinecone = new Pinecone({
      apiKey: this.config.pineconeApiKey,
    });

    const index = pinecone.Index(this.config.pineconeIndexName);

    this.vectorStore = await PineconeStore.fromExistingIndex(this.embeddings, {
      pineconeIndex: index,
      namespace: this.config.pineconeNamespace,
    });

    return this.vectorStore;
  }

  private async loadDocuments(buffer: Buffer, filename: string, mimeType: string): Promise<Document[]> {
    const baseMetadata = { source: filename, filename };

    if (mimeType === 'application/pdf') {
      const blob = new Blob([buffer], { type: mimeType });
      const loader = new PDFLoader(blob, { splitPages: true });
      const docs = await loader.load();
      return docs.map((doc) => ({
        ...doc,
        metadata: { ...baseMetadata, ...doc.metadata },
      }));
    }

    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      const text = buffer.toString('utf-8');
      if (!text.trim()) {
        throw new Error('File appears to be empty');
      }
      return [
        new Document({
          pageContent: text,
          metadata: baseMetadata,
        }),
      ];
    }

    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  /**
   * Ingest a document: parse, chunk, embed, and upsert to Pinecone
   */
  async ingestDocument(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<IngestionResult> {
    IngestionService.validateFileSize(buffer.length);

    if (!IngestionService.isSupportedMimeType(mimeType) && !IngestionService.isSupportedFilename(filename)) {
      throw new Error(`Unsupported file type. Supported: PDF, TXT, MD`);
    }

    const documents = await this.loadDocuments(buffer, filename, mimeType);
    const chunks = await this.textSplitter.splitDocuments(documents);

    if (chunks.length === 0) {
      throw new Error('No content could be extracted from the document');
    }

    const docId = crypto.randomUUID();
    const ids = chunks.map((_, i) => `${docId}-chunk-${i}`);

    const store = await this.getVectorStore();
    await store.addDocuments(chunks, { ids });

    return {
      chunks: chunks.length,
      filename,
    };
  }
}
