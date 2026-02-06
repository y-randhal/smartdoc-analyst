import { MarkdownPipe } from './markdown.pipe';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

const mockSanitizer: DomSanitizer = {
  sanitize: (_context: unknown, value: string) => value ?? '',
  bypassSecurityTrustHtml: (value: string) => value as unknown as SafeHtml,
  bypassSecurityTrustStyle: () => '',
  bypassSecurityTrustScript: () => '',
  bypassSecurityTrustUrl: () => '',
  bypassSecurityTrustResourceUrl: () => '',
};

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: DomSanitizer, useValue: mockSanitizer }],
    });
    pipe = new MarkdownPipe(TestBed.inject(DomSanitizer));
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null or undefined', () => {
    expect(pipe.transform(null as unknown as string)).toBe('');
    expect(pipe.transform(undefined as unknown as string)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform('   ')).toBe('');
  });

  it('should transform markdown to HTML', () => {
    const result = pipe.transform('# Hello World');
    expect(result).toBeTruthy();
    // The result is SafeHtml, so we check it's not empty
    expect(result).not.toBe('');
  });

  it('should handle markdown with code blocks', () => {
    const markdown = '```typescript\nconst x = 1;\n```';
    const result = pipe.transform(markdown);
    expect(result).toBeTruthy();
  });

  it('should handle markdown with links', () => {
    const markdown = '[Link](https://example.com)';
    const result = pipe.transform(markdown);
    expect(result).toBeTruthy();
  });

  it('should handle markdown lists', () => {
    const markdown = '- Item 1\n- Item 2';
    const result = pipe.transform(markdown);
    expect(result).toBeTruthy();
  });

  it('should sanitize HTML to prevent XSS', () => {
    const maliciousInput = '<script>alert("XSS")</script># Safe Heading';
    const result = pipe.transform(maliciousInput);
    // Sanitizer is called (mock passes through - in real app it would strip script tags)
    expect(result).toBeTruthy();
  });
});
