import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { UserConfig, ConfigFile, DEFAULT_CONFIG, DEFAULT_APP_CONFIG, ConfigurationError } from '../types';

export class ConfigManager {
  private configDir: string;
  private configPath: string;
  private credentialsPath: string;

  constructor() {
    this.configDir = this.getConfigDirectory();
    this.configPath = path.join(this.configDir, 'config.json');
    this.credentialsPath = path.join(this.configDir, 'credentials.json');
  }

    public getConfigDirectory(): string {
    const homeDir = os.homedir();
          const configDir = path.join(homeDir, '.reel-cli');

    // Ensure config directory exists
    if (!fs.existsSync(configDir)) {
      try {
        fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
      } catch (error) {
        throw new ConfigurationError(
          `Failed to create config directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { path: configDir, error }
        );
      }
    }

    return configDir;
  }

  public async loadConfig(): Promise<ConfigFile> {
    try {
      if (!fs.existsSync(this.configPath)) {
        return this.createDefaultConfig();
      }

      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config = JSON.parse(configData) as ConfigFile;

      // Validate and merge with defaults
      return this.validateAndMergeConfig(config);

    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }

      throw new ConfigurationError(
        `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { path: this.configPath, error }
      );
    }
  }

  public async saveConfig(config: ConfigFile): Promise<void> {
    try {
      // Ensure config directory exists
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true, mode: 0o700 });
      }

      // Update timestamp
      config.lastUpdated = new Date().toISOString();

      // Write config file
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), { mode: 0o600 });

    } catch (error) {
      throw new ConfigurationError(
        `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { path: this.configPath, error }
      );
    }
  }

  public async loadCredentials(): Promise<string | null> {
    try {
      if (!fs.existsSync(this.credentialsPath)) {
        return null;
      }

      const credentialsData = fs.readFileSync(this.credentialsPath, 'utf8');
      const credentials = JSON.parse(credentialsData);

      // TODO: Implement proper encryption/decryption
      return credentials.apiKey || null;

    } catch (error) {
      // If credentials file is corrupted, return null
      return null;
    }
  }

  public async saveCredentials(apiKey: string): Promise<void> {
    try {
      // Ensure config directory exists
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true, mode: 0o700 });
      }

      const credentials = {
        apiKey,
        encrypted: false, // TODO: Implement encryption
        lastUsed: new Date().toISOString()
      };

      // Write credentials file
      fs.writeFileSync(this.credentialsPath, JSON.stringify(credentials, null, 2), { mode: 0o600 });

    } catch (error) {
      throw new ConfigurationError(
        `Failed to save credentials: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { path: this.credentialsPath, error }
      );
    }
  }

  public async updateUserConfig(updates: Partial<UserConfig>): Promise<void> {
    const config = await this.loadConfig();

    // Merge updates with existing config
    config.user = { ...config.user, ...updates };

    // Save updated config
    await this.saveConfig(config);
  }

  public async getApiKey(): Promise<string | null> {
    // First try to get from credentials file
    const credentialsKey = await this.loadCredentials();
    if (credentialsKey) {
      return credentialsKey;
    }

    // Fallback to environment variable
    return process.env.TMDB_API_KEY || null;
  }

  public async isConfigured(): Promise<boolean> {
    const apiKey = await this.getApiKey();
    return !!apiKey && apiKey.trim().length > 0;
  }

  private createDefaultConfig(): ConfigFile {
    return {
      user: { ...DEFAULT_CONFIG },
      app: { ...DEFAULT_APP_CONFIG },
      lastUpdated: new Date().toISOString()
    };
  }

  private validateAndMergeConfig(config: ConfigFile): ConfigFile {
    // Ensure all required fields exist
    const validatedConfig: ConfigFile = {
      user: { ...DEFAULT_CONFIG, ...config.user },
      app: { ...DEFAULT_APP_CONFIG, ...config.app },
      lastUpdated: config.lastUpdated || new Date().toISOString()
    };

    // Validate user config
    if (!validatedConfig.user.tmdbApiKey) {
      validatedConfig.user.tmdbApiKey = '';
    }

    // Validate image quality
    if (!['low', 'medium', 'high'].includes(validatedConfig.user.imageQuality)) {
      validatedConfig.user.imageQuality = 'medium';
    }

    // Validate image size
    if (!['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'].includes(validatedConfig.user.maxImageSize)) {
      validatedConfig.user.maxImageSize = 'w500';
    }

    return validatedConfig;
  }

  public getConfigPath(): string {
    return this.configPath;
  }

  public getCredentialsPath(): string {
    return this.credentialsPath;
  }
}
