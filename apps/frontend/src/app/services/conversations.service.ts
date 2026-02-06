import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  Conversation,
  ConversationSummary,
} from '@smartdoc-analyst/api-interfaces';

@Injectable({ providedIn: 'root' })
export class ConversationsService {
  private readonly apiUrl = `${environment.apiUrl}/conversations`;
  private readonly listSubject = new BehaviorSubject<ConversationSummary[]>([]);

  readonly list$ = this.listSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ConversationSummary[]> {
    return this.http.get<ConversationSummary[]>(this.apiUrl).pipe(
      tap((list) => this.listSubject.next(list))
    );
  }

  get(id: string): Observable<Conversation | { error: string }> {
    return this.http.get<Conversation | { error: string }>(`${this.apiUrl}/${id}`);
  }

  delete(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.listSubject.next(this.listSubject.value.filter((c) => c.id !== id));
      })
    );
  }

  refreshList(): void {
    this.http.get<ConversationSummary[]>(this.apiUrl).subscribe((list) => {
      this.listSubject.next(list);
    });
  }
}
