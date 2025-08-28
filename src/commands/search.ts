import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { BaseCommand } from './base-command';
import { APIError, SearchParams } from '../types';
import { ConfigManager } from '../lib/config-manager';
import { FilmService } from '../lib/film-service';
import { StorageService } from '../lib/storage-service';
import { FileHelpers } from '../utils/file-helpers';

export class SearchCommand extends BaseCommand {
  protected createCommand(): Command {
    return new Command('search')
      .description('Search for films by title')
      .argument('<title>', 'Film title to search for')
      .option('-y, --year <year>', 'Filter by release year')
      .option('-a, --adult', 'Include adult content')
      .option('-o, --output <path>', 'Output directory for this film')
      .action(async (title, options) => {
        await this.runWithErrorHandling(title, options);
      });
  }

    protected async execute(title: string, options: any): Promise<void> {
    this.logInfo(`Searching for films with title: "${title}"`);

    // Get API key from configuration
    const configManager = new ConfigManager();
    const apiKey = await configManager.getApiKey();

    if (!apiKey) {
              this.logWarning('No API key configured. Please run "reel configure" to set up your TMDB API key.');
      this.logInfo('You can get a free API key from: https://www.themoviedb.org/settings/api');
      return;
    }

    this.validateApiKey(apiKey);

    try {
      // Create film service and search
      const filmService = new FilmService(apiKey);

      // Validate search parameters
      const searchParams: SearchParams = {
        query: title,
        year: options.year ? parseInt(options.year) : undefined,
        includeAdult: options.adult || false
      };

      filmService.validateSearchParams(searchParams);

      const results = await filmService.searchFilms(searchParams);

      if (results.length === 0) {
        this.logWarning(`No films found matching "${title}"`);
        return;
      }

      await this.displaySearchResults(results, title);

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        `Failed to search for films: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }





  private async displaySearchResults(results: any[], searchTitle: string): Promise<void> {
    this.logSuccess(`Found ${results.length} film(s) matching "${searchTitle}"`);

    const choices = results.map((film, index) => ({
      name: `${index + 1}. ${film.title} (${film.releaseDate}) - Rating: ${film.voteAverage}/10`,
      value: index,
      short: film.title
    }));

    choices.push({
      name: 'Cancel search',
      value: -1,
      short: 'Cancel'
    });

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedFilm',
        message: 'Select a film to view details:',
        choices,
        pageSize: 10
      }
    ]);

    if (answer.selectedFilm === -1) {
      this.logInfo('Search cancelled');
      return;
    }

    const selectedFilm = results[answer.selectedFilm];

    // Ask if user wants detailed info
    const detailAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'showDetails',
        message: 'Would you like to see detailed information about this film?',
        default: true
      }
    ]);

    if (detailAnswer.showDetails) {
      await this.showDetailedFilmInfo(selectedFilm);
    }

    await this.showFilmDetails(selectedFilm);
  }

    private async showFilmDetails(film: any): Promise<void> {
    this.logInfo(`\n📽️  ${chalk.bold(film.title)}`);
    this.logInfo(`📅 Release Date: ${film.releaseDate}`);
    this.logInfo(`⭐ Rating: ${film.voteAverage}/10 (${film.voteCount} votes)`);
    this.logInfo(`📝 Overview: ${film.overview}`);

    const saveAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'saveFilm',
        message: 'Would you like to save this film data locally?',
        default: true
      }
    ]);

    if (saveAnswer.saveFilm) {
      await this.saveFilmData(film);
    } else {
      this.logInfo('Film data not saved');
    }
  }

  private async showDetailedFilmInfo(film: any): Promise<void> {
    try {
      // Get API key for detailed info
      const configManager = new ConfigManager();
      const apiKey = await configManager.getApiKey();

      if (!apiKey) {
        this.logWarning('Cannot get detailed info without API key');
        return;
      }

      const filmService = new FilmService(apiKey);
      const detailedFilm = await filmService.getFilmDetails({ id: film.id });

      // Display detailed information
      console.log('\n' + filmService.formatFilmForDisplay(detailedFilm));

      // Get image URLs
      const images = await filmService.getFilmImages(detailedFilm);
      if (images.poster || images.backdrop) {
        this.logInfo('\n🖼️  Available Images:');
        if (images.poster) this.logInfo(`  📱 Poster: ${images.poster}`);
        if (images.backdrop) this.logInfo(`  🖼️  Backdrop: ${images.backdrop}`);
      }

    } catch (error) {
      this.logWarning('Failed to get detailed film information');
      this.logDebug(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

    private async saveFilmData(film: any): Promise<void> {
    this.logInfo('Saving film data...');

    try {
      // Get detailed film information for saving
      const configManager = new ConfigManager();
      const apiKey = await configManager.getApiKey();

      if (!apiKey) {
        this.logWarning('Cannot save film data without API key');
        return;
      }

      const filmService = new FilmService(apiKey);
      const detailedFilm = await filmService.getFilmDetails({ id: film.id });

      // Save film data using storage service
      const storageService = new StorageService();
      const outputDir = await this.getOutputDirectory();
      const savedPath = await storageService.saveFilm(detailedFilm, outputDir);

      this.logSuccess('Film data saved successfully!');
      this.logInfo(`📁 Saved to: ${savedPath}`);

      // Show what was saved
      const savedFiles = await this.listSavedFiles(savedPath);
      this.logInfo('📄 Files saved:');
      savedFiles.forEach(file => {
        this.logInfo(`  ${file}`);
      });

    } catch (error) {
      this.logError('Failed to save film data');
      this.logDebug(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getOutputDirectory(): Promise<string | undefined> {
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      return config.user.defaultOutputDir;
    } catch {
      return undefined;
    }
  }

  private async listSavedFiles(dirPath: string): Promise<string[]> {
    try {
      const contents = FileHelpers.getDirectoryContents(dirPath);
      return contents.map(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        const size = (stats.size / 1024).toFixed(1);
        return `${file} (${size} KB)`;
      });
    } catch {
      return [];
    }
  }
}
