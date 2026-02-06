import { HttpRequest, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { errorInterceptor } from './error.interceptor';
import { Logger } from '../services/logger.service';

// Mock Logger
jest.mock('../services/logger.service', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

describe('ErrorInterceptor', () => {
  let nextFn: jest.Mock;

  beforeEach(() => {
    nextFn = jest.fn();
  });

  it('should pass through successful requests', (done) => {
    const request = new HttpRequest('GET', '/api/test');
    const response = { status: 200 } as HttpEvent<any>;

    nextFn.mockReturnValue(of(response));

    errorInterceptor(request, nextFn).subscribe({
      next: (event) => {
        expect(event).toBe(response);
        done();
      },
    });
  });

  it('should handle 400 Bad Request', (done) => {
    const request = new HttpRequest('GET', '/api/test');
    const error = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      error: { message: 'Invalid input' },
    });

    nextFn.mockReturnValue(throwError(() => error));

    errorInterceptor(request, nextFn).subscribe({
      error: (err) => {
        expect(err.message).toContain('Invalid input');
        done();
      },
    });
  });

  it('should handle 500 Server Error', (done) => {
    const request = new HttpRequest('GET', '/api/test');
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
    });

    nextFn.mockReturnValue(throwError(() => error));

    errorInterceptor(request, nextFn).subscribe({
      error: (err) => {
        expect(err.message).toContain('Server error');
        done();
      },
    });
  });

  it('should handle network errors (status 0)', (done) => {
    const request = new HttpRequest('GET', '/api/test');
    const error = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
    });

    nextFn.mockReturnValue(throwError(() => error));

    errorInterceptor(request, nextFn).subscribe({
      error: (err) => {
        expect(err.message).toContain('Unable to connect');
        done();
      },
    });
  });
});
