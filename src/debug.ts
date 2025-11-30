let debugEnabled = false;

export function setDebugEnabled(enabled: boolean): void {
  debugEnabled = enabled;
}

export function isDebugEnabled(): boolean {
  return debugEnabled;
}

export function debug(message: string, ...args: unknown[]): void {
  if (debugEnabled) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

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
