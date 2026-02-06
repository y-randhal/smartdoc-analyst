import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConversationsSidebarComponent } from './conversations-sidebar/conversations-sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConversationsSidebarComponent],
  template: `
    <div class="h-screen min-h-0 bg-slate-950 text-slate-100 flex">
      <app-conversations-sidebar />
      <div class="flex-1 flex flex-col min-w-0">
        <header class="border-b border-slate-800 px-6 py-4 shrink-0">
          <h1 class="text-xl font-semibold text-emerald-400">SmartDoc Analyst</h1>
          <p class="text-sm text-slate-400 mt-1">RAG-powered document analysis</p>
        </header>
        <main class="flex-1 overflow-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AppComponent {}
