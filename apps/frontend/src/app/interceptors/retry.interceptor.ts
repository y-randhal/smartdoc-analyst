import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { retry } from 'rxjs/operators';
import { throwError, timer } from 'rxjs';

/**
 * Global HTTP Retry Interceptor
 * Automatically retries failed requests for transient errors
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  const maxRetries = 2;
  const retryDelay = 1000; // 1 second

  return next(req).pipe(
    retry({
      count: maxRetries,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        // Only retry on network errors or 5xx server errors
        const shouldRetry =
          error.status === 0 || // Network error
          error.status === 500 || // Internal server error
          error.status === 502 || // Bad gateway
          error.status === 503 || // Service unavailable
          error.status === 504; // Gateway timeout

        if (!shouldRetry || retryCount > maxRetries) {
          return throwError(() => error);
        }

        // Exponential backoff: 1s, 2s
        const delayMs = retryDelay * retryCount;
        return timer(delayMs);
      },
    })
  );
};
