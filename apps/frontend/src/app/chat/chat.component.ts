import {
  Component,
  inject,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';
import { DocumentsService, type UploadProgress } from '../services/documents.service';
import { MarkdownPipe } from '../pipes/markdown.pipe';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  template: `
    <div class="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto px-4 py-6">
      <!-- Upload area -->
      <div class="mb-4">
        <label
          class="flex flex-col items-center justify-center w-full h-24 rounded-lg border-2 border-dashed border-slate-600 hover:border-emerald-500/50 hover:bg-slate-800/50 cursor-pointer transition-colors"
        >
          <input
            type="file"
            class="hidden"
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
            (change)="onFileSelected($event)"
            [disabled]="uploading"
          />
          @if (uploading) {
            <span class="text-sm text-slate-400">{{ uploadProgress }}</span>
          } @else {
            <span class="text-sm text-slate-400">Drop PDF, TXT or MD here, or click to upload</span>
            <span class="text-xs text-slate-500 mt-1">Max 10MB</span>
          }
        </label>
        @if (uploadError) {
          <p class="mt-2 text-sm text-red-400">{{ uploadError }}</p>
        }
        @if (uploadSuccess) {
          <p class="mt-2 text-sm text-emerald-400">{{ uploadSuccess }}</p>
        }
        <!-- Indexed documents -->
        <details class="mt-3" [open]="documentsExpanded">
          <summary class="text-sm text-slate-400 cursor-pointer hover:text-slate-300">
            @if (documentsService.documents$ | async; as documents) {
              Indexed documents ({{ documents.length }})
            } @else {
              Indexed documents (0)
            }
          </summary>
          <div class="mt-2 space-y-1 max-h-32 overflow-y-auto">
            @if (documentsService.documents$ | async; as documents) {
              @if (documents.length === 0) {
                <p class="text-xs text-slate-500">No documents indexed yet</p>
              } @else {
                @for (doc of documents; track doc.id) {
                  <div class="flex items-center justify-between gap-2 py-1 px-2 rounded bg-slate-800/50 text-sm">
                    <span class="truncate text-slate-300">{{ doc.filename }}</span>
                    <span class="text-xs text-slate-500 shrink-0">{{ doc.chunks }} chunks</span>
                    <button
                      (click)="deleteDocument(doc.id)"
                      class="shrink-0 p-1 text-slate-500 hover:text-red-400 transition-colors"
                      title="Remove from index"
                    >
                      ×
                    </button>
                  </div>
                }
              }
            }
          </div>
        </details>
      </div>

      <!-- Messages area -->
      <div
        #messagesContainer
        class="flex-1 overflow-y-auto space-y-4 mb-4 rounded-lg bg-slate-900/50 p-4 border border-slate-800 scroll-smooth"
      >
        @if (chatService.getMessages().length === 0) {
          <div class="flex flex-col items-center justify-center h-full text-slate-500">
            <p class="text-lg">Ask anything about your documents</p>
            <p class="text-sm mt-2">SmartDoc Analyst uses RAG to find relevant context</p>
          </div>
        } @else {
          @for (msg of chatService.getMessages(); track msg.id) {
            <div
              [class]="
                msg.role === 'user'
                  ? 'ml-auto max-w-[80%] bg-emerald-600/30 rounded-lg px-4 py-2 border border-emerald-500/30'
                  : 'mr-auto max-w-[80%] bg-slate-800 rounded-lg px-4 py-2 border border-slate-700'
              "
            >
              <p class="text-sm text-slate-300 mb-1">
                {{ msg.role === 'user' ? 'You' : 'Assistant' }}
              </p>
              @if (msg.role === 'user') {
                <p class="whitespace-pre-wrap">{{ msg.content }}</p>
              } @else {
                <div class="markdown-content text-slate-200 text-sm [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_code]:bg-slate-700 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-slate-800 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_a]:text-emerald-400 [&_a]:underline">
                  @if (msg.content) {
                    <div [innerHTML]="msg.content | markdown"></div>
                  }
                  @if ((chatService.loading$ | async) && !msg.content) {
                    <span class="inline-flex items-center gap-1 text-slate-400">
                      <span class="animate-pulse">Thinking</span>
                      <span class="inline-block w-2 h-4 bg-emerald-400 animate-pulse"></span>
                    </span>
                  }
                </div>
              }
              @if (msg.role === 'assistant' && msg.sources && msg.sources.length > 0) {
                <div class="mt-3 pt-3 border-t border-slate-600">
                  <p class="text-xs text-slate-500 mb-2">Sources ({{ msg.sources.length }})</p>
                  <div class="space-y-2 max-h-32 overflow-y-auto">
                    @for (src of msg.sources; track src.id) {
                      <details class="group">
                        <summary class="text-xs text-emerald-400/80 cursor-pointer hover:text-emerald-400">
                          {{ src.metadata?.['source'] ?? src.metadata?.['filename'] ?? 'Document' }}
                          @if (src.score !== undefined) {
                            <span class="text-slate-500 ml-1">({{ (src.score * 100).toFixed(0) }}% match)</span>
                          }
                        </summary>
                        <p class="mt-1 text-xs text-slate-400 line-clamp-3">{{ src.content }}</p>
                      </details>
                    }
                  </div>
                </div>
              }
            </div>
          }
          @if ((chatService.loading$ | async) && (chatService.getMessages().length === 0 || chatService.getMessages()[chatService.getMessages().length - 1]?.role !== 'assistant')) {
            <div class="mr-auto max-w-[80%] bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
              <p class="text-sm text-slate-400">Thinking...</p>
            </div>
          }
        }
        <div #scrollAnchor></div>
      </div>

      <!-- Error display -->
      @if (chatService.error$ | async; as error) {
        <div class="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm flex items-center justify-between gap-3">
          <span>{{ error }}</span>
          <div class="flex gap-2 shrink-0">
            <button
              (click)="retryLastMessage()"
              class="px-2 py-1 rounded bg-red-800/50 hover:bg-red-800 text-sm"
            >
              Retry
            </button>
            <button
              (click)="chatService.clearError()"
              class="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      }

      <!-- Input form -->
      <form
        (ngSubmit)="onSubmit()"
        class="flex gap-2"
      >
        <input
          type="text"
          [(ngModel)]="prompt"
          name="prompt"
          placeholder="Type your question..."
          class="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          [disabled]="(chatService.loading$ | async) ?? false"
        />
        <button
          type="submit"
          [disabled]="!prompt.trim() || (chatService.loading$ | async)"
          class="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          Send
        </button>
      </form>

      <button
        (click)="chatService.clearMessages()"
        class="mt-2 text-sm text-slate-500 hover:text-slate-400 self-end"
      >
        Clear chat
      </button>
    </div>
  `,
})
export class ChatComponent implements AfterViewChecked, OnInit {
  @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLDivElement>;

