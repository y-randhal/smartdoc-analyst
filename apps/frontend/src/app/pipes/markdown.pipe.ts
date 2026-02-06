import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { parse } from 'marked';

/**
 * MarkdownPipe - Safely transforms markdown to HTML
 * Uses Angular's DomSanitizer to sanitize HTML output, preventing XSS attacks
 */
@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value?.trim()) return '';

    // Parse markdown to HTML
    const html = parse(value, {
      async: false,
      breaks: true,
      gfm: true,
      // Security: marked doesn't sanitize by default, so we sanitize after parsing
    }) as string;

    // Sanitize HTML to prevent XSS attacks
    // DomSanitizer.sanitize() removes dangerous HTML while preserving safe markdown-generated content
    const sanitized = this.sanitizer.sanitize(1, html); // SecurityContext.HTML = 1

    // Return as SafeHtml - Angular trusts this content because it was sanitized
    // Fixed: sanitize() can return null, so fallback to empty string if so
    return this.sanitizer.bypassSecurityTrustHtml(sanitized ?? '');

  }
}
