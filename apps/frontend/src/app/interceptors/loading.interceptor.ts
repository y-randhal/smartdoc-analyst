import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

/**
 * Global HTTP Loading Interceptor
 * Tracks HTTP request loading states globally
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Skip loading for certain endpoints (e.g., health checks)
  const skipLoading = req.url.includes('/health') || req.url.includes('/api/docs');

  if (!skipLoading) {
    loadingService.setLoading(true, req.url);
  }

  return next(req).pipe(
    finalize(() => {
      if (!skipLoading) {
        loadingService.setLoading(false, req.url);
      }
    })
  );
};