  readonly chatService = inject(ChatService);
  readonly documentsService = inject(DocumentsService);
  private cdr = inject(ChangeDetectorRef);

  prompt = '';
  uploading = false;
  uploadProgress = 'Uploading...';
  uploadError = '';
  uploadSuccess = '';
  documentsExpanded = false;
  private lastMessageCount = 0;

  ngOnInit(): void {
    this.documentsService.list().subscribe();
  }
  private lastContentLength = 0;

  ngAfterViewChecked(): void {
    const messages = this.chatService.getMessages();
    const count = messages.length;
    const lastMsg = messages[count - 1];
    const contentLen = lastMsg?.role === 'assistant' ? lastMsg.content.length : 0;

    if (count > this.lastMessageCount || contentLen > this.lastContentLength) {
      this.lastMessageCount = count;
      this.lastContentLength = contentLen;
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  private scrollToBottom(): void {
    this.scrollAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }

  onSubmit(): void {
    const p = this.prompt.trim();
    if (!p) return;
    this.chatService.clearError();
    this.chatService.sendMessage(p).subscribe();
    this.prompt = '';
  }

  deleteDocument(id: string): void {
    this.documentsService.delete(id).subscribe();
  }

  retryLastMessage(): void {
    const messages = this.chatService.getMessages();
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser?.content) {
      this.chatService.removeLastAssistantMessage();
      this.chatService.clearError();
      this.chatService.sendMessage(lastUser.content).subscribe();
    } else {
      this.chatService.clearError();
    }
  }

  private progressLabel(progress: UploadProgress): string {
    switch (progress.stage) {
      case 'parsing':
        return 'Parsing document...';
      case 'chunking':
        return 'Chunking text...';
      case 'indexing':
        return `Indexing ${progress.total} chunks...`;
      case 'done':
        return 'Done';
      default:
        return 'Processing...';
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadError = '';
    this.uploadSuccess = '';
    this.uploading = true;
    this.uploadProgress = 'Uploading...';

    this.documentsService.uploadWithProgress(file).subscribe({
      next: (event) => {
        if ('progress' in event) {
          this.uploadProgress = this.progressLabel(event.progress);
          this.cdr.detectChanges();
        } else {
          this.uploading = false;
          input.value = '';
          if (event.ok) {
            this.uploadSuccess = `"${event.data.filename}" indexed (${event.data.chunks} chunks)`;
            this.documentsExpanded = true;
            setTimeout(() => (this.uploadSuccess = ''), 4000);
          } else {
            this.uploadError =
              (event as { error?: string; message?: string }).error ??
              (event as { error?: string; message?: string }).message ??
              'Unknown upload error.';
          }
        }
      },
      error: () => {
        this.uploading = false;
        input.value = '';
        this.uploadError = 'Upload failed.';
      },
    });
  }
}
