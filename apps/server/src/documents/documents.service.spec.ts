import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { DocumentsService } from './documents.service';

const mockIngestDocument = jest.fn();
const mockDeleteDocument = jest.fn();

jest.mock('@smartdoc-analyst/ai-engine', () => ({
  IngestionService: jest.fn().mockImplementation(() => ({
    ingestDocument: mockIngestDocument,
    deleteDocument: mockDeleteDocument,
  })),
}));

describe('DocumentsService', () => {
  let service: DocumentsService;

  beforeEach(async () => {
    mockIngestDocument.mockReset();
    mockDeleteDocument.mockReset();
    const dataDir = mkdtempSync(join(tmpdir(), 'docs-test-'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'DATA_DIR') return dataDir;
              if (key === 'PINECONE_API_KEY') return 'pk';
              if (key === 'HUGGINGFACE_API_KEY') return 'hf';
              if (key === 'GROQ_API_KEY') return 'gq';
              if (key === 'PINECONE_INDEX_NAME') return 'idx';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list empty documents initially', () => {
    const result = service.listDocuments();
    expect(result.documents).toEqual([]);
  });

  it('should ingest file and add to registry', async () => {
    mockIngestDocument.mockResolvedValue({
      documentId: 'doc-1',
      filename: 'test.pdf',
      chunkIds: ['chunk-1', 'chunk-2'],
      chunks: 2,
    });

    const result = await service.ingestFile(Buffer.from('x'), 'test.pdf', 'application/pdf');
    expect(result.documentId).toBe('doc-1');
    expect(result.filename).toBe('test.pdf');
    expect(result.chunks).toBe(2);

    const list = service.listDocuments();
    expect(list.documents.length).toBe(1);
    expect(list.documents[0]).toEqual({
      id: 'doc-1',
      filename: 'test.pdf',
      chunks: 2,
      uploadedAt: expect.any(String),
    });
  });

  it('should delete document', async () => {
    mockIngestDocument.mockResolvedValue({
      documentId: 'doc-1',
      filename: 'test.pdf',
      chunkIds: ['chunk-1'],
      chunks: 1,
    });
    await service.ingestFile(Buffer.from('x'), 'test.pdf', 'application/pdf');

    mockDeleteDocument.mockResolvedValue(undefined);
    const deleted = await service.deleteDocument('doc-1');
    expect(deleted).toBe(true);
    expect(mockDeleteDocument).toHaveBeenCalledWith(['chunk-1']);
    expect(service.listDocuments().documents.length).toBe(0);
  });

  it('should return false when deleting nonexistent document', async () => {
    const deleted = await service.deleteDocument('nonexistent');
    expect(deleted).toBe(false);
    expect(mockDeleteDocument).not.toHaveBeenCalled();
  });
});
