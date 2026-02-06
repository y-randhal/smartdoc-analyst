import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

jest.mock('@smartdoc-analyst/ai-engine', () => ({
  IngestionService: {
    isSupportedMimeType: jest.fn((m: string) => ['application/pdf', 'text/plain', 'text/markdown'].includes(m)),
    isSupportedFilename: jest.fn((f: string) => /\.(pdf|txt|md)$/i.test(f)),
    validateFileSize: jest.fn(),
  },
}));

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let documentsService: DocumentsService;

  const mockDocumentsService = {
    listDocuments: jest.fn(),
    deleteDocument: jest.fn(),
    ingestFile: jest.fn(),
  };

  beforeEach(async () => {
    mockDocumentsService.listDocuments.mockReset();
    mockDocumentsService.deleteDocument.mockReset();
    mockDocumentsService.ingestFile.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: mockDocumentsService,
        },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
    documentsService = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    it('should return documents list', () => {
      mockDocumentsService.listDocuments.mockReturnValue({
        documents: [{ id: '1', filename: 'a.pdf', chunks: 2, uploadedAt: '2025-01-01' }],
      });
      const result = controller.list();
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].filename).toBe('a.pdf');
    });
  });

  describe('delete', () => {
    it('should return deleted true when document exists', async () => {
      mockDocumentsService.deleteDocument.mockResolvedValue(true);
      const result = await controller.delete('doc-1');
      expect(result).toEqual({ deleted: true });
      expect(mockDocumentsService.deleteDocument).toHaveBeenCalledWith('doc-1');
    });

    it('should throw NotFoundException when document does not exist', async () => {
      mockDocumentsService.deleteDocument.mockResolvedValue(false);
      await expect(controller.delete('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('upload', () => {
    it('should throw BadRequestException when no file provided', async () => {
      await expect(controller.upload(undefined)).rejects.toThrow(BadRequestException);
      expect(mockDocumentsService.ingestFile).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for unsupported file type', async () => {
      const file = {
        buffer: Buffer.from('x'),
        originalname: 'image.png',
        mimetype: 'image/png',
        size: 100,
      };
      await expect(controller.upload(file)).rejects.toThrow(BadRequestException);
      expect(mockDocumentsService.ingestFile).not.toHaveBeenCalled();
    });

    it('should call ingestFile for valid PDF', async () => {
      const file = {
        buffer: Buffer.from('pdf content'),
        originalname: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      };
      mockDocumentsService.ingestFile.mockResolvedValue({
        documentId: 'doc-1',
        filename: 'doc.pdf',
        chunks: 3,
      });
      const result = await controller.upload(file);
      expect(result.documentId).toBe('doc-1');
      expect(mockDocumentsService.ingestFile).toHaveBeenCalledWith(
        file.buffer,
        'doc.pdf',
        'application/pdf'
      );
    });
  });
});
