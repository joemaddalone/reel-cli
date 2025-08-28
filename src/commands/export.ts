import { Command } from 'commander';
import inquirer from 'inquirer';

import * as fs from 'fs';
import * as path from 'path';
import { BaseCommand } from './base-command';
import { StorageService } from '../lib/storage-service';
import { ConfigManager } from '../lib/config-manager';

export class ExportCommand extends BaseCommand {
  protected createCommand(): Command {
    return new Command('export')
      .description('Export saved film data to different formats or locations')
      .option('-o, --output <path>', 'Output directory to export from')
      .option('-d, --destination <path>', 'Destination directory for export')
      .option('-f, --format <format>', 'Export format (json|csv|txt)')
      .action(async (options) => {
        await this.runWithErrorHandling(options);
      });
  }

  protected async execute(options: any): Promise<void> {
    const storageService = new StorageService();
    const sourceDir = options.output;
    const destinationDir = options.destination;
    const format = options.format;

    if (format && !['json', 'csv', 'txt'].includes(format)) {
      this.logError('Invalid format. Supported formats: json, csv, txt');
      return;
    }

    await this.exportFilms(storageService, sourceDir, destinationDir, format);
  }

  private async exportFilms(
    storageService: StorageService,
    sourceDir?: string,
    destinationDir?: string,
    format?: string
  ): Promise<void> {
    this.logInfo('Exporting film data...\n');

    try {
      // Get list of saved films
      const films = await storageService.listSavedFilms(sourceDir);

      if (films.length === 0) {
        this.logWarning('No films found to export');
        this.logInfo('Use "reel search <title>" to search and save films first');
        return;
      }

      this.logSuccess(`Found ${films.length} film(s) to export`);

      // Get export options if not provided
      const exportOptions = await this.getExportOptions(films, destinationDir, format);

      // Create destination directory
      if (!fs.existsSync(exportOptions.destination)) {
        fs.mkdirSync(exportOptions.destination, { recursive: true });
      }

      // Export films
      const exportedFiles = await this.performExport(storageService, films, exportOptions, sourceDir);

      this.logSuccess('Export completed successfully!');
      this.logInfo(`📁 Exported to: ${exportOptions.destination}`);
      this.logInfo(`📄 Files created: ${exportedFiles.length}`);

      exportedFiles.forEach(file => {
        this.logInfo(`  ${file}`);
      });

    } catch (error) {
      this.logError('Export failed');
      this.logDebug(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getExportOptions(_films: string[], destinationDir?: string, format?: string): Promise<{
    destination: string;
    format: string;
    includeImages: boolean;
  }> {
    let destination = destinationDir;
    let exportFormat = format;
    let includeImages = false;

    if (!destination) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'destination',
          message: 'Export destination directory:',
          default: './exported-films'
        }
      ]);
      destination = answer.destination;
    }

