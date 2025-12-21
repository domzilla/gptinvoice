/**
 * @file prompt.ts
 * @module prompt
 * @author Dominic Rodemer
 * @created 2025-11-30
 * @license MIT
 *
 * @fileoverview Interactive user prompts for gptinvoice.
 * Provides functions for displaying instructions and collecting user input.
 */

import * as readline from 'readline';

/** Instructions for obtaining the ChatGPT access token */
const TOKEN_INSTRUCTIONS = `
To get your ChatGPT access token:

1. Log into ChatGPT in your browser (https://chatgpt.com)
2. Open this URL in the same browser: https://chatgpt.com/api/auth/session
3. Copy the accessToken value from the JSON response
   (You can paste the entire JSON or just the token value)
`;

/**
 * Prints instructions for obtaining the ChatGPT access token.
 * Displays browser-specific guidance for accessing the developer console.
 */
export function printTokenInstructions(): void {
    console.log(TOKEN_INSTRUCTIONS);
}

/**
 * Extracts the access token from user input.
 * Handles three input formats:
 * - Raw token string
 * - Token with surrounding quotes
 * - Full JSON response from the session endpoint
 * @param input - The raw user input
 * @returns The extracted access token
 */
function extractToken(input: string): string {
    let token = input.trim();

    // Try to parse as JSON (user pasted the full session response)
    if (token.startsWith('{')) {
        try {
            const parsed = JSON.parse(token) as { accessToken?: string };
            if (parsed.accessToken) {
                return parsed.accessToken;
            }
        } catch {
            // Not valid JSON, treat as raw token
        }
    }

    // Remove surrounding quotes if present (makes copy-paste easier)
    if (
        (token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'"))
    ) {
        token = token.slice(1, -1);
    }

    return token;
}

/**
 * Prompts the user to enter their ChatGPT access token.
 * Accepts the raw token, a quoted token, or the full JSON session response.
 * @returns The entered access token (extracted and cleaned)
 */
export async function promptForToken(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => {
        rl.question('Enter your ChatGPT access token (or paste full JSON output): ', answer => {
            rl.close();
            resolve(extractToken(answer));
        });
    });
}

/**
 * Prompts the user with a yes/no question.
 * Accepts 'y', 'yes', 'n', or 'no' (case-insensitive).
 * @param question - The question to display (without the "(y/n)" suffix)
 * @returns True if the user answered yes, false otherwise
 */
export async function promptYesNo(question: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => {
        rl.question(`${question} (y/n): `, answer => {
            rl.close();
            const normalized = answer.trim().toLowerCase();
            resolve(normalized === 'y' || normalized === 'yes');
        });
    });
}
