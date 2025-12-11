/**
 * @file download.test.ts
 * @module tests/download
 * @author Dominic Rodemer
 * @created 2025-11-30
 * @license MIT
 *
 * @fileoverview Unit tests for invoice download functionality.
 */

import { filterInvoicesByMonth, Invoice } from '../src/download';

describe('download', () => {
  describe('filterInvoicesByMonth', () => {
    const testInvoices: Invoice[] = [
      { url: 'https://example.com/invoice1', date: 'Jan 15, 2024' },
      { url: 'https://example.com/invoice2', date: 'February 1, 2024' },
      { url: 'https://example.com/invoice3', date: 'Mar 20, 2024' },
      { url: 'https://example.com/invoice4', date: '2024-01-10' },
      { url: 'https://example.com/invoice5', date: 'Dec 25, 2023' },
      { url: 'https://example.com/invoice6', date: 'January 5, 2024' },
    ];

    it('should filter invoices by YYYY-MM format', () => {
      const result = filterInvoicesByMonth(testInvoices, '2024-01');

      expect(result.length).toBe(3);
      expect(result.map(i => i.url)).toContain('https://example.com/invoice1');
      expect(result.map(i => i.url)).toContain('https://example.com/invoice4');
      expect(result.map(i => i.url)).toContain('https://example.com/invoice6');
    });

    it('should filter invoices for February 2024', () => {
      const result = filterInvoicesByMonth(testInvoices, '2024-02');

      expect(result.length).toBe(1);
      expect(result[0].date).toBe('February 1, 2024');
    });

    it('should filter invoices for March 2024', () => {
      const result = filterInvoicesByMonth(testInvoices, '2024-03');

      expect(result.length).toBe(1);
      expect(result[0].date).toBe('Mar 20, 2024');
    });

    it('should filter invoices for December 2023', () => {
      const result = filterInvoicesByMonth(testInvoices, '2023-12');

      expect(result.length).toBe(1);
      expect(result[0].date).toBe('Dec 25, 2023');
    });

    it('should return empty array when no invoices match', () => {
      const result = filterInvoicesByMonth(testInvoices, '2025-01');

      expect(result.length).toBe(0);
    });

    it('should return empty array for empty input', () => {
      const result = filterInvoicesByMonth([], '2024-01');

      expect(result.length).toBe(0);
    });

    it('should handle case-insensitive month names', () => {
      const invoices: Invoice[] = [
        { url: 'https://example.com/1', date: 'JANUARY 1, 2024' },
        { url: 'https://example.com/2', date: 'january 15, 2024' },
      ];

      const result = filterInvoicesByMonth(invoices, '2024-01');

      expect(result.length).toBe(2);
    });
  });
});
