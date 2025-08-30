import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { BaseCommand } from './base-command';
import { StorageService } from '../lib/storage-service';
import { ConfigManager } from '../lib/config-manager';

export class ListCommand extends BaseCommand {
  protected createCommand(): Command {
    return new Command('list')
      .description('List all saved films and manage storage')
      .option('-o, --output <path>', 'Output directory to list films from')
      .option('-s, --stats', 'Show storage statistics')
      .option('-d, --delete', 'Delete a film')
      .action(async (options) => {
        await this.runWithErrorHandling(options);
      });
  }

  protected async execute(options: any): Promise<void> {
    const storageService = new StorageService();
    const outputDir = options.output;

    if (options.stats) {
      await this.showStorageStats(storageService, outputDir);
      return;
    }

    if (options.delete) {
      await this.deleteFilm(storageService, outputDir);
      return;
    }

    // Default: list films
    await this.listFilms(storageService, outputDir);
  }

  private async listFilms(storageService: StorageService, outputDir?: string): Promise<void> {
    this.logInfo('Listing saved films...\n');

    try {
      const films = await storageService.listSavedFilms(outputDir);

      if (films.length === 0) {
        this.logWarning('No films found in storage');
        this.logInfo('Use "reel search <title>" to search and save films');
        return;
      }

      this.logSuccess(`Found ${films.length} saved film(s):\n`);

      // Display films in a table format
      films.forEach((filmDir, index) => {
        const filmName = this.extractFilmName(filmDir);
        console.log(`${chalk.cyan(`${index + 1}.`)} ${chalk.bold(filmName)}`);
        console.log(`   📁 ${chalk.gray(filmDir)}`);
        console.log('');
      });

      // Show options
      await this.showFilmOptions(storageService, films, outputDir);

    } catch (error) {
      this.logError('Failed to list films');
      this.logDebug(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async showFilmOptions(storageService: StorageService, films: string[], outputDir?: string): Promise<void> {
    const choices = [
      { name: 'View film details', value: 'view' },
      { name: 'Delete a film', value: 'delete' },
      { name: 'Show storage statistics', value: 'stats' },
      { name: 'Exit', value: 'exit' }
    ];

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices
      }
    ]);

    switch (answer.action) {
      case 'view':
        await this.viewFilmDetails(storageService, films, outputDir);
        break;
      case 'delete':
        await this.deleteFilm(storageService, outputDir);
        break;
      case 'stats':
        await this.showStorageStats(storageService, outputDir);
        break;
      case 'exit':
        this.logInfo('Goodbye!');
        break;
    }
  }

  private async viewFilmDetails(storageService: StorageService, films: string[], outputDir?: string): Promise<void> {
    if (films.length === 0) {
      this.logWarning('No films to view');
      return;
    }

    const choices = films.map((filmDir, index) => ({
      name: `${index + 1}. ${this.extractFilmName(filmDir)}`,
      value: index
    }));

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedFilm',
        message: 'Select a film to view details:',
        choices
      }
    ]);

    const selectedFilmDir = films[answer.selectedFilm];
    await this.displayFilmDetails(storageService, selectedFilmDir, outputDir);
  }

  private async displayFilmDetails(storageService: StorageService, filmDir: string, outputDir?: string): Promise<void> {
    try {
      const film = await storageService.getSavedFilm(filmDir, outputDir);

      if (!film) {
        this.logWarning('Film data not found or corrupted');
        return;
      }

      console.log('\n' + chalk.cyan('📽️  Film Details'));
      console.log(chalk.gray('='.repeat(50)));
      console.log(`Title: ${chalk.bold(film.title)}`);
      console.log(`Original Title: ${film.originalTitle}`);
      console.log(`Release Date: ${film.releaseDate}`);
      console.log(`Runtime: ${film.runtime} minutes`);
      console.log(`Rating: ${film.voteAverage}/10 (${film.voteCount} votes)`);
      console.log(`Popularity: ${film.popularity}`);
      console.log(`Status: ${film.status}`);

      if (film.tagline) {
        console.log(`Tagline: "${film.tagline}"`);
      }

      console.log(`\nOverview: ${film.overview}`);

      if (film.genres.length > 0) {
        console.log(`\nGenres: ${film.genres.map(g => g.name).join(', ')}`);
      }

      if (film.budget > 0) {
        console.log(`Budget: $${film.budget.toLocaleString()}`);
      }

      if (film.revenue > 0) {
        console.log(`Revenue: $${film.revenue.toLocaleString()}`);
      }

      if (film.imdbId) {
        console.log(`IMDB: https://www.imdb.com/title/${film.imdbId}`);
      }

      console.log(chalk.gray('='.repeat(50)));

    } catch (error) {
      this.logError('Failed to display film details');
      this.logDebug(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async deleteFilm(storageService: StorageService, outputDir?: string): Promise<void> {
    try {
      const films = await storageService.listSavedFilms(outputDir);

      if (films.length === 0) {
        this.logWarning('No films to delete');
        return;
      }

      const choices = films.map((filmDir, index) => ({
        name: `${index + 1}. ${this.extractFilmName(filmDir)}`,
        value: filmDir
      }));

      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedFilm',
          message: 'Select a film to delete:',
          choices
        }
      ]);

      const confirmAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to delete "${this.extractFilmName(answer.selectedFilm)}"?`,
          default: false
        }
      ]);

      if (confirmAnswer.confirm) {
        await storageService.deleteFilm(answer.selectedFilm, outputDir);
        this.logSuccess('Film deleted successfully');
      } else {
        this.logInfo('Deletion cancelled');
      }

    } catch (error) {
      this.logError('Failed to delete film');
      this.logDebug(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async showStorageStats(storageService: StorageService, outputDir?: string): Promise<void> {
    this.logInfo('Getting storage statistics...\n');

    try {
      const stats = await storageService.getStorageStats(outputDir);

      console.log(chalk.cyan('📊 Storage Statistics'));
      console.log(chalk.gray('='.repeat(30)));
      console.log(`Total Films: ${chalk.bold(stats.totalFilms)}`);
      console.log(`Total Size: ${chalk.bold(this.formatBytes(stats.totalSize))}`);
      console.log(`Average Size: ${chalk.bold(this.formatBytes(stats.averageSize))}`);
      console.log(chalk.gray('='.repeat(30)));

      if (stats.totalFilms > 0) {
        const configManager = new ConfigManager();
        const config = await configManager.loadConfig();
        const baseDir = outputDir || config.user.defaultOutputDir;
        this.logInfo(`Storage location: ${baseDir}`);
      }

    } catch (error) {
      this.logError('Failed to get storage statistics');
      this.logDebug(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractFilmName(filmDir: string): string {
    // Extract film name from directory (remove ID suffix)
    const parts = filmDir.split('-');
    if (parts.length > 1) {
      return parts.slice(0, -1).join('-');
    }
    return filmDir;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
