import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * LoadingService - Global loading state management
 * Tracks active HTTP requests for UI loading indicators
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly activeRequests = new Set<string>();

  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  /**
   * Set loading state for a specific request
   */
  setLoading(loading: boolean, requestUrl: string): void {
    if (loading) {
      this.activeRequests.add(requestUrl);
    } else {
      this.activeRequests.delete(requestUrl);
    }

    this.loadingSubject.next(this.activeRequests.size > 0);
  }

  /**
   * Get current loading state
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Clear all loading states (useful for error recovery)
   */
  clear(): void {
    this.activeRequests.clear();
    this.loadingSubject.next(false);
  }
}
