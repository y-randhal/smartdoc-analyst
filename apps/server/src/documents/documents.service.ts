import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IngestionService } from '@smartdoc-analyst/ai-engine';
import type { IngestionResponse } from '@smartdoc-analyst/api-interfaces';

@Injectable()
export class DocumentsService {
  private ingestionService: IngestionService | null = null;

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
    return service.ingestDocument(buffer, filename, mimeType);
  }
}
