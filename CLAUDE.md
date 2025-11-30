# CLAUDE.md - gptinvoice

This file provides guidance for Claude Code when working on this project.

## Project Overview

`gptinvoice` is a Node.js CLI application written in TypeScript that downloads monthly invoices from ChatGPT/OpenAI. It automates the process of accessing the billing portal and downloading invoice PDFs.

## Project Structure

```
gptinvoice/
├── src/                        # Source files
│   ├── index.ts               # Main entry point and orchestration
│   ├── cli.ts                 # CLI argument parsing and help text
│   ├── config.ts              # Configuration management (~/.gptinvoice/config)
│   ├── api.ts                 # ChatGPT API client (token verification, portal URL)
│   ├── prompt.ts              # Interactive user prompts
│   ├── download.ts            # Invoice downloading with Puppeteer
│   └── debug.ts               # Debug logging utilities
├── tests/                      # Test files
│   ├── api.test.ts            # API unit tests
│   ├── cli.test.ts            # CLI unit tests
│   ├── config.test.ts         # Config unit tests
│   ├── download.test.ts       # Download unit tests
│   └── integration.test.ts    # Integration tests (require valid token)
├── dist/                       # Compiled JavaScript (generated)
├── doc/                        # Documentation
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Build Commands

```bash
npm install              # Install dependencies
npm run build            # Compile TypeScript to dist/
npm run dev              # Run with ts-node (development)
npm start                # Run compiled version
npm test                 # Run unit tests only
npm run test:integration # Run integration tests (requires valid token)
npm run test:all         # Run all tests
npm run test:watch       # Run unit tests in watch mode
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

### Debug Mode
The `--debug` flag enables extensive logging throughout the application:
- Token length and verification details
- API request URLs and headers
- HTTP response status codes
- Portal navigation steps
- Download progress and file details
- Full stack traces on errors

Debug logging is implemented in `src/debug.ts` with two main functions:
- `debug(message, ...args)` - Log debug messages (only when enabled)
- `debugError(message, error)` - Log errors with stack traces (only when enabled)

## CLI Options

```
-output <dir>     Download to specified directory (default: cwd)
--all             Download all available invoices
-month <YYYY-MM>  Download invoice for specific month
--clear           Clear saved access token from config
--debug           Enable debug logging
-h, -help         Show help message
```

## API Endpoints Used

- `https://chatgpt.com/backend-api/payments/customer_portal` - Get Stripe billing portal URL
- Stripe portal (`pay.openai.com`) - Navigate to find invoice links
- Invoice pages use `button.Button--primary` for download button
- Invoice links have `data-testid="hip-link"` attribute

### Required Headers
The API requires browser-like headers to work correctly:
- `Authorization: Bearer <token>`
- `Accept: application/json`
- `Content-Type: application/json`
- `Referer: https://chatgpt.com/`
- `Origin: https://chatgpt.com`
- `User-Agent: <Chrome user agent string>`

## Testing

### Unit Tests
Tests are located in the `tests/` directory and use Jest with ts-jest. Key testing patterns:
- `tests/config.test.ts` uses dynamic imports with mocked `os.homedir()` for isolation
- `tests/api.test.ts` mocks global `fetch` and the debug module
- `tests/cli.test.ts` mocks `process.exit` for error case testing
- `tests/download.test.ts` tests invoice filtering logic

Run unit tests:
```bash
npm test
```

### Integration Tests
Integration tests in `tests/integration.test.ts` test actual API calls and invoice downloads:
- Automatically skipped if no valid access token is stored
- Test token verification, portal URL fetching, invoice listing, and PDF download
- Long timeouts (up to 120 seconds) for browser operations

Run integration tests:
```bash
npm run test:integration
```

Run all tests:
```bash
npm run test:all
```

## Key Dependencies

- `puppeteer`: Browser automation for navigating Stripe portal and downloading PDFs
- TypeScript dev dependencies for compilation and testing

## Common Development Tasks

### Adding a new CLI option
1. Add to `CliOptions` interface in `src/cli.ts`
2. Handle in `parseArgs()` function
3. Update help text in `HELP_TEXT`
4. Add tests in `tests/cli.test.ts`
5. Use the option in `src/index.ts`

### Modifying API calls
1. Update functions in `src/api.ts`
2. Add debug logging for new functionality
3. Add/update tests in `tests/api.test.ts`
4. Run integration tests with a real token to verify

### Updating download logic
1. Modify `src/download.ts`
2. Add debug logging for troubleshooting
3. Test with real portal (selectors may change)
4. Update unit tests and run integration tests

### Debugging issues
1. Run with `--debug` flag to see detailed logs
2. Check token length and format
3. Verify API responses and HTTP status codes
4. Check browser navigation and selector matching
