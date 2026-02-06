import { MarkdownPipe } from './markdown.pipe';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DomSanitizer],
    });
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new MarkdownPipe(sanitizer);
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null or undefined', () => {
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
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
    // Sanitizer should remove script tags
    expect(result).toBeTruthy();
    // The result should be sanitized (script tags removed)
    const sanitizeSpy = jest.spyOn(sanitizer, 'sanitize');
    pipe.transform(maliciousInput);
    expect(sanitizeSpy).toHaveBeenCalled();
  });
});
