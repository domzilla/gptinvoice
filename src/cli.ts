/**
 * @file cli.ts
 * @module cli
 * @author Dominic Rodemer
 * @created 2025-11-30
 * @license MIT
 *
 * @fileoverview CLI argument parsing and help text for gptinvoice.
 */

/**
 * Parsed command-line options.
 */
export interface CliOptions {
    /** Directory to save downloaded invoices (default: current working directory) */
    outputDir: string;
    /** If true, download all available invoices instead of just the latest */
    downloadAll: boolean;
    /** Target month in YYYY-MM format, or null for no month filter */
    month: string | null;
    /** If true, display help text and exit */
    showHelp: boolean;
    /** If true, clear saved access token and exit */
    clearConfig: boolean;
    /** If true, enable verbose debug logging */
    debug: boolean;
}

const HELP_TEXT = `
gptinvoice - Download ChatGPT invoices

USAGE:
  gptinvoice [OPTIONS]

OPTIONS:
  -output <dir>     Download invoices to specified directory (default: current directory)
  --all             Download all available invoices
  -month <YYYY-MM>  Download invoice for a specific month (e.g., 2024-01)
  --clear           Clear saved access token from config
  --debug           Enable debug logging
  -h, -help         Show this help message

EXAMPLES:
  gptinvoice                       Download the latest invoice to current directory
  gptinvoice -output ./invoices    Download the latest invoice to ./invoices
  gptinvoice --all                 Download all available invoices
  gptinvoice -month 2024-01        Download the invoice for January 2024
  gptinvoice --all -output ~/docs  Download all invoices to ~/docs

CONFIGURATION:
  On first run, you will be prompted to enter your ChatGPT access token.
  The token is stored in ~/.gptinvoice/config

  To get your access token:
  1. Log into ChatGPT in your browser
  2. Open the browser developer console (F12 or Cmd+Option+I)
  3. Run this command:
     window.__reactRouterContext?.state?.loaderData?.root?.clientBootstrap?.session?.accessToken
  4. Copy the returned token (without quotes)
`;

/**
 * Parses command-line arguments into a CliOptions object.
 * Exits the process with an error message for invalid options.
 * @param args - Array of command-line arguments (typically process.argv.slice(2))
 * @returns Parsed options with defaults applied
 * @throws Exits process on invalid month format or unknown options
 */
export function parseArgs(args: string[]): CliOptions {
    const options: CliOptions = {
        outputDir: process.cwd(),
        downloadAll: false,
        month: null,
        showHelp: false,
        clearConfig: false,
        debug: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '-h' || arg === '-help' || arg === '--help') {
            options.showHelp = true;
        } else if (arg === '--all') {
            options.downloadAll = true;
        } else if (arg === '--clear') {
            options.clearConfig = true;
        } else if (arg === '--debug') {
            options.debug = true;
        } else if (arg === '-output' && i + 1 < args.length) {
            options.outputDir = args[++i];
        } else if (arg === '-month' && i + 1 < args.length) {
            const monthArg = args[++i];
            if (!isValidMonthFormat(monthArg)) {
                console.error(
                    `Error: Invalid month format "${monthArg}". Expected format: YYYY-MM (e.g., 2024-01)`
                );
                process.exit(1);
            }
            options.month = monthArg;
        } else if (arg.startsWith('-')) {
            console.error(`Error: Unknown option "${arg}"`);
            console.error('Use -h or -help for usage information');
            process.exit(1);
        }
    }

    return options;
}

/**
 * Validates that a string is in YYYY-MM format with valid month (01-12).
 * @param month - The string to validate
 * @returns True if the format is valid, false otherwise
 * @example
 * isValidMonthFormat('2024-01') // true
 * isValidMonthFormat('2024-13') // false
 * isValidMonthFormat('24-01')   // false
 */
export function isValidMonthFormat(month: string): boolean {
    const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
    return regex.test(month);
}

/**
 * Prints the help text to stdout.
 */
export function printHelp(): void {
    console.log(HELP_TEXT);
}

/**
 * Returns the help text string.
 * @returns The full help text including usage, options, and examples
 */
export function getHelpText(): string {
    return HELP_TEXT;
}
