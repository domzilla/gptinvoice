export interface CliOptions {
  outputDir: string;
  downloadAll: boolean;
  month: string | null;
  showHelp: boolean;
  clearConfig: boolean;
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

export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    outputDir: process.cwd(),
    downloadAll: false,
    month: null,
    showHelp: false,
    clearConfig: false,
    debug: false
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
        console.error(`Error: Invalid month format "${monthArg}". Expected format: YYYY-MM (e.g., 2024-01)`);
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

export function isValidMonthFormat(month: string): boolean {
  const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return regex.test(month);
}

export function printHelp(): void {
  console.log(HELP_TEXT);
}

export function getHelpText(): string {
  return HELP_TEXT;
}
