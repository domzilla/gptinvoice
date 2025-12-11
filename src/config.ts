/**
 * @file config.ts
 * @module config
 * @author Dominic Rodemer
 * @created 2025-11-30
 * @license MIT
 *
 * @fileoverview Configuration management for gptinvoice.
 * Handles reading, writing, and deleting the config file stored at ~/.gptinvoice/config.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Configuration object stored in the config file.
 */
export interface Config {
  /** The ChatGPT access token used for API authentication */
  accessToken: string;
}

/**
 * Gets the path to the configuration directory.
 * @returns The absolute path to ~/.gptinvoice
 */
export function getConfigDir(): string {
  return path.join(os.homedir(), '.gptinvoice');
}

/**
 * Gets the path to the configuration file.
 * @returns The absolute path to ~/.gptinvoice/config
 */
export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config');
}

/**
 * Checks if a configuration file exists.
 * @returns True if the config file exists, false otherwise
 */
export function configExists(): boolean {
  return fs.existsSync(getConfigPath());
}

/**
 * Loads and validates the configuration from disk.
 * @returns The config object if valid, null if missing, invalid JSON, or missing accessToken
 */
export function loadConfig(): Config | null {
  if (!configExists()) {
    return null;
  }

  try {
    const content = fs.readFileSync(getConfigPath(), 'utf-8');
    const config = JSON.parse(content) as Config;

    if (!config.accessToken || typeof config.accessToken !== 'string') {
      return null;
    }

    return config;
  } catch {
    return null;
  }
}

/**
 * Saves the configuration to disk.
 * Creates the config directory if it doesn't exist.
 * Sets secure file permissions (0600 for file, 0700 for directory).
 * @param config - The configuration to save
 */
export function saveConfig(config: Config): void {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
  }

  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), {
    encoding: 'utf-8',
    mode: 0o600
  });
}

/**
 * Deletes the configuration file if it exists.
 * Does nothing if the config file doesn't exist.
 */
export function deleteConfig(): void {
  if (configExists()) {
    fs.unlinkSync(getConfigPath());
  }
}
