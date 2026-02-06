import { Injectable } from '@angular/core';

/**
 * LoggerService - Centralized logging service
 * Can be extended to send logs to external services (e.g., Sentry, LogRocket)
 */
@Injectable({ providedIn: 'root' })
export class Logger {
  log(message: string, context?: Record<string, unknown>): void {
    console.log(`[LOG] ${message}`, context || '');
  }

  error(message: string, error?: Record<string, unknown> | Error): void {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      console.error(`[ERROR] ${message}`, error || '');
    }

    // In production, you could send to error tracking service:
    // if (environment.production) {
    //   Sentry.captureException(error);
    // }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, context || '');
  }

  info(message: string, context?: Record<string, unknown>): void {
    console.info(`[INFO] ${message}`, context || '');
  }
}
