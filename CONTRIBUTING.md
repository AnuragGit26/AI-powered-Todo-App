# Contributing to Todo AI App

Thank you for considering contributing to this project! Here's how you can help.

## Development Environment Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/todo-ai-app.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and fill in your own API keys
5. Start the development server: `npm run dev`

## Pull Request Process

1. Create a new branch for your feature or bugfix: `git checkout -b feature/my-feature`
2. Make your changes and commit them with descriptive commit messages
3. Push your branch to your fork: `git push origin feature/my-feature`
4. Open a pull request against the main repository

## Environment Variables

When working with environment variables:
- Never commit actual API keys or secrets
- Use `.env.example` for documenting required variables
- Add any new environment variables to both `.env.example` and the README.md
- Update deployment documentation if necessary

## Code Style

This project uses ESLint for code style. Run `npm run lint` before submitting your PR.

## Security Considerations

- Do not expose API keys or secrets in your code
- Do not commit `.env` files
- Be careful when adding new dependencies
- Report any security concerns via GitHub issues 