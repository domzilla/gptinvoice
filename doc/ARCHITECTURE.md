# Architecture

## Overview

gptinvoice is a TypeScript CLI application that automates downloading invoices from ChatGPT's billing portal.

## Components

### CLI Layer (`src/cli.ts`)
- Parses command-line arguments
- Validates input formats (e.g., month format YYYY-MM)
- Provides help text and usage examples

### Configuration Layer (`src/config.ts`)
- Manages persistent configuration in `~/.gptinvoice/config`
- Securely stores access tokens with proper file permissions (0600)
- Handles loading, saving, and validation of config

### API Layer (`src/api.ts`)
- Communicates with ChatGPT's backend API
- Verifies access tokens
- Retrieves customer portal URLs

### Prompt Layer (`src/prompt.ts`)
- Interactive user prompts using readline
- Displays token retrieval instructions
- Handles yes/no confirmations

### Download Layer (`src/download.ts`)
- Browser automation with Puppeteer
- Navigates Stripe billing portal
- Extracts invoice links
- Downloads PDF files using CDP

### Main Entry (`src/index.ts`)
- Orchestrates all components
- Manages application flow
- Handles errors and cleanup

## Data Flow

```
User Input (CLI args)
       │
       ▼
   parseArgs()
       │
       ▼
 getValidAccessToken()
       │
       ├──► loadConfig() ──► verifyAccessToken()
       │                            │
       │                     ┌──────┴──────┐
       │                     │             │
       │                   valid       invalid
       │                     │             │
       │                     ▼             ▼
       │              use existing   promptForToken()
       │                token              │
       │                     │             │
       └─────────────────────┴─────────────┘
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
                             ▼
                    filterInvoicesByMonth() (if -month)
                             │
                             ▼
                    downloadInvoice() (for each)
                             │
                             ▼
                    browser.close()
```

## Security Considerations

1. **Token Storage**: Access tokens are stored with 0600 permissions (owner read/write only)
2. **Config Directory**: Created with 0700 permissions
3. **No Cookie Support**: Unlike the reference implementation, we don't support cookie-based auth to reduce complexity and security surface
4. **Headless Browser**: Puppeteer runs in headless mode to avoid exposing the browser UI
