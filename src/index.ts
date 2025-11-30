#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { parseArgs, printHelp } from './cli';
import { loadConfig, saveConfig, configExists, deleteConfig } from './config';
import { verifyAccessToken, getCustomerPortalUrl } from './api';
import { printTokenInstructions, promptForToken } from './prompt';
import { getInvoiceUrls, downloadInvoice, filterInvoicesByMonth } from './download';

async function getValidAccessToken(): Promise<string> {
  const config = loadConfig();

  if (config) {
    console.log('Verifying saved access token...');
    const result = await verifyAccessToken(config.accessToken);

    if (result.valid) {
      console.log('Access token is valid.');
      return config.accessToken;
    }

    console.log('Saved access token is no longer valid.');
    console.log(result.error || 'Token expired or revoked.');
  } else if (!configExists()) {
    console.log('No configuration found. First-time setup required.');
  } else {
    console.log('Configuration file is invalid or corrupted.');
  }

  // Need to prompt for a new token
  printTokenInstructions();

  while (true) {
    const token = await promptForToken();

    if (!token) {
      console.log('No token provided. Please try again.');
      continue;
    }

    console.log('Verifying access token...');
    const result = await verifyAccessToken(token);

    if (result.valid) {
      console.log('Access token is valid. Saving configuration...');
      saveConfig({ accessToken: token });
      console.log('Configuration saved.');
      return token;
    }

    console.log(`Invalid token: ${result.error}`);
    console.log('Please try again with a valid token.\n');
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.showHelp) {
    printHelp();
    process.exit(0);
  }

  if (options.clearConfig) {
    deleteConfig();
    console.log('Access token cleared from config.');
    process.exit(0);
  }

  // Get a valid access token (prompting if necessary)
  const accessToken = await getValidAccessToken();

  // Get the customer portal URL
  console.log('\nFetching invoice portal...');
  let portalUrl: string;
  try {
    portalUrl = await getCustomerPortalUrl(accessToken);
    console.log('Invoice portal URL retrieved.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to fetch invoice portal: ${message}`);
    process.exit(1);
  }

  // Launch browser
  console.log('\nLaunching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage'
    ]
  });

  try {
    const page = await browser.newPage();

    // Get all invoice URLs
    console.log('Fetching invoice list...');
    const allInvoices = await getInvoiceUrls(page, portalUrl);

    if (allInvoices.length === 0) {
      console.log('No invoices found.');
      return;
    }

    console.log(`Found ${allInvoices.length} invoice(s).`);

    // Determine which invoices to download
    let invoicesToDownload = allInvoices;

    if (options.month) {
      invoicesToDownload = filterInvoicesByMonth(allInvoices, options.month);
      if (invoicesToDownload.length === 0) {
        console.log(`No invoices found for ${options.month}.`);
        return;
      }
      console.log(`Found ${invoicesToDownload.length} invoice(s) for ${options.month}.`);
    } else if (!options.downloadAll) {
      // Only download the latest (first) invoice
      invoicesToDownload = [allInvoices[0]];
      console.log('Downloading latest invoice...');
    } else {
      console.log('Downloading all invoices...');
    }

    // Download the invoices
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < invoicesToDownload.length; i++) {
      const invoice = invoicesToDownload[i];
      console.log(`\n[${i + 1}/${invoicesToDownload.length}] Downloading invoice (${invoice.date})...`);

      const result = await downloadInvoice(browser, invoice.url, options.outputDir);

      if (result.success) {
        console.log(`Downloaded: ${result.filePath}`);
        successCount++;
      } else {
        console.error(`Failed: ${result.error}`);
        failCount++;
      }
    }

    // Summary
    console.log('\n--- Summary ---');
    console.log(`Downloaded: ${successCount}`);
    if (failCount > 0) {
      console.log(`Failed: ${failCount}`);
    }
    console.log(`Output directory: ${options.outputDir}`);

  } finally {
    await browser.close();
    console.log('\nDone.');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error.message || error);
  process.exit(1);
});
