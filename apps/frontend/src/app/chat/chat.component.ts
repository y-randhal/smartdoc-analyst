import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';
import { DocumentsService, type UploadResult } from '../services/documents.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
            <span class="text-sm text-slate-400">Uploading...</span>
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
      </div>

      <!-- Messages area -->
      <div
        class="flex-1 overflow-y-auto space-y-4 mb-4 rounded-lg bg-slate-900/50 p-4 border border-slate-800"
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
              <p class="whitespace-pre-wrap">{{ msg.content }}</p>
            </div>
          }
          @if (chatService.loading$ | async) {
            <div class="mr-auto max-w-[80%] bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
              <p class="text-sm text-slate-400">Thinking...</p>
            </div>
          }
        }
      </div>

      <!-- Error display -->
      @if (chatService.error$ | async; as error) {
        <div class="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm">
          {{ error }}
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
export class ChatComponent {
  readonly chatService = inject(ChatService);
  readonly documentsService = inject(DocumentsService);
  prompt = '';
  uploading = false;
  uploadError = '';
  uploadSuccess = '';

  onSubmit(): void {
    const p = this.prompt.trim();
    if (!p) return;
    this.chatService.sendMessage(p).subscribe();
    this.prompt = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadError = '';
    this.uploadSuccess = '';
    this.uploading = true;

    this.documentsService.upload(file).subscribe({
      next: (result: UploadResult) => {
        this.uploading = false;
        input.value = '';
        if (result.ok) {
          this.uploadSuccess = `"${result.data.filename}" indexed (${result.data.chunks} chunks)`;
          setTimeout(() => (this.uploadSuccess = ''), 4000);
        } else {
          this.uploadError = (result as any).error ?? 'Unknown upload error.';
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
