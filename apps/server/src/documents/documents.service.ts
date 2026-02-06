import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
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

interface StoredDocumentEntry {
  id: string;
  filename: string;
  chunkIds: string[];
  uploadedAt: string;
}

@Injectable()
export class DocumentsService implements OnModuleInit {
  private readonly logger = new Logger(DocumentsService.name);
  private ingestionService: IngestionService | null = null;
  private readonly registry = new Map<string, DocumentEntry>();
  private storagePath: string;

  constructor(private readonly config: ConfigService) {
    const dataDir = this.config.get<string>('DATA_DIR') ?? join(process.cwd(), 'data');
    this.storagePath = join(dataDir, 'documents.json');
  }

  async onModuleInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    try {
      const raw = await readFile(this.storagePath, 'utf-8');
      const stored: StoredDocumentEntry[] = JSON.parse(raw);
      this.registry.clear();
      for (const s of stored) {
        this.registry.set(s.id, {
          id: s.id,
          filename: s.filename,
          chunkIds: s.chunkIds,
          uploadedAt: new Date(s.uploadedAt),
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
      const stored: StoredDocumentEntry[] = Array.from(this.registry.values()).map(
        (e) => ({
          id: e.id,
          filename: e.filename,
          chunkIds: e.chunkIds,
          uploadedAt: e.uploadedAt.toISOString(),
        })
      );
      await writeFile(this.storagePath, JSON.stringify(stored, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to save documents registry', err instanceof Error ? err.stack : String(err));
    }
  }

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
    this.save();

    return {
      documentId: result.documentId,
      chunks: result.chunks,
      filename: result.filename,
    };
  }

  async *ingestFileWithProgress(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): AsyncGenerator<
    { stage: 'parsing' } | { stage: 'chunking' } | { stage: 'indexing'; total: number } | { stage: 'done'; result: IngestionResponse }
  > {
    const service = this.getIngestionService();
    for await (const event of service.ingestDocumentWithProgress(buffer, filename, mimeType)) {
      if (event.stage === 'done') {
        const { result } = event;
        this.registry.set(result.documentId, {
          id: result.documentId,
          filename: result.filename,
          chunkIds: result.chunkIds,
          uploadedAt: new Date(),
        });
        this.save();
        yield {
          stage: 'done',
          result: {
            documentId: result.documentId,
            chunks: result.chunks,
            filename: result.filename,
          },
        };
      } else {
        yield event as { stage: 'parsing' } | { stage: 'chunking' } | { stage: 'indexing'; total: number };
      }
    }
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
    this.save();
    return true;
  }
}
