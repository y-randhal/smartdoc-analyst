import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent } from './chat.component';
import { ChatService } from '../services/chat.service';
import { DocumentsService } from '../services/documents.service';
import { ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import type { ChatMessage, IndexedDocument } from '@smartdoc-analyst/api-interfaces';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let chatService: ChatService;
  let documentsService: DocumentsService;
  let mockMessages$: BehaviorSubject<ChatMessage[]>;
  let mockLoading$: BehaviorSubject<boolean>;
  let mockError$: BehaviorSubject<string | null>;
  let mockDocuments$: BehaviorSubject<IndexedDocument[]>;

  beforeEach(async () => {
    mockMessages$ = new BehaviorSubject<ChatMessage[]>([]);
    mockLoading$ = new BehaviorSubject<boolean>(false);
    mockError$ = new BehaviorSubject<string | null>(null);
    mockDocuments$ = new BehaviorSubject<IndexedDocument[]>([]);

    const mockChatService = {
      getMessages: jest.fn(() => mockMessages$.value),
      messages$: mockMessages$.asObservable(),
      loading$: mockLoading$.asObservable(),
      error$: mockError$.asObservable(),
      sendMessage: jest.fn(() => of({ message: '', sources: [] })),
      clearMessages: jest.fn(),
      clearError: jest.fn(),
      removeLastAssistantMessage: jest.fn(),
      getConversationId: jest.fn(() => null),
    };

    const mockDocumentsService = {
      documents$: mockDocuments$.asObservable(),
      list: jest.fn(() => of({ documents: [] })),
      delete: jest.fn(() => of(true)),
      uploadWithProgress: jest.fn(() => of({ ok: true, data: { documentId: 'doc-1', chunks: 5, filename: 'test.pdf' } })),
    };

    await TestBed.configureTestingModule({
      imports: [ChatComponent, HttpClientTestingModule],
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: DocumentsService, useValue: mockDocumentsService },
        ChangeDetectorRef,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    chatService = TestBed.inject(ChatService);
    documentsService = TestBed.inject(DocumentsService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call documentsService.list', () => {
      component.ngOnInit();
      expect(documentsService.list).toHaveBeenCalled();
    });
  });

  describe('onSubmit', () => {
    it('should send message when prompt is provided', () => {
      component.prompt = 'Test question';
      component.onSubmit();
      expect(chatService.sendMessage).toHaveBeenCalledWith('Test question');
      expect(component.prompt).toBe('');
    });

    it('should not send message when prompt is empty', () => {
      component.prompt = '   ';
      component.onSubmit();
      expect(chatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should clear error before sending', () => {
      component.prompt = 'Test';
      component.onSubmit();
      expect(chatService.clearError).toHaveBeenCalled();
    });
  });

  describe('deleteDocument', () => {
    it('should call documentsService.delete', () => {
      component.deleteDocument('doc-1');
      expect(documentsService.delete).toHaveBeenCalledWith('doc-1');
    });
  });

  describe('retryLastMessage', () => {
    it('should retry last user message', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        },
      ];
      (chatService.getMessages as jest.Mock).mockReturnValue(messages);

      component.retryLastMessage();
      expect(chatService.removeLastAssistantMessage).toHaveBeenCalled();
      expect(chatService.clearError).toHaveBeenCalled();
      expect(chatService.sendMessage).toHaveBeenCalledWith('Hello');
    });

    it('should only clear error if no user message found', () => {
      (chatService.getMessages as jest.Mock).mockReturnValue([]);
      component.retryLastMessage();
      expect(chatService.clearError).toHaveBeenCalled();
      expect(chatService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('onFileSelected', () => {
    it('should handle file upload with progress', (done) => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const event = {
        target: {
          files: [file],
          value: 'test.pdf',
        },
      } as any;

      (documentsService.uploadWithProgress as jest.Mock).mockReturnValue(
        of({ ok: true, data: { documentId: 'doc-1', chunks: 5, filename: 'test.pdf' } })
      );

      component.onFileSelected(event);

      setTimeout(() => {
        expect(component.uploading).toBe(false);
        expect(component.uploadSuccess).toContain('test.pdf');
        done();
      }, 100);
    });

    it('should handle upload error', (done) => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const event = {
        target: {
          files: [file],
          value: 'test.pdf',
        },
      } as any;

      (documentsService.uploadWithProgress as jest.Mock).mockReturnValue(
        of({ ok: false, error: 'Upload failed' })
      );

      component.onFileSelected(event);

      setTimeout(() => {
        expect(component.uploading).toBe(false);
        expect(component.uploadError).toBe('Upload failed');
        done();
      }, 100);
    });

    it('should not process if no file selected', () => {
      const event = {
        target: {
          files: null,
        },
      } as any;

      component.onFileSelected(event);
      expect(documentsService.uploadWithProgress).not.toHaveBeenCalled();
    });
  });

  describe('progressLabel', () => {
    it('should return correct label for parsing stage', () => {
      const label = component['progressLabel']({ stage: 'parsing' });
      expect(label).toBe('Parsing document...');
    });

    it('should return correct label for chunking stage', () => {
      const label = component['progressLabel']({ stage: 'chunking' });
      expect(label).toBe('Chunking text...');
    });

    it('should return correct label for indexing stage', () => {
      const label = component['progressLabel']({ stage: 'indexing', total: 10 });
      expect(label).toBe('Indexing 10 chunks...');
    });

    it('should return correct label for done stage', () => {
      const label = component['progressLabel']({
        stage: 'done',
        result: { documentId: 'doc-1', chunks: 5, filename: 'test.pdf' },
      });
      expect(label).toBe('Done');
    });
  });
});
