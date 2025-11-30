export interface CustomerPortalResponse {
  url: string;
}

export interface TokenVerificationResult {
  valid: boolean;
  error?: string;
}

const CHATGPT_API_BASE = 'https://chatgpt.com/backend-api';

export async function verifyAccessToken(accessToken: string): Promise<TokenVerificationResult> {
  try {
    const response = await fetch(`${CHATGPT_API_BASE}/payments/customer_portal`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Referer': 'https://chatgpt.com/',
        'Origin': 'https://chatgpt.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (response.ok) {
      return { valid: true };
    } else if (response.status === 401 || response.status === 403) {
      return { valid: false, error: 'Access token is invalid or expired' };
    } else {
      return { valid: false, error: `Unexpected response: HTTP ${response.status}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { valid: false, error: `Network error: ${message}` };
  }
}

export async function getCustomerPortalUrl(accessToken: string): Promise<string> {
  const response = await fetch(`${CHATGPT_API_BASE}/payments/customer_portal`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Referer': 'https://chatgpt.com/',
      'Origin': 'https://chatgpt.com',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch customer portal: HTTP ${response.status}`);
  }

  const data = await response.json() as CustomerPortalResponse;

  if (!data.url) {
    throw new Error('Customer portal URL not found in response');
  }

  return data.url;
}
