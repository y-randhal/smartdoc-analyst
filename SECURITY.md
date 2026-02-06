# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

Please report (suspected) security vulnerabilities to **[yuu.rodrigues@gmail.com](yuu.rodrigues@gmail.com)**. You will receive a response within 48 hours. If the issue is confirmed, we will release a patch as soon as possible depending on complexity but historically within a few days.

### What to Include

When reporting a security vulnerability, please include:

- **Type of issue** (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- **Full paths of source file(s) related to the manifestation of the issue**
- **The location of the affected source code** (tag/branch/commit or direct URL)
- **Step-by-step instructions to reproduce the issue**
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue**, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

## Security Best Practices

### For Users

- **Keep dependencies up to date**: Regularly update npm packages to receive security patches
- **Use environment variables**: Never commit API keys or secrets to version control
- **Review dependencies**: Audit your dependencies regularly using `npm audit`
- **Use HTTPS**: Always use HTTPS in production environments
- **Rate limiting**: The application includes rate limiting (60 requests/minute per IP) to prevent abuse

### For Developers

- **Follow secure coding practices**: Use TypeScript strict mode, validate all inputs, sanitize outputs
- **Dependency management**: Review and update dependencies regularly
- **Security headers**: The application uses security headers via NestJS (consider adding Helmet.js)
- **Input validation**: All API endpoints use class-validator for input validation
- **XSS prevention**: Markdown content is sanitized before rendering
- **Error handling**: Avoid exposing sensitive information in error messages

## Security Features

- ✅ **Input Validation**: All API inputs are validated using class-validator
- ✅ **Rate Limiting**: 60 requests/minute per IP to prevent abuse
- ✅ **XSS Protection**: Markdown sanitization prevents cross-site scripting
- ✅ **CORS Configuration**: Configurable CORS settings
- ✅ **Environment Variables**: Sensitive data stored in environment variables
- ✅ **Docker Security**: Non-root user in production containers
- ✅ **Dependency Scanning**: Regular security audits via npm audit and Snyk

## Known Security Considerations

- **API Keys**: Ensure API keys are stored securely and never committed to version control
- **File Uploads**: File size limits (10MB) and type validation are enforced
- **Vector Database**: Ensure Pinecone index has proper access controls
- **LLM Responses**: AI-generated content should be reviewed for accuracy and appropriateness

## Disclosure Policy

When we receive a security bug report, we will assign it to a primary handler. This person will coordinate the fix and release process, involving the following steps:

1. Confirm the problem and determine the affected versions
2. Audit code to find any potential similar problems
3. Prepare fixes for all releases still under maintenance
4. Release a security update as soon as possible

We credit researchers for responsible disclosure, although we keep your name confidential if you request it.

## Security Updates

Security updates will be released as patch versions (e.g., 0.1.1, 0.1.2) and will be documented in the CHANGELOG.md file.

## Contact

For security-related questions or concerns, please contact: **[yuu.rodrigues@gmail.com](yuu.rodrigues@gmail.com)**
