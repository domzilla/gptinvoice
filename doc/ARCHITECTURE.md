# Architecture

## Overview

gptinvoice is a TypeScript CLI application that automates downloading invoices from ChatGPT's billing portal. It authenticates using a ChatGPT access token, retrieves the Stripe billing portal URL via the ChatGPT API, and uses Puppeteer to navigate the portal and download invoice PDFs.

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

## Components

### CLI Layer (`src/cli.ts`)

Handles command-line argument parsing and help text generation.

**Exports:**
- `CliOptions` - Interface defining all CLI options
- `parseArgs(args: string[])` - Parses CLI arguments into options object
- `isValidMonthFormat(month: string)` - Validates YYYY-MM format
- `printHelp()` / `getHelpText()` - Help text display

**Supported Options:**
| Option | Description |
|--------|-------------|
| `-output <dir>` | Download directory (default: cwd) |
| `--all` | Download all invoices |
| `-month <YYYY-MM>` | Filter by specific month |
| `--clear` | Clear saved access token |
| `--debug` | Enable verbose logging |
| `-h`, `-help`, `--help` | Show help text |

### Configuration Layer (`src/config.ts`)

Manages persistent configuration stored at `~/.gptinvoice/config`.

**Exports:**
- `Config` - Interface with `accessToken` field
- `getConfigDir()` - Returns `~/.gptinvoice` path
- `getConfigPath()` - Returns `~/.gptinvoice/config` path
- `configExists()` - Checks if config file exists
- `loadConfig()` - Loads and validates config, returns null if invalid
- `saveConfig(config)` - Saves config with secure permissions
- `deleteConfig()` - Removes config file

**Security:**
- Directory permissions: `0700` (owner only)
- File permissions: `0600` (owner read/write only)

### API Layer (`src/api.ts`)

Communicates with the ChatGPT backend API at `https://chatgpt.com/backend-api`.

**Exports:**
- `CustomerPortalResponse` - Response type with portal URL
- `TokenVerificationResult` - Validation result with `valid` flag and optional `error`
- `verifyAccessToken(token)` - Validates token against the API
- `getCustomerPortalUrl(token)` - Fetches Stripe billing portal URL

**Required Headers:**
The API requires browser-like headers to avoid being blocked:
```typescript
{
  'Authorization': 'Bearer <token>',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Referer': 'https://chatgpt.com/',
  'Origin': 'https://chatgpt.com',
  'User-Agent': '<Chrome user agent>'
}
```

### Prompt Layer (`src/prompt.ts`)

Interactive user prompts using Node.js readline.

**Exports:**
- `printTokenInstructions()` - Displays how to obtain access token
- `promptForToken()` - Prompts for token input (strips surrounding quotes)
- `promptYesNo(question)` - Yes/no confirmation prompt

### Download Layer (`src/download.ts`)

Browser automation using Puppeteer for navigating Stripe and downloading PDFs.

**Exports:**
- `Invoice` - Interface with `url` and `date` fields
- `DownloadResult` - Result with `success`, `filePath`, and `error` fields
- `getInvoiceUrls(page, portalUrl)` - Extracts invoice links from portal
- `filterInvoicesByMonth(invoices, month)` - Filters by YYYY-MM
- `downloadInvoice(browser, url, outputDir)` - Downloads single PDF

**Key Implementation Details:**
- Uses CSS selector `a[data-testid="hip-link"]` to find invoice links
- Uses CSS selector `button.Button--primary` for download button
- Uses Chrome DevTools Protocol (CDP) for reliable file downloads
- Polls download directory for new PDF files

### Debug Layer (`src/debug.ts`)

Conditional debug logging enabled via `--debug` flag.

**Exports:**
- `setDebugEnabled(enabled)` - Enables/disables debug mode
- `isDebugEnabled()` - Returns current debug state
- `debug(message, ...args)` - Logs with `[DEBUG]` prefix
- `debugError(message, error)` - Logs errors with stack traces

### Main Entry (`src/index.ts`)

Orchestrates all components and manages application flow.

**Functions:**
- `getValidAccessToken()` - Gets valid token (from config or user prompt)
- `main()` - Main entry point

## Data Flow

```
User Input (CLI args)
       │
       ▼
   parseArgs()
       │
       ├──► --help ──► printHelp() ──► exit(0)
       │
       ├──► --clear ──► deleteConfig() ──► exit(0)
       │
       └──► --debug ──► setDebugEnabled(true)
                             │
                             ▼
                   getValidAccessToken()
                             │
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
       ▼                     ▼                     ▼
  loadConfig()         verifyToken()        promptForToken()
       │                     │                     │
       │              ┌──────┴──────┐              │
       │              │             │              │
       │            valid       invalid            │
       │              │             │              │
       │              ▼             └──────────────┘
       │       use existing                │
       │          token                    ▼
       │              │            verifyToken() ──► saveConfig()
       └──────────────┴────────────────────┘
                             │
                             ▼
                   getCustomerPortalUrl()
                             │
                             ▼
                    puppeteer.launch()
                             │
                             ▼
                    getInvoiceUrls()
                             │
                      ┌──────┴──────┐
                      │             │
                 -month set    --all or default
                      │             │
                      ▼             │
             filterInvoicesByMonth()│
                      │             │
                      └──────┬──────┘
                             │
                             ▼
                    downloadInvoice() (loop)
                             │
                             ▼
                    browser.close()
                             │
                             ▼
                       Print summary
```

## Testing

### Unit Tests (`tests/`)

Run with `npm test`. Tests use Jest with ts-jest.

| Test File | Coverage |
|-----------|----------|
| `api.test.ts` | Token verification, API headers, error handling |
| `cli.test.ts` | Argument parsing, validation, help text |
| `config.test.ts` | Config CRUD operations, file permissions |
| `download.test.ts` | Invoice date filtering |

**Testing Patterns:**
- `config.test.ts` uses `jest.doMock()` with dynamic imports to mock `os.homedir()`
- `api.test.ts` mocks `global.fetch` and the debug module
- `cli.test.ts` mocks `process.exit` for error case testing

### Integration Tests (`tests/integration.test.ts`)

Run with `npm run test:integration`. Requires valid access token in config.

Tests real API calls and invoice downloads:
- Token verification against live API
- Portal URL fetching
- Invoice list extraction
- PDF download

## Security Considerations

1. **Token Storage**: Access tokens stored with `0600` permissions (owner read/write only)
2. **Config Directory**: Created with `0700` permissions (owner access only)
3. **No Cookie Support**: Unlike reference implementations, we don't support cookie-based auth to reduce complexity and security surface
4. **Headless Browser**: Puppeteer runs in headless mode to avoid exposing the browser UI
5. **Quote Stripping**: Token input automatically strips surrounding quotes to prevent accidental inclusion

## External Dependencies

| Dependency | Purpose |
|------------|---------|
| `puppeteer` | Browser automation for Stripe portal navigation |
| `typescript` | TypeScript compiler (dev) |
| `ts-jest` | TypeScript support for Jest (dev) |
| `jest` | Testing framework (dev) |
| `@types/*` | TypeScript type definitions (dev) |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `https://chatgpt.com/backend-api/payments/customer_portal` | GET | Get Stripe billing portal URL |

## CSS Selectors

| Selector | Location | Purpose |
|----------|----------|---------|
| `a[data-testid="hip-link"]` | Stripe portal | Invoice links |
| `button.Button--primary` | Invoice page | Download button |
