import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { BaseCommand } from './base-command';
import { ConfigurationError } from '../types';
import { ConfigManager } from '../lib/config-manager';
import { FilmService } from '../lib/film-service';

export class ConfigureCommand extends BaseCommand {
  protected createCommand(): Command {
    return new Command('configure')
      .description('Configure TMDB API credentials and settings')
      .option('-k, --api-key <key>', 'TMDB API key')
      .option('-o, --output-dir <path>', 'Default output directory for films')
      .option('-q, --image-quality <quality>', 'Image quality (low|medium|high)')
      .action(async (options) => {
        await this.runWithErrorHandling(options);
      });
  }

  protected async execute(options: any): Promise<void> {
    this.logInfo('Configuring reel-cli...');

    let apiKey = options.apiKey;
    let outputDir = options.outputDir;
    let imageQuality = options.imageQuality;

    // If not provided via command line, prompt for them
    if (!apiKey) {
      const answers = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: 'Enter your TMDB API key:',
          validate: (input: string) => {
            if (!input || input.trim().length === 0) {
              return 'API key is required';
            }
            if (input.length < 10) {
              return 'API key seems too short';
            }
            return true;
          }
        }
      ]);
      apiKey = answers.apiKey;
    }

    if (!outputDir) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'outputDir',
          message: 'Default output directory for films:',
          default: './films',
          validate: (input: string) => {
            if (!input || input.trim().length === 0) {
              return 'Output directory is required';
            }
            return true;
          }
        }
      ]);
      outputDir = answers.outputDir;
    }

    if (!imageQuality) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'imageQuality',
          message: 'Default image quality:',
          choices: [
            { name: 'Low (faster, smaller files)', value: 'low' },
            { name: 'Medium (balanced)', value: 'medium' },
            { name: 'High (slower, larger files)', value: 'high' }
          ],
          default: 'medium'
        }
      ]);
      imageQuality = answers.imageQuality;
    }

    // Validate inputs
    this.validateApiKey(apiKey);
    this.validateOutputDir(outputDir);
    this.validateImageQuality(imageQuality);

    // Save configuration
    const configManager = new ConfigManager();
    await configManager.saveCredentials(apiKey);
    await configManager.updateUserConfig({
      tmdbApiKey: apiKey,
      defaultOutputDir: outputDir,
      imageQuality: imageQuality as any
    });

    this.logSuccess('Configuration completed successfully!');
    this.logInfo(`API Key: ${chalk.gray('***' + apiKey.slice(-4))}`);
    this.logInfo(`Output Directory: ${outputDir}`);
    this.logInfo(`Image Quality: ${imageQuality}`);

    // Test API connection
    this.logInfo('\nTesting TMDB API connection...');
    const filmService = new FilmService(apiKey);
    const isConnected = await filmService.testConnection();

    if (isConnected) {
      this.logSuccess('✅ TMDB API connection successful!');
      this.logInfo('\nYou can now use "reel search <title>" to search for films!');
    } else {
      this.logWarning('⚠️  TMDB API connection failed. Please check your API key.');
    }
  }

  public validateApiKey(apiKey: string): void {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new ConfigurationError('API key is required');
    }
    if (apiKey.length < 10) {
      throw new ConfigurationError('API key seems too short');
    }
  }

  private validateOutputDir(outputDir: string): void {
    if (!outputDir || outputDir.trim().length === 0) {
      throw new ConfigurationError('Output directory is required');
    }
    // TODO: Add more validation (e.g., check if directory is writable)
  }

  private validateImageQuality(imageQuality: string): void {
    const validQualities = ['low', 'medium', 'high'];
    if (!validQualities.includes(imageQuality)) {
      throw new ConfigurationError(`Invalid image quality. Must be one of: ${validQualities.join(', ')}`);
    }
  }
}
