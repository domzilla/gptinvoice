/**
 * @file api.test.ts
 * @module tests/api
 * @author Dominic Rodemer
 * @created 2025-11-30
 * @license MIT
 *
 * @fileoverview Unit tests for the ChatGPT API client.
 */

import { verifyAccessToken } from '../src/api';

// Mock the debug module
jest.mock('../src/debug', () => ({
    debug: jest.fn(),
    debugError: jest.fn(),
}));

describe('api', () => {
    describe('verifyAccessToken', () => {
        const originalFetch = global.fetch;

        afterEach(() => {
            global.fetch = originalFetch;
        });

        const mockHeaders = new Map();
        const mockResponse = (ok: boolean, status: number) => ({
            ok,
            status,
            headers: { entries: () => mockHeaders.entries() },
            text: jest.fn().mockResolvedValue(''),
        });

        it('should return valid:true when API returns 200', async () => {
            global.fetch = jest.fn().mockResolvedValue(mockResponse(true, 200));

            const result = await verifyAccessToken('valid-token');

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should return valid:false when API returns 401', async () => {
            global.fetch = jest.fn().mockResolvedValue(mockResponse(false, 401));

            const result = await verifyAccessToken('invalid-token');

            expect(result.valid).toBe(false);
            expect(result.error).toContain('invalid or expired');
        });

        it('should return valid:false when API returns 403', async () => {
            global.fetch = jest.fn().mockResolvedValue(mockResponse(false, 403));

            const result = await verifyAccessToken('forbidden-token');

            expect(result.valid).toBe(false);
            expect(result.error).toContain('invalid or expired');
        });

        it('should return valid:false with error on other HTTP errors', async () => {
            global.fetch = jest.fn().mockResolvedValue(mockResponse(false, 500));

            const result = await verifyAccessToken('some-token');

            expect(result.valid).toBe(false);
            expect(result.error).toContain('Unexpected response');
            expect(result.error).toContain('500');
        });

        it('should return valid:false on network error', async () => {
            global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

            const result = await verifyAccessToken('some-token');

            expect(result.valid).toBe(false);
            expect(result.error).toContain('Network error');
            expect(result.error).toContain('Network failure');
        });

        it('should call API with correct headers', async () => {
            const mockFetch = jest.fn().mockResolvedValue(mockResponse(true, 200));
            global.fetch = mockFetch;

            await verifyAccessToken('test-token-123');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://chatgpt.com/backend-api/payments/customer_portal',
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token-123',
                        Referer: 'https://chatgpt.com/',
                        Origin: 'https://chatgpt.com',
                        'Content-Type': 'application/json',
                        'User-Agent': expect.stringContaining('Mozilla'),
                    }),
                })
            );
        });
    });
});
