import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../services/chat.service';
import { ConversationsService } from '../services/conversations.service';
import type { ChatMessage, Conversation } from '@smartdoc-analyst/api-interfaces';

@Component({
  selector: 'app-conversations-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="w-64 shrink-0 h-full min-h-0 border-r border-slate-800 flex flex-col bg-slate-900/30">
      <div class="p-3 border-b border-slate-800">
        <button
          (click)="newChat()"
          class="w-full py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm font-medium transition-colors"
        >
          + New chat
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-2">
        @if (conversationsService.list$ | async; as list) {
          @if (list.length === 0) {
            <p class="text-xs text-slate-500 px-2 py-4">No conversations yet</p>
          } @else {
            <div class="space-y-1">
              @for (conv of list; track conv.id) {
                <div
                  class="group flex items-center gap-1 rounded-lg px-2 py-2 hover:bg-slate-800/50 cursor-pointer"
                  [class.bg-slate-800]="chatService.getConversationId() === conv.id"
                >
                  <button
                    (click)="selectConversation(conv.id)"
                    class="flex-1 text-left text-sm text-slate-300 truncate min-w-0"
                  >
                    {{ conv.title }}
                  </button>
                  <button
                    (click)="deleteConversation(conv.id); $event.stopPropagation()"
                    class="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 text-xs transition-opacity"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              }
            </div>
          }
        }
      </div>
    </aside>
  `,
})
export class ConversationsSidebarComponent implements OnInit {
  readonly chatService = inject(ChatService);
  readonly conversationsService = inject(ConversationsService);

  ngOnInit(): void {
    this.conversationsService.list().subscribe();
  }

  newChat(): void {
    this.chatService.clearMessages();
  }

  selectConversation(id: string): void {
    this.conversationsService.get(id).subscribe({
      next: (conv) => {
        const c = conv as Conversation;
        const messages: ChatMessage[] = c.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
          sources: m.sources,
        }));
        this.chatService.loadConversation(messages, id);
      },
      error: () => {},
    });
  }

  deleteConversation(id: string): void {
    if (this.chatService.getConversationId() === id) {
      this.chatService.clearMessages();
    }
    this.conversationsService.delete(id).subscribe();
  }
}
