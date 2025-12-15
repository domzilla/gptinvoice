/**
 * @file debug.ts
 * @module debug
 * @author Dominic Rodemer
 * @created 2025-11-30
 * @license MIT
 *
 * @fileoverview Debug logging utilities for gptinvoice.
 * Provides conditional logging that can be enabled via the --debug CLI flag.
 */

/** Flag indicating whether debug logging is enabled */
let debugEnabled = false;

/**
 * Enables or disables debug logging globally.
 * @param enabled - Whether to enable debug logging
 */
export function setDebugEnabled(enabled: boolean): void {
    debugEnabled = enabled;
}

/**
 * Returns whether debug logging is currently enabled.
 * @returns True if debug logging is enabled
 */
export function isDebugEnabled(): boolean {
    return debugEnabled;
}

/**
 * Logs a debug message to the console if debug mode is enabled.
 * Messages are prefixed with [DEBUG] for easy identification.
 * @param message - The message to log
 * @param args - Additional arguments to log (will be passed to console.log)
 */
export function debug(message: string, ...args: unknown[]): void {
    if (debugEnabled) {
        console.log(`[DEBUG] ${message}`, ...args);
    }
}

/**
 * Logs an error with full details if debug mode is enabled.
 * Includes error message and stack trace for Error objects.
 * @param message - Descriptive message about what operation failed
 * @param error - The error that occurred (Error object or any value)
 */
export function debugError(message: string, error: unknown): void {
    if (debugEnabled) {
        console.error(`[DEBUG] ${message}`);
        if (error instanceof Error) {
            console.error(`[DEBUG] Error: ${error.message}`);
            if (error.stack) {
                console.error(`[DEBUG] Stack: ${error.stack}`);
            }
        } else {
            console.error(`[DEBUG] Error:`, error);
        }
    }
}
