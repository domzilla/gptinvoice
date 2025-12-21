# gptinvoice

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)

A CLI tool to download ChatGPT invoices automatically.

## Overview

Since OpenAI doesn't send invoices via email, this tool automates the process of logging into your ChatGPT account and downloading invoice PDFs from the billing portal.

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
# Download the latest invoice to the current directory
gptinvoice

# Download the latest invoice to a specific directory
gptinvoice -output ./invoices

# Download all available invoices
gptinvoice --all

# Download invoice for a specific month
gptinvoice -month 2024-01

# Show help
gptinvoice -h
```

## First-Time Setup

On first run, the tool will prompt you for your ChatGPT access token. To get your token:

1. Log into [ChatGPT](https://chatgpt.com) in your browser
2. Open this URL in the same browser: https://chatgpt.com/api/auth/session
3. Copy the `accessToken` value from the JSON response
4. Paste it when prompted (you can paste the entire JSON or just the token value)

The token is stored securely in `~/.gptinvoice/config`.

## Options

| Option | Description |
|--------|-------------|
| `-output <dir>` | Download invoices to specified directory (default: current directory) |
| `--all` | Download all available invoices |
| `-month <YYYY-MM>` | Download invoice for a specific month (e.g., 2024-01) |
| `--clear` | Clear saved access token from config |
| `--debug` | Enable verbose debug logging |
| `-h`, `-help`, `--help` | Show help message |

## Examples

```bash
# Download latest invoice
gptinvoice

# Download all invoices to ~/Documents/invoices
gptinvoice --all -output ~/Documents/invoices

# Download January 2024 invoice
gptinvoice -month 2024-01

# Download March 2024 invoice to a specific folder
gptinvoice -month 2024-03 -output ./billing
```

## How It Works

1. Validates your saved access token (or prompts for a new one)
2. Fetches the customer portal URL from ChatGPT's API
3. Uses Puppeteer to navigate the Stripe billing portal
4. Extracts invoice links and downloads the PDFs

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## Requirements

- Node.js >= 18.0.0
- Active ChatGPT subscription with billing history

## License

MIT License - see [LICENSE](LICENSE) for details.
