export interface UserConfig {
  tmdbApiKey: string;
  defaultOutputDir: string;
  imageQuality: ImageQuality;
  language: string;
  includeAdult: boolean;
  downloadImages: boolean;
  maxImageSize: ImageSize;
}

export type ImageQuality = 'low' | 'medium' | 'high';
export type ImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';

export interface AppConfig {
  version: string;
  configDir: string;
  outputDir: string;
  tempDir: string;
  logLevel: LogLevel;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface ConfigFile {
  user: UserConfig;
  app: AppConfig;
  lastUpdated: string;
}

export interface Credentials {
  apiKey: string;
  encrypted: boolean;
  lastUsed: string;
}

export const DEFAULT_CONFIG: UserConfig = {
  tmdbApiKey: '',
  defaultOutputDir: './films',
  imageQuality: 'medium',
  language: 'en-US',
  includeAdult: false,
  downloadImages: true,
  maxImageSize: 'w500'
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  version: '1.0.0',
      configDir: '~/.reel-cli',
    outputDir: './films',
    tempDir: '~/.reel-cli/temp',
  logLevel: 'info'
};
