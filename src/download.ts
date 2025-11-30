import * as fs from 'fs';
import * as path from 'path';
import type { Browser, Page } from 'puppeteer';
import { debug, debugError } from './debug';

export interface Invoice {
  url: string;
  date: string;
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export async function getInvoiceUrls(page: Page, portalUrl: string): Promise<Invoice[]> {
  debug(`Navigating to invoice portal: ${portalUrl}`);
  console.log('Navigating to invoice portal...');
  await page.goto(portalUrl, { waitUntil: 'networkidle2' });

  debug('Waiting for invoice link selector: a[data-testid="hip-link"]');
  console.log('Waiting for invoice list to load...');
  await page.waitForSelector('a[data-testid="hip-link"]', { timeout: 30000 });

  debug('Extracting invoice URLs from page');
  const invoices = await page.evaluate(() => {
    const links = document.querySelectorAll('a[data-testid="hip-link"]');
    const results: { url: string; date: string }[] = [];

    links.forEach((link) => {
      const anchor = link as HTMLAnchorElement;
      const url = anchor.href;

      // Try to extract date from the invoice row
      const row = anchor.closest('tr') || anchor.closest('[data-testid]')?.parentElement;
      let date = 'unknown';

      if (row) {
        // Look for date patterns in the row text
        const text = row.textContent || '';
        const dateMatch = text.match(/(\w{3}\s+\d{1,2},?\s+\d{4})|(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          date = dateMatch[0];
        }
      }

      results.push({ url, date });
    });

    return results;
  });

  debug(`Found ${invoices.length} invoice(s):`, invoices);
  return invoices;
}

export function filterInvoicesByMonth(invoices: Invoice[], targetMonth: string): Invoice[] {
  // targetMonth format: YYYY-MM
  const [year, month] = targetMonth.split('-');

  return invoices.filter((invoice) => {
    // Try to parse the date and match month/year
    const dateStr = invoice.date;

    // Handle various date formats
    // Format: "Jan 15, 2024" or "January 15, 2024"
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const longMonthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

    const lowerDate = dateStr.toLowerCase();

    for (let i = 0; i < monthNames.length; i++) {
      if (lowerDate.includes(monthNames[i]) || lowerDate.includes(longMonthNames[i])) {
        const monthNum = String(i + 1).padStart(2, '0');
        if (monthNum === month && dateStr.includes(year)) {
          return true;
        }
      }
    }

    // Format: "2024-01-15"
    if (dateStr.startsWith(`${year}-${month}`)) {
      return true;
    }

    return false;
  });
}

export async function downloadInvoice(
  browser: Browser,
  invoiceUrl: string,
  outputDir: string
): Promise<DownloadResult> {
  debug(`Starting download from: ${invoiceUrl}`);
  debug(`Output directory: ${outputDir}`);

  const invoicePage = await browser.newPage();

  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      debug(`Creating output directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Set up download behavior using CDP
    debug('Setting up CDP download behavior');
    const cdp = await invoicePage.createCDPSession();
    await cdp.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: path.resolve(outputDir)
    });

    debug(`Navigating to invoice URL: ${invoiceUrl}`);
    console.log('Opening invoice page...');
    await invoicePage.goto(invoiceUrl, { waitUntil: 'networkidle2' });

    debug('Waiting for download button: button.Button--primary');
    console.log('Looking for download button...');
    await invoicePage.waitForSelector('button.Button--primary', { visible: true, timeout: 30000 });

    debug('Clicking download button');
    // Click the download button
    await invoicePage.click('button.Button--primary');

    console.log('Waiting for download to complete...');
    const downloadedFile = await waitForFileDownload(outputDir, 30000);

    debug(`Download complete: ${downloadedFile}`);
    return { success: true, filePath: downloadedFile };
  } catch (error) {
    debugError('Download failed', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  } finally {
    await invoicePage.close();
  }
}

async function waitForFileDownload(downloadDir: string, timeout: number): Promise<string> {
  const startTime = Date.now();
  const existingFiles = new Set(fs.readdirSync(downloadDir).filter(f => f.endsWith('.pdf')));

  while (Date.now() - startTime < timeout) {
    const currentFiles = fs.readdirSync(downloadDir).filter(f => f.endsWith('.pdf'));
    const newFiles = currentFiles.filter(f => !existingFiles.has(f));

    if (newFiles.length > 0) {
      const newFile = path.join(downloadDir, newFiles[0]);

      // Wait for file to finish writing (size stabilizes)
      let lastSize = 0;
      for (let i = 0; i < 10; i++) {
        await sleep(500);
        const stats = fs.statSync(newFile);
        if (stats.size > 0 && stats.size === lastSize) {
          return newFile;
        }
        lastSize = stats.size;
      }

      return newFile;
    }

    await sleep(1000);
  }

  throw new Error('Download timed out');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
