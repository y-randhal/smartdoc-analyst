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
}
