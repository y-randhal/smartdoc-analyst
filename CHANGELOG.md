# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- TypeScript strict mode enabled for better type safety
- Code coverage reporting with Codecov integration
- CONTRIBUTING.md guide for contributors
- CHANGELOG.md for tracking project changes
- SECURITY.md security policy document
- Dependabot configuration for automated dependency updates
- Enhanced CI/CD pipeline with separate jobs for lint, test, build, and security scanning
- Snyk security scanning integration
- Codecov configuration file

### Changed
- Enhanced CI/CD pipeline with coverage reporting and security scanning
- Improved TypeScript configuration with strict type checking
- CI workflow now includes separate jobs for better parallelization and clarity
- Added badges for code coverage and TypeScript strict mode to README

## [0.1.0] - 2025-02-06

### Added
- Initial release of SmartDoc Analyst
- RAG (Retrieval Augmented Generation) application for document analysis
- PDF, TXT, and MD document upload and indexing
- AI-powered Q&A with source citations
- Real-time streaming responses
- Conversation history persistence
- Document management (upload, list, delete)
- Health check endpoints
- Swagger/OpenAPI documentation
- Docker support with multi-stage builds
- CI/CD pipeline with GitHub Actions
- Rate limiting (60 requests/minute per IP)
- Structured logging with Pino
- Error handling and retry logic
- Markdown sanitization for XSS prevention
- Frontend built with Angular 20+ and Tailwind CSS
- Backend built with NestJS and LangChain.js
- Integration with Groq (Llama 3.3 70B), Pinecone, and Hugging Face

### Features
- **Document Ingestion**: Upload PDFs, TXT, or MD files. Documents are parsed, chunked, embedded, and indexed in Pinecone vector database.
- **RAG Pipeline**: Query documents using natural language. The system retrieves relevant context and generates answers using Groq LLM.
- **Streaming Responses**: Real-time streaming of AI responses for better UX.
- **Source Citations**: Each answer includes citations to source documents with similarity scores.
- **Conversation Management**: Persistent conversation history across server restarts.
- **Health Monitoring**: Health check endpoints for monitoring service status and external API connectivity.

---

## Types of Changes

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes
