import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { errorInterceptor } from './error.interceptor';
import { Logger } from '../services/logger.service';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

describe('ErrorInterceptor', () => {
  let nextFn: jest.Mock;

  beforeEach(() => {
    nextFn = jest.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: Logger, useValue: mockLogger }],
    });
  });

  it('should pass through successful requests', (done) => {
    const request = new HttpRequest('GET', '/api/test');
    const response = { status: 200 } as HttpEvent<unknown>;

    nextFn.mockReturnValue(of(response));

    TestBed.runInInjectionContext(() => {
      errorInterceptor(request, nextFn).subscribe({
        next: (event) => {
          expect(event).toBe(response);
          done();
        },
      });
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

    TestBed.runInInjectionContext(() => {
      errorInterceptor(request, nextFn).subscribe({
        error: (err: { message: string }) => {
          expect(err.message).toContain('Invalid input');
          done();
        },
      });
    });
  });

  it('should handle 500 Server Error', (done) => {
    const request = new HttpRequest('GET', '/api/test');
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
    });

    nextFn.mockReturnValue(throwError(() => error));

    TestBed.runInInjectionContext(() => {
      errorInterceptor(request, nextFn).subscribe({
        error: (err: { message: string }) => {
          expect(err.message).toContain('Server error');
          done();
        },
      });
    });
  });

  it('should handle network errors (status 0)', (done) => {
    const request = new HttpRequest('GET', '/api/test');
    const error = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
    });

    nextFn.mockReturnValue(throwError(() => error));

    TestBed.runInInjectionContext(() => {
      errorInterceptor(request, nextFn).subscribe({
        error: (err: { message: string }) => {
          expect(err.message).toContain('Unable to connect');
          done();
        },
      });
    });
  });
});
