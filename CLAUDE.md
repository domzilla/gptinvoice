# CLAUDE.md - gptinvoice

This file provides guidance for Claude Code when working on this project.

## Project Overview

`gptinvoice` is a Node.js CLI application written in TypeScript that downloads monthly invoices from ChatGPT/OpenAI. It automates the process of accessing the billing portal and downloading invoice PDFs.

## Project Structure

```
gptinvoice/
├── src/                    # Source files
│   ├── index.ts           # Main entry point and orchestration
│   ├── cli.ts             # CLI argument parsing and help text
│   ├── config.ts          # Configuration management (~/.gptinvoice/config)
│   ├── api.ts             # ChatGPT API client (token verification, portal URL)
│   ├── prompt.ts          # Interactive user prompts
│   ├── download.ts        # Invoice downloading with Puppeteer
│   └── *.test.ts          # Test files
├── dist/                   # Compiled JavaScript (generated)
├── doc/                    # Documentation
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Build Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm run dev          # Run with ts-node (development)
npm start            # Run compiled version
npm test             # Run tests
npm test -- --watch  # Run tests in watch mode
```

## Architecture

### Configuration
- Config file: `~/.gptinvoice/config`
- Stores the ChatGPT access token as JSON
- File permissions: 0600 (read/write for owner only)
- Directory permissions: 0700

### Authentication Flow
1. Check for existing config with saved access token
2. Verify token against ChatGPT API (`/backend-api/payments/customer_portal`)
3. If invalid or missing, prompt user for new token with instructions
4. Save valid token to config file

### Invoice Download Flow
1. Get customer portal URL from ChatGPT API
2. Launch headless Puppeteer browser
3. Navigate to portal and extract invoice links
4. Filter invoices by month if `-month` specified
5. Download PDFs using CDP (Chrome DevTools Protocol)
6. Wait for downloads to complete

## CLI Options

```
-output <dir>     Download to specified directory (default: cwd)
--all             Download all available invoices
-month <YYYY-MM>  Download invoice for specific month
-h, -help         Show help message
```

## API Endpoints Used

- `https://chatgpt.com/backend-api/payments/customer_portal` - Get Stripe billing portal URL
- Stripe portal (`pay.openai.com`) - Navigate to find invoice links
- Invoice pages use `button.Button--primary` for download button
- Invoice links have `data-testid="hip-link"` attribute

## Testing

Tests use Jest with ts-jest. Key testing patterns:
- `config.test.ts` uses dynamic imports with mocked `os.homedir()` for isolation
- `api.test.ts` mocks global `fetch`
- `cli.test.ts` mocks `process.exit` for error case testing

Run tests after any changes to ensure functionality:
```bash
npm test
```

## Key Dependencies

- `puppeteer`: Browser automation for navigating Stripe portal and downloading PDFs
- TypeScript dev dependencies for compilation and testing

## Common Development Tasks

### Adding a new CLI option
1. Add to `CliOptions` interface in `src/cli.ts`
2. Handle in `parseArgs()` function
3. Update help text in `HELP_TEXT`
4. Add tests in `src/cli.test.ts`
5. Use the option in `src/index.ts`

### Modifying API calls
1. Update functions in `src/api.ts`
2. Add/update tests in `src/api.test.ts`
3. Test with a real token to verify

### Updating download logic
1. Modify `src/download.ts`
2. Test with real portal (selectors may change)
3. Update tests as needed
