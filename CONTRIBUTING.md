# Contributing to SmartDoc Analyst

First off, thank you for considering contributing to SmartDoc Analyst! It's people like you that make SmartDoc Analyst such a great tool.

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed after following the steps**
- **Explain which behavior you expected to see instead and why**
- **Include screenshots and animated GIFs if applicable**
- **Include environment details** (OS, Node.js version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain which behavior you expected to see instead**
- **Explain why this enhancement would be useful**

### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Include screenshots and animated GIFs in your pull request whenever possible
- Follow the TypeScript and Angular styleguides
- Include thoughtfully-worded, well-structured tests
- Document new code based on the Documentation Styleguide
- End all files with a newline
- Place imports in the following order:
  1. Angular core imports
  2. Third-party imports
  3. Local imports

## Development Process

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- Docker and Docker Compose (optional, for containerized development)

### Getting Started

1. **Fork the repository**

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/smartdoc-analyst.git
   cd smartdoc-analyst
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. **Run the development servers:**
   ```bash
   # Terminal 1: Start the API server
   npm run serve:server

   # Terminal 2: Start the frontend
   npm run serve:frontend
   ```

### Development Workflow

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes:**
   - Write clean, maintainable code
   - Follow TypeScript strict mode guidelines
   - Write tests for new features
   - Update documentation as needed

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Run linter:**
   ```bash
   npm run lint
   ```

5. **Build the project:**
   ```bash
   npm run build
   ```

6. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:
   - `feat:` A new feature
   - `fix:` A bug fix
   - `docs:` Documentation only changes
   - `style:` Changes that do not affect the meaning of the code
   - `refactor:` A code change that neither fixes a bug nor adds a feature
   - `perf:` A code change that improves performance
   - `test:` Adding missing tests or correcting existing tests
   - `chore:` Changes to the build process or auxiliary tools

7. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request:**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template
   - Submit the PR

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Avoid `any` types - use proper types or `unknown`
- Use interfaces for object shapes
- Use type aliases for unions and intersections
- Prefer `const` over `let`, avoid `var`

### Angular

- Use standalone components
- Prefer dependency injection over direct instantiation
- Use OnPush change detection strategy when possible
- Unsubscribe from observables to prevent memory leaks
- Use async pipe in templates when possible

### NestJS

- Follow NestJS module structure
- Use DTOs for data validation
- Implement proper error handling
- Use dependency injection
- Document endpoints with Swagger decorators

### Testing

- Write unit tests for services and utilities
- Write integration tests for API endpoints
- Aim for >80% code coverage
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Git Commit Messages

- Use the present tense ("add feature" not "added feature")
- Use the imperative mood ("move cursor to..." not "moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

## Project Structure

```
smartdoc-analyst/
├── apps/
│   ├── frontend/          # Angular application
│   └── server/             # NestJS API
├── libs/
│   ├── api-interfaces/     # Shared TypeScript interfaces
│   └── ai-engine/          # RAG orchestration logic
├── .github/
│   └── workflows/          # CI/CD workflows
└── scripts/                # Utility scripts
```

## Questions?

Feel free to open an issue for any questions you might have. We're here to help!

Thank you for contributing! 🎉
