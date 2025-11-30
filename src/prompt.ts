/**
 * @fileoverview Interactive user prompts for gptinvoice.
 * Provides functions for displaying instructions and collecting user input.
 * @module prompt
 */

import * as readline from 'readline';

/** Instructions for obtaining the ChatGPT access token */
const TOKEN_INSTRUCTIONS = `
To get your ChatGPT access token:

1. Log into ChatGPT in your browser (https://chatgpt.com)
2. Open the browser developer console:
   - Chrome/Edge: Press F12 or Ctrl+Shift+J (Cmd+Option+J on Mac)
   - Firefox: Press F12 or Ctrl+Shift+K (Cmd+Option+K on Mac)
   - Safari: Press Cmd+Option+C (enable Developer menu in Preferences first)
3. In the console, paste and run this command:
   window.__reactRouterContext?.state?.loaderData?.root?.clientBootstrap?.session?.accessToken
4. Copy the returned string (with or without quotes)
`;

/**
 * Prints instructions for obtaining the ChatGPT access token.
 * Displays browser-specific guidance for accessing the developer console.
 */
export function printTokenInstructions(): void {
  console.log(TOKEN_INSTRUCTIONS);
}

/**
 * Prompts the user to enter their ChatGPT access token.
 * Automatically strips surrounding quotes from the input for convenience.
 * @returns The entered access token (trimmed, quotes removed if present)
 */
export async function promptForToken(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter your ChatGPT access token: ', (answer) => {
      rl.close();
      // Remove surrounding quotes if present (makes copy-paste easier)
      let token = answer.trim();
      if ((token.startsWith('"') && token.endsWith('"')) ||
          (token.startsWith("'") && token.endsWith("'"))) {
        token = token.slice(1, -1);
      }
      resolve(token);
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
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}