    if (!exportFormat) {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'format',
          message: 'Export format:',
          choices: [
            { name: 'JSON (structured data)', value: 'json' },
            { name: 'CSV (spreadsheet compatible)', value: 'csv' },
            { name: 'Text (human readable)', value: 'txt' }
          ]
        }
      ]);
      exportFormat = answer.format;
    }

    if (exportFormat === 'json') {
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'includeImages',
          message: 'Include image files in export?',
          default: false
        }
      ]);
      includeImages = answer.includeImages;
    }

    return {
      destination: destination!,
      format: exportFormat!,
      includeImages
    };
  }

  private async performExport(
    storageService: StorageService,
    films: string[],
    options: { destination: string; format: string; includeImages: boolean },
    sourceDir?: string
  ): Promise<string[]> {
    const exportedFiles: string[] = [];
    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();

    // Create a summary file
    const summaryPath = path.join(options.destination, `films-summary.${options.format}`);
    const summary = await this.generateSummary(films, options.format);
    fs.writeFileSync(summaryPath, summary);
    exportedFiles.push(`films-summary.${options.format}`);

    // Export individual films
    for (const filmDir of films) {
      const film = await storageService.getSavedFilm(filmDir, sourceDir);
      if (!film) continue;

      const fileName = this.sanitizeFileName(film.title);
      const filePath = path.join(options.destination, `${fileName}.${options.format}`);

      let content = '';
      switch (options.format) {
        case 'json':
          content = JSON.stringify(film, null, 2);
          break;
        case 'csv':
          content = this.convertToCSV(film);
          break;
        case 'txt':
          content = this.convertToText(film);
          break;
      }

      fs.writeFileSync(filePath, content);
      exportedFiles.push(`${fileName}.${options.format}`);

      // Copy images if requested
      if (options.includeImages && options.format === 'json') {
        const sourceFilmDir = path.join(sourceDir || config.user.defaultOutputDir, filmDir);
        const imageDir = path.join(options.destination, `${fileName}-images`);

        if (fs.existsSync(sourceFilmDir)) {
          fs.mkdirSync(imageDir, { recursive: true });

          const imageFiles = ['poster.jpg', 'backdrop.jpg'];
          for (const imageFile of imageFiles) {
            const sourcePath = path.join(sourceFilmDir, imageFile);
            const destPath = path.join(imageDir, imageFile);

            if (fs.existsSync(sourcePath)) {
              fs.copyFileSync(sourcePath, destPath);
              exportedFiles.push(`${fileName}-images/${imageFile}`);
            }
          }
        }
      }
    }

    return exportedFiles;
  }

  private async generateSummary(films: string[], format: string): Promise<string> {
    const filmNames = films.map(dir => this.extractFilmName(dir));

    switch (format) {
      case 'json':
        return JSON.stringify({
          totalFilms: films.length,
          films: filmNames,
          exportDate: new Date().toISOString()
        }, null, 2);

      case 'csv':
        return `Title\n${filmNames.join('\n')}`;

      case 'txt':
        return `Film Export Summary\n${'='.repeat(30)}\nTotal Films: ${films.length}\n\n${filmNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}\n\nExported on: ${new Date().toLocaleString()}`;

      default:
        return '';
    }
  }

  private convertToCSV(film: any): string {
    const headers = ['Title', 'Original Title', 'Release Date', 'Runtime', 'Rating', 'Vote Count', 'Overview', 'Genres', 'Budget', 'Revenue'];
    const values = [
      film.title,
      film.originalTitle,
      film.releaseDate,
      film.runtime,
      film.voteAverage,
      film.voteCount,
      `"${film.overview.replace(/"/g, '""')}"`,
      film.genres.map((g: any) => g.name).join('; '),
      film.budget,
      film.revenue
    ];

    return `${headers.join(',')}\n${values.join(',')}`;
  }

  private convertToText(film: any): string {
    return `Film: ${film.title}
Original Title: ${film.originalTitle}
Release Date: ${film.releaseDate}
Runtime: ${film.runtime} minutes
Rating: ${film.voteAverage}/10 (${film.voteCount} votes)
Popularity: ${film.popularity}
Status: ${film.status}

Overview:
${film.overview}

Genres: ${film.genres.map((g: any) => g.name).join(', ')}

Production Companies: ${film.productionCompanies.map((c: any) => c.name).join(', ')}

Production Countries: ${film.productionCountries.map((c: any) => c.name).join(', ')}

Spoken Languages: ${film.spokenLanguages.map((l: any) => l.name).join(', ')}

Budget: $${film.budget.toLocaleString()}
Revenue: $${film.revenue.toLocaleString()}

IMDB: ${film.imdbId ? `https://www.imdb.com/title/${film.imdbId}` : 'N/A'}
Homepage: ${film.homepage || 'N/A'}

Exported on: ${new Date().toLocaleString()}`;
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  private extractFilmName(filmDir: string): string {
    const parts = filmDir.split('-');
    if (parts.length > 1) {
      return parts.slice(1).join('-');
    }
    return filmDir;
  }
}
