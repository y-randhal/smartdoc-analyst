import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IngestionService } from '@smartdoc-analyst/ai-engine';
import type {
  IngestionResponse,
  IndexedDocument,
  DocumentListResponse,
} from '@smartdoc-analyst/api-interfaces';

interface DocumentEntry {
  id: string;
  filename: string;
  chunkIds: string[];
  uploadedAt: Date;
}

@Injectable()
export class DocumentsService {
  private ingestionService: IngestionService | null = null;
  private readonly registry = new Map<string, DocumentEntry>();

  constructor(private readonly config: ConfigService) {}

  private getIngestionService(): IngestionService {
    if (!this.ingestionService) {
      const groqApiKey = this.config.get<string>('GROQ_API_KEY');
      const pineconeApiKey = this.config.get<string>('PINECONE_API_KEY');
      const pineconeIndex = this.config.get<string>('PINECONE_INDEX_NAME', 'smartdoc-index');
      const hfApiKey = this.config.get<string>('HUGGINGFACE_API_KEY');

      if (!pineconeApiKey) {
        throw new Error('Missing required env var: PINECONE_API_KEY must be set');
      }

      if (!hfApiKey) {
        throw new Error('Missing required env var: HUGGINGFACE_API_KEY must be set for document ingestion');
      }

      this.ingestionService = new IngestionService({
        groqApiKey: groqApiKey ?? '',
        pineconeApiKey,
        pineconeIndexName: pineconeIndex,
        huggingFaceApiKey: hfApiKey,
      });
    }
    return this.ingestionService;
  }

  async ingestFile(buffer: Buffer, filename: string, mimeType: string): Promise<IngestionResponse> {
    const service = this.getIngestionService();
    const result = await service.ingestDocument(buffer, filename, mimeType);

    this.registry.set(result.documentId, {
      id: result.documentId,
      filename: result.filename,
      chunkIds: result.chunkIds,
      uploadedAt: new Date(),
    });

    return {
      documentId: result.documentId,
      chunks: result.chunks,
      filename: result.filename,
    };
  }

  listDocuments(): DocumentListResponse {
    const documents: IndexedDocument[] = Array.from(this.registry.values()).map(
      (entry) => ({
        id: entry.id,
        filename: entry.filename,
        chunks: entry.chunkIds.length,
        uploadedAt: entry.uploadedAt.toISOString(),
      })
    );
    return { documents };
  }

  async deleteDocument(id: string): Promise<boolean> {
    const entry = this.registry.get(id);
    if (!entry) return false;

    const service = this.getIngestionService();
    await service.deleteDocument(entry.chunkIds);
    this.registry.delete(id);
    return true;
  }
}
