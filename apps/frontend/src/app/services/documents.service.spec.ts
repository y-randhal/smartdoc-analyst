import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { DocumentsService } from './documents.service';
import type {
  DocumentListResponse,
  IngestionResponse,
} from '@smartdoc-analyst/api-interfaces';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let httpMock: HttpTestingController;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DocumentsService],
    });
    service = TestBed.inject(DocumentsService);
    httpMock = TestBed.inject(HttpTestingController);
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should fetch and update documents list', (done) => {
      const mockResponse: DocumentListResponse = {
        documents: [
          {
            id: 'doc-1',
            filename: 'test.pdf',
            chunks: 10,
            uploadedAt: new Date().toISOString(),
          },
        ],
      };

      service.list().subscribe((response) => {
        expect(response).toEqual(mockResponse);
        service.documents$.subscribe((docs) => {
          expect(docs).toEqual(mockResponse.documents);
          done();
        });
      });

      const req = httpMock.expectOne(`${service['apiUrl']}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('delete', () => {
    it('should delete document and update list', (done) => {
      // First, set up initial documents
      const initialDocs = [
        {
          id: 'doc-1',
          filename: 'test.pdf',
          chunks: 10,
          uploadedAt: new Date().toISOString(),
        },
        {
          id: 'doc-2',
          filename: 'test2.pdf',
          chunks: 5,
          uploadedAt: new Date().toISOString(),
        },
      ];
      (service as any).listSubject.next(initialDocs);

      service.delete('doc-1').subscribe((deleted) => {
        expect(deleted).toBe(true);
        service.documents$.subscribe((docs) => {
          expect(docs.length).toBe(1);
          expect(docs[0].id).toBe('doc-2');
          done();
        });
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/doc-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ deleted: true });
    });

    it('should not update list if delete fails', (done) => {
      const initialDocs = [
        {
          id: 'doc-1',
          filename: 'test.pdf',
          chunks: 10,
          uploadedAt: new Date().toISOString(),
        },
      ];
      (service as any).listSubject.next(initialDocs);

      service.delete('doc-1').subscribe((deleted) => {
        expect(deleted).toBe(false);
        service.documents$.subscribe((docs) => {
          expect(docs.length).toBe(1);
          done();
        });
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/doc-1`);
      req.flush({ deleted: false });
    });
  });

  describe('upload', () => {
    it('should upload file successfully', (done) => {
      const file = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });
      const mockResponse: IngestionResponse = {
        documentId: 'doc-123',
        chunks: 5,
        filename: 'test.pdf',
      };

      service.upload(file).subscribe((result) => {
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data).toEqual(mockResponse);
        }
        done();
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      req.flush(mockResponse);
    });

    it('should handle upload error', (done) => {
      const file = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });

      service.upload(file).subscribe((result) => {
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBeTruthy();
        }
        done();
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/upload`);
      req.flush(
        { message: 'Upload failed' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('uploadWithProgress', () => {
    it('should emit progress events and final result', (done) => {
      const file = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });

      const mockReader = {
        read: jest.fn(),
        releaseLock: jest.fn(),
      };

      const encoder = new TextEncoder();
      const events = [
        { stage: 'parsing' },
        { stage: 'chunking' },
        { stage: 'indexing', total: 10 },
        {
          stage: 'done',
          result: {
            documentId: 'doc-123',
            chunks: 10,
            filename: 'test.pdf',
          },
        },
      ];

      let eventIndex = 0;
      mockReader.read.mockImplementation(() => {
        if (eventIndex < events.length) {
          const event = events[eventIndex++];
          return Promise.resolve({
            done: false,
            value: encoder.encode(JSON.stringify(event) + '\n'),
          });
        }
        return Promise.resolve({ done: true, value: undefined });
      });

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as any;

      mockFetch.mockResolvedValueOnce(mockResponse);

      const progressEvents: any[] = [];
      service.uploadWithProgress(file).subscribe({
        next: (event) => {
          progressEvents.push(event);
        },
        complete: () => {
          expect(progressEvents.length).toBeGreaterThan(0);
          const doneEvent = progressEvents.find(
            (e) => 'ok' in e && e.ok === true
          );
          expect(doneEvent).toBeTruthy();
          done();
        },
      });
    });

    it('should handle upload error', (done) => {
      const file = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({ error: 'File too large' }),
      } as any);

      service.uploadWithProgress(file).subscribe({
        next: (event) => {
          if ('ok' in event && !event.ok) {
            expect(event.error).toBeTruthy();
            done();
          }
        },
      });
    });
  });
});
