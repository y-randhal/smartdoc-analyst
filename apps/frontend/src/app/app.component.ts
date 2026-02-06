import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100">
      <header class="border-b border-slate-800 px-6 py-4">
        <h1 class="text-xl font-semibold text-emerald-400">SmartDoc Analyst</h1>
        <p class="text-sm text-slate-400 mt-1">RAG-powered document analysis</p>
      </header>
      <main>
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {}
