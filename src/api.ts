import { debug, debugError } from './debug';

export interface CustomerPortalResponse {
  url: string;
}

export interface TokenVerificationResult {
  valid: boolean;
  error?: string;
}

const CHATGPT_API_BASE = 'https://chatgpt.com/backend-api';

export async function verifyAccessToken(accessToken: string): Promise<TokenVerificationResult> {
  const url = `${CHATGPT_API_BASE}/payments/customer_portal`;

  debug(`Verifying access token (length: ${accessToken.length})`);
  debug(`Request URL: ${url}`);

  try {
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Referer': 'https://chatgpt.com/',
      'Origin': 'https://chatgpt.com',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    debug('Request headers:', Object.keys(headers));

    const response = await fetch(url, {
      method: 'GET',
      headers
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
      } catch {}
      return { valid: false, error: 'Access token is invalid or expired' };
    } else {
      let body = '';
      try {
        body = await response.text();
        debug('Response body:', body);
      } catch {}
      return { valid: false, error: `Unexpected response: HTTP ${response.status}` };
    }
  } catch (error) {
    debugError('Token verification failed', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { valid: false, error: `Network error: ${message}` };
  }
}

export async function getCustomerPortalUrl(accessToken: string): Promise<string> {
  const url = `${CHATGPT_API_BASE}/payments/customer_portal`;

  debug(`Fetching customer portal URL from: ${url}`);

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Referer': 'https://chatgpt.com/',
    'Origin': 'https://chatgpt.com',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  debug(`Response status: ${response.status}`);

  if (!response.ok) {
    let body = '';
    try {
      body = await response.text();
      debug('Response body:', body);
    } catch {}
    throw new Error(`Failed to fetch customer portal: HTTP ${response.status}`);
  }

  const data = await response.json() as CustomerPortalResponse;
  debug('Portal URL response:', data);

  if (!data.url) {
    throw new Error('Customer portal URL not found in response');
  }

  return data.url;
}
