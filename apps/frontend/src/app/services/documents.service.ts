import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  IngestionResponse,
  IndexedDocument,
  DocumentListResponse,
} from '@smartdoc-analyst/api-interfaces';

export type UploadResult = { ok: true; data: IngestionResponse } | { ok: false; error: string };

export type UploadProgress =
  | { stage: 'parsing' }
  | { stage: 'chunking' }
  | { stage: 'indexing'; total: number }
  | { stage: 'done'; result: IngestionResponse };

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly apiUrl = `${environment.apiUrl}/documents`;
  private readonly listSubject = new BehaviorSubject<IndexedDocument[]>([]);

  readonly documents$ = this.listSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  list(): Observable<DocumentListResponse> {
    return this.http.get<DocumentListResponse>(this.apiUrl).pipe(
      tap((res) => this.listSubject.next(res.documents))
    );
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.deleted),
      tap((deleted) => {
        if (deleted) {
          this.listSubject.next(this.listSubject.value.filter((d) => d.id !== id));
        }
      })
    );
  }

  upload(file: File): Observable<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<IngestionResponse>(`${this.apiUrl}/upload`, formData).pipe(
      map((data) => ({ ok: true as const, data })),
      tap((result) => {
        if (result.ok) this.list().subscribe();
      }),
      catchError((err) => {
        const msg = err?.error?.message ?? err?.message ?? 'Upload failed';
        return of({ ok: false as const, error: Array.isArray(msg) ? msg.join(', ') : msg });
      })
    );
  }

  /**
   * Upload with progress events (parsing, chunking, indexing)
   */
  uploadWithProgress(
    file: File
  ): Observable<UploadResult | { progress: UploadProgress }> {
    const formData = new FormData();
    formData.append('file', file);

    return new Observable((subscriber) => {
      fetch(`${environment.apiUrl}/documents/upload-stream`, {
        method: 'POST',
        body: formData,
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            subscriber.next({
              ok: false as const,
              error: err?.error ?? res.statusText ?? 'Upload failed',
            });
            subscriber.complete();
            return;
          }
          const reader = res.body?.getReader();
          if (!reader) {
            subscriber.next({ ok: false as const, error: 'No response body' });
            subscriber.complete();
            return;
          }
          const decoder = new TextDecoder();
          let buffer = '';
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() ?? '';
              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const event = JSON.parse(line) as UploadProgress | { error?: string };
                  if ('error' in event) {
                    subscriber.next({ ok: false as const, error: event.error ?? 'Unknown error' });
                    break;
                  }
                  if ('stage' in event) {
                    const progress = event as UploadProgress;
                    if (progress.stage === 'done') {
                      subscriber.next({ ok: true as const, data: progress.result });
                      this.list().subscribe();
                    } else {
                      subscriber.next({ progress });
                    }
                  }
                } catch {
                  // skip invalid JSON
                }
              }
            }
          } catch (e) {
            subscriber.next({
              ok: false as const,
              error: e instanceof Error ? e.message : 'Upload failed',
            });
          }
          subscriber.complete();
        })
        .catch((e) => {
          subscriber.next({
            ok: false as const,
            error: e?.message ?? 'Upload failed',
          });
          subscriber.complete();
        });
    });
  }
}
