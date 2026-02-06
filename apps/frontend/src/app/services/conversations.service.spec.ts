import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ConversationsService } from './conversations.service';
import type {
  Conversation,
  ConversationSummary,
} from '@smartdoc-analyst/api-interfaces';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConversationsService],
    });
    service = TestBed.inject(ConversationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should fetch and update conversations list', (done) => {
      const mockResponse: ConversationSummary[] = [
        {
          id: 'conv-1',
          title: 'Test Conversation',
          updatedAt: new Date(),
        },
      ];

      service.list().subscribe((response) => {
        expect(response).toEqual(mockResponse);
        service.list$.subscribe((list) => {
          expect(list).toEqual(mockResponse);
          done();
        });
      });

      const req = httpMock.expectOne(`${service['apiUrl']}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('get', () => {
    it('should fetch a conversation by id', (done) => {
      const mockConversation: Conversation = {
        id: 'conv-1',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.get('conv-1').subscribe((response) => {
        expect(response).toEqual(mockConversation);
        done();
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/conv-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockConversation);
    });
  });

  describe('delete', () => {
    it('should delete conversation and update list', (done) => {
      // Set up initial list
      const initialList: ConversationSummary[] = [
        {
          id: 'conv-1',
          title: 'Test 1',
          updatedAt: new Date(),
        },
        {
          id: 'conv-2',
          title: 'Test 2',
          updatedAt: new Date(),
        },
      ];
      (service as unknown as { listSubject: { next: (l: unknown[]) => void } }).listSubject.next(initialList);

      service.delete('conv-1').subscribe((response) => {
        expect(response.deleted).toBe(true);
        service.list$.subscribe((list) => {
          expect(list.length).toBe(1);
          expect(list[0].id).toBe('conv-2');
          done();
        });
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/conv-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ deleted: true });
    });
  });

  describe('refreshList', () => {
    it('should fetch and update conversations list', (done) => {
      const mockResponse: ConversationSummary[] = [
        {
          id: 'conv-1',
          title: 'Refreshed',
          updatedAt: new Date(),
        },
      ];

      service.refreshList();

      service.list$.subscribe((list) => {
        if (list.length > 0) {
          expect(list).toEqual(mockResponse);
          done();
        }
      });

      const req = httpMock.expectOne(`${service['apiUrl']}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
