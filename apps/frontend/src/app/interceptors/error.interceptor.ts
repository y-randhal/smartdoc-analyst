import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Logger } from '../services/logger.service';

/**
 * Global HTTP Error Interceptor
 * Handles HTTP errors consistently across the application
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(Logger);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message || 'A client-side error occurred';
        logger.error('Client error', { error: errorMessage, url: req.url });
      } else {
        // Server-side error
        const status = error.status;
        const statusText = error.statusText;

        switch (status) {
          case 0:
            errorMessage = 'Unable to connect to the server. Please check your connection.';
            break;
          case 400:
            errorMessage = error.error?.message || 'Invalid request. Please check your input.';
            break;
          case 401:
            errorMessage = 'Unauthorized. Please check your credentials.';
            break;
          case 403:
            errorMessage = 'Access forbidden. You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = error.error?.message || 'The requested resource was not found.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = error.error?.message || statusText || `Error ${status}: ${statusText}`;
        }

        logger.error('HTTP error', {
          status,
          statusText,
          url: req.url,
          message: errorMessage,
          error: error.error,
        });
      }

      // Return a user-friendly error
      return throwError(() => ({
        message: errorMessage,
        status: error.status,
        originalError: error,
      }));
    })
  );
};
