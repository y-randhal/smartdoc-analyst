import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import type { IngestionResponse } from '@smartdoc-analyst/api-interfaces';

export type UploadResult = { ok: true; data: IngestionResponse } | { ok: false; error: string };

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly apiUrl = `${environment.apiUrl}/documents`;

  constructor(private readonly http: HttpClient) {}

  upload(file: File): Observable<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<IngestionResponse>(`${this.apiUrl}/upload`, formData).pipe(
      map((data) => ({ ok: true as const, data })),
      catchError((err) => {
        const msg = err?.error?.message ?? err?.message ?? 'Upload failed';
        return of({ ok: false as const, error: Array.isArray(msg) ? msg.join(', ') : msg });
      })
    );
  }
}
