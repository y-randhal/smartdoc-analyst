import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with loading false', (done) => {
    service.loading$.subscribe((loading) => {
      expect(loading).toBe(false);
      done();
    });
  });

  it('should set loading to true when request starts', () => {
    service.setLoading(true, '/api/test');
    expect(service.isLoading()).toBe(true);
  });

  it('should set loading to false when request completes', () => {
    service.setLoading(true, '/api/test');
    service.setLoading(false, '/api/test');
    expect(service.isLoading()).toBe(false);
  });

  it('should track multiple requests', () => {
    service.setLoading(true, '/api/test1');
    service.setLoading(true, '/api/test2');
    expect(service.isLoading()).toBe(true);

    service.setLoading(false, '/api/test1');
    expect(service.isLoading()).toBe(true); // Still loading test2

    service.setLoading(false, '/api/test2');
    expect(service.isLoading()).toBe(false);
  });

  it('should clear all loading states', () => {
    service.setLoading(true, '/api/test1');
    service.setLoading(true, '/api/test2');
    service.clear();
    expect(service.isLoading()).toBe(false);
  });
});
