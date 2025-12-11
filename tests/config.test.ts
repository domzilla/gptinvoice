/**
 * @file config.test.ts
 * @module tests/config
 * @author Dominic Rodemer
 * @created 2025-11-30
 * @license MIT
 *
 * @fileoverview Unit tests for configuration management.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('config', () => {
  let tempDir: string;
  let configModule: typeof import('../src/config');

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gptinvoice-test-'));

    // Clear the module cache
    jest.resetModules();

    // Mock os.homedir before importing
    jest.doMock('os', () => ({
      ...jest.requireActual('os'),
      homedir: () => tempDir
    }));

    // Dynamically import the config module with the mocked os
    configModule = await import('../src/config');
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    jest.resetModules();
  });

  describe('getConfigPath', () => {
    it('should return path in home directory', () => {
      const configPath = configModule.getConfigPath();
      expect(configPath).toContain('.gptinvoice');
      expect(configPath).toContain('config');
    });
  });

  describe('getConfigDir', () => {
    it('should return .gptinvoice directory in home', () => {
      const configDir = configModule.getConfigDir();
      expect(configDir).toContain('.gptinvoice');
    });
  });

  describe('configExists', () => {
    it('should return false when config does not exist', () => {
      expect(configModule.configExists()).toBe(false);
    });

    it('should return true when config exists', () => {
      configModule.saveConfig({ accessToken: 'test-token' });
      expect(configModule.configExists()).toBe(true);
    });
  });

  describe('saveConfig', () => {
    it('should create config directory and file', () => {
      configModule.saveConfig({ accessToken: 'my-secret-token' });

      const configDir = configModule.getConfigDir();
      const configPath = configModule.getConfigPath();

      expect(fs.existsSync(configDir)).toBe(true);
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should save access token correctly', () => {
      const token = 'test-access-token-123';
      configModule.saveConfig({ accessToken: token });

      const content = fs.readFileSync(configModule.getConfigPath(), 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.accessToken).toBe(token);
    });
  });

  describe('loadConfig', () => {
    it('should return null when config does not exist', () => {
      expect(configModule.loadConfig()).toBeNull();
    });

    it('should return config when it exists', () => {
      const token = 'saved-token-456';
      configModule.saveConfig({ accessToken: token });

      const config = configModule.loadConfig();
      expect(config).not.toBeNull();
      expect(config?.accessToken).toBe(token);
    });

    it('should return null for invalid JSON', () => {
      const configDir = configModule.getConfigDir();
      const configPath = configModule.getConfigPath();

      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(configPath, 'not valid json', 'utf-8');

      expect(configModule.loadConfig()).toBeNull();
    });

    it('should return null when accessToken is missing', () => {
      const configDir = configModule.getConfigDir();
      const configPath = configModule.getConfigPath();

      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify({ foo: 'bar' }), 'utf-8');

      expect(configModule.loadConfig()).toBeNull();
    });
  });

  describe('deleteConfig', () => {
    it('should delete existing config', () => {
      configModule.saveConfig({ accessToken: 'token-to-delete' });
      expect(configModule.configExists()).toBe(true);

      configModule.deleteConfig();
      expect(configModule.configExists()).toBe(false);
    });

    it('should not throw when config does not exist', () => {
      expect(() => configModule.deleteConfig()).not.toThrow();
    });
  });
});
