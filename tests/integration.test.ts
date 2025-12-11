/**
 * @file integration.test.ts
 * @module tests/integration
 * @author Dominic Rodemer
 * @created 2025-11-30
 * @license MIT
 *
 * @fileoverview Integration tests for API calls and invoice downloads.
 * These tests require a valid access token stored in ~/.gptinvoice/config.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import puppeteer, { Browser } from 'puppeteer';
import { loadConfig } from '../src/config';
import { verifyAccessToken, getCustomerPortalUrl } from '../src/api';
import { getInvoiceUrls, downloadInvoice } from '../src/download';

// Check if we have a valid access token
const config = loadConfig();
const hasValidToken = config !== null && config.accessToken.length > 0;

// Helper to conditionally run tests
const describeIfToken = hasValidToken ? describe : describe.skip;

describeIfToken('Integration Tests (requires valid access token)', () => {
  let accessToken: string;

  beforeAll(async () => {
    if (!config) {
      throw new Error('No config available');
    }
    accessToken = config.accessToken;

    // Verify token is still valid before running tests
    const result = await verifyAccessToken(accessToken);
    if (!result.valid) {
      console.warn('Access token is no longer valid. Skipping integration tests.');
      // This will cause tests to fail, but with a clear message
      throw new Error(`Access token is invalid: ${result.error}`);
    }
  }, 30000);

  describe('API Integration', () => {
    it('should verify a valid access token', async () => {
      const result = await verifyAccessToken(accessToken);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    }, 30000);

    it('should fetch customer portal URL', async () => {
      const portalUrl = await getCustomerPortalUrl(accessToken);

      expect(portalUrl).toBeDefined();
      expect(typeof portalUrl).toBe('string');
      expect(portalUrl).toMatch(/^https:\/\/pay\.openai\.com/);
    }, 30000);
  });

  describe('Invoice Portal Integration', () => {
    let browser: Browser;
    let portalUrl: string;

    beforeAll(async () => {
      portalUrl = await getCustomerPortalUrl(accessToken);
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage'
        ]
      });
    }, 60000);

    afterAll(async () => {
      if (browser) {
        await browser.close();
      }
    });

    it('should fetch invoice URLs from portal', async () => {
      const page = await browser.newPage();

      try {
        const invoices = await getInvoiceUrls(page, portalUrl);

        expect(Array.isArray(invoices)).toBe(true);
        // User should have at least one invoice if they have a subscription
        expect(invoices.length).toBeGreaterThan(0);

        // Check invoice structure
        const firstInvoice = invoices[0];
        expect(firstInvoice).toHaveProperty('url');
        expect(firstInvoice).toHaveProperty('date');
        expect(typeof firstInvoice.url).toBe('string');
        expect(firstInvoice.url).toMatch(/^https:\/\//);
      } finally {
        await page.close();
      }
    }, 60000);

    it('should download an invoice PDF', async () => {
      const page = await browser.newPage();
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gptinvoice-test-'));

      try {
        // Get invoice list
        const invoices = await getInvoiceUrls(page, portalUrl);
        expect(invoices.length).toBeGreaterThan(0);

        await page.close();

        // Download the first invoice
        const result = await downloadInvoice(browser, invoices[0].url, tempDir);

        expect(result.success).toBe(true);
        expect(result.filePath).toBeDefined();
        expect(result.error).toBeUndefined();

        // Verify the file exists and is a PDF
        if (result.filePath) {
          expect(fs.existsSync(result.filePath)).toBe(true);
          expect(result.filePath).toMatch(/\.pdf$/);

          // Check file size is reasonable (PDFs should be at least a few KB)
          const stats = fs.statSync(result.filePath);
          expect(stats.size).toBeGreaterThan(1000);
        }
      } finally {
        // Cleanup temp directory
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }
    }, 120000);
  });
});

// Always run this test to provide feedback
describe('Integration Test Prerequisites', () => {
  it('should check if access token is available', () => {
    if (!hasValidToken) {
      console.log('\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Integration tests SKIPPED: No valid access token found');
      console.log('  To run integration tests, first run the app to configure your token:');
      console.log('    node dist/index.js');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n');
    }

    // This test always passes - it's just for informational purposes
    expect(true).toBe(true);
  });
});
