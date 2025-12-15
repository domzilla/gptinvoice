/**
 * @file api.ts
 * @module api
 * @author Dominic Rodemer
 * @created 2025-11-30
 * @license MIT
 *
 * @fileoverview ChatGPT API client for gptinvoice.
 * Handles authentication verification and fetching the customer billing portal URL.
 */

import { debug, debugError } from './debug';

/**
 * Response from the customer portal API endpoint.
 */
export interface CustomerPortalResponse {
    /** URL to the Stripe billing portal */
    url: string;
}

/**
 * Result of verifying an access token.
 */
export interface TokenVerificationResult {
    /** Whether the token is valid */
    valid: boolean;
    /** Error message if the token is invalid */
    error?: string;
}

/** Base URL for the ChatGPT backend API */
const CHATGPT_API_BASE = 'https://chatgpt.com/backend-api';

/**
 * Verifies that an access token is valid by making a request to the billing API.
 * Uses the customer portal endpoint as a lightweight verification method.
 * @param accessToken - The ChatGPT access token to verify
 * @returns Object indicating whether the token is valid, with error details if not
 */
export async function verifyAccessToken(accessToken: string): Promise<TokenVerificationResult> {
    const url = `${CHATGPT_API_BASE}/payments/customer_portal`;

    debug(`Verifying access token (length: ${accessToken.length})`);
    debug(`Request URL: ${url}`);

    try {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Referer: 'https://chatgpt.com/',
            Origin: 'https://chatgpt.com',
            'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };

        debug('Request headers:', Object.keys(headers));

        const response = await fetch(url, {
            method: 'GET',
            headers,
        });

        debug(`Response status: ${response.status}`);

        if (response.ok) {
            debug('Token verification successful');
            return { valid: true };
        } else if (response.status === 401 || response.status === 403) {
            let body = '';
            try {
                body = await response.text();
                debug('Response body:', body);
            } catch {
                // Ignore - body extraction is best effort
            }
            return { valid: false, error: 'Access token is invalid or expired' };
        } else {
            let body = '';
            try {
                body = await response.text();
                debug('Response body:', body);
            } catch {
                // Ignore - body extraction is best effort
            }
            return { valid: false, error: `Unexpected response: HTTP ${response.status}` };
        }
    } catch (error) {
        debugError('Token verification failed', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { valid: false, error: `Network error: ${message}` };
    }
}

/**
 * Fetches the Stripe customer billing portal URL from the ChatGPT API.
 * The portal URL provides access to invoices and billing management.
 * @param accessToken - A valid ChatGPT access token
 * @returns The URL to the Stripe billing portal
 * @throws Error if the request fails or the response is invalid
 */
export async function getCustomerPortalUrl(accessToken: string): Promise<string> {
    const url = `${CHATGPT_API_BASE}/payments/customer_portal`;

    debug(`Fetching customer portal URL from: ${url}`);

    const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Referer: 'https://chatgpt.com/',
        Origin: 'https://chatgpt.com',
        'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    const response = await fetch(url, {
        method: 'GET',
        headers,
    });

    debug(`Response status: ${response.status}`);

    if (!response.ok) {
        let body = '';
        try {
            body = await response.text();
            debug('Response body:', body);
        } catch {
            // Ignore - body extraction is best effort
        }
        throw new Error(`Failed to fetch customer portal: HTTP ${response.status}`);
    }

    const data = (await response.json()) as CustomerPortalResponse;
    debug('Portal URL response:', data);

    if (!data.url) {
        throw new Error('Customer portal URL not found in response');
    }

    return data.url;
}
