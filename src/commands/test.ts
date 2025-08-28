import { Command } from 'commander';
import chalk from 'chalk';
import { BaseCommand } from './base-command';
import { ConfigManager } from '../lib/config-manager';
import { FilmService } from '../lib/film-service';

export class TestCommand extends BaseCommand {
  protected createCommand(): Command {
    return new Command('test')
      .description('Test TMDB API connection and credentials')
      .action(async () => {
        await this.runWithErrorHandling();
      });
  }

  protected async execute(): Promise<void> {
    this.logInfo('Testing reel-cli configuration and TMDB API connection...\n');

    // Test configuration
    const configManager = new ConfigManager();

    try {
      const config = await configManager.loadConfig();
      this.logSuccess('✅ Configuration loaded successfully');
      this.logInfo(`  📁 Config directory: ${configManager.getConfigDirectory()}`);
      this.logInfo(`  🖼️  Image quality: ${config.user.imageQuality}`);
      this.logInfo(`  📂 Output directory: ${config.user.defaultOutputDir}`);
    } catch (error) {
      this.logError('❌ Failed to load configuration');
      this.logDebug(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test credentials
    try {
      const apiKey = await configManager.getApiKey();
      if (apiKey) {
        this.logSuccess('✅ API key found');
        this.logInfo(`  🔑 API Key: ${chalk.gray('***' + apiKey.slice(-4))}`);
      } else {
        this.logWarning('⚠️  No API key found');
        this.logInfo('  Run "reel configure" to set up your API key');
        return;
      }
    } catch (error) {
      this.logError('❌ Failed to access credentials');
      this.logDebug(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return;
    }

    // Test API connection
    try {
      const apiKey = await configManager.getApiKey();
      if (!apiKey) {
        this.logWarning('Cannot test API without API key');
        return;
      }

      const filmService = new FilmService(apiKey);
      const isConnected = await filmService.testConnection();

      if (isConnected) {
        this.logSuccess('✅ TMDB API connection successful');

        // Test a simple search
        this.logInfo('\n🧪 Testing search functionality...');
        try {
          const results = await filmService.searchFilms({ query: 'test', page: 1 });
          this.logSuccess(`✅ Search test successful - Found ${results.length} results`);
        } catch (error) {
          this.logWarning('⚠️  Search test failed');
          this.logDebug(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        this.logError('❌ TMDB API connection failed');
        this.logInfo('  Please check your API key and internet connection');
      }
    } catch (error) {
      this.logError('❌ API test failed');
      this.logDebug(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    this.logInfo('\n🎯 Test completed!');
  }
}
