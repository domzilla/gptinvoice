import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Config {
  accessToken: string;
}

export function getConfigDir(): string {
  return path.join(os.homedir(), '.gptinvoice');
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config');
}

export function configExists(): boolean {
  return fs.existsSync(getConfigPath());
}

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

export function deleteConfig(): void {
  if (configExists()) {
    fs.unlinkSync(getConfigPath());
  }
}
