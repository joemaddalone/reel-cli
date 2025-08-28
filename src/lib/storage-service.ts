import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { Film, FileSystemError } from '../types';
import { FileHelpers } from '../utils/file-helpers';
import { ConfigManager } from './config-manager';

export class StorageService {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
  }

  /**
   * Save complete film data to local storage
   */
  public async saveFilm(film: Film, outputDir?: string): Promise<string> {
    try {
      // Get configuration
      const config = await this.configManager.loadConfig();
      const baseOutputDir = outputDir || config.user.defaultOutputDir;

      // Create film directory
      const filmDirName = FileHelpers.createFilmDirectoryName(film.id, film.title);
      const filmDir = path.resolve(baseOutputDir, filmDirName);

      // Ensure directory exists
      FileHelpers.ensureDirectoryExists(filmDir);

      // Save film data as JSON
      const dataPath = path.join(filmDir, 'data.json');
      FileHelpers.writeJsonFile(dataPath, film);

      // Save human-readable metadata
      const metadataPath = path.join(filmDir, 'metadata.txt');
      const metadata = this.generateMetadataText(film);
      FileHelpers.writeTextFile(metadataPath, metadata);

      // Download images if enabled
      if (config.user.downloadImages) {
        await this.downloadFilmImages(film, filmDir);
      }

      return filmDir;
    } catch (error) {
      throw new FileSystemError(
        `Failed to save film data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        outputDir || 'unknown',
        'save',
        { filmId: film.id, filmTitle: film.title, error }
      );
    }
  }

  /**
   * Download film images (poster and backdrop)
   */
  private async downloadFilmImages(film: Film, filmDir: string): Promise<void> {
    const downloads: Promise<void>[] = [];

    // Download poster
    if (film.posterPath) {
      const posterUrl = await this.buildImageUrl(film.posterPath, 'w500');
      if (posterUrl) {
        const posterPath = path.join(filmDir, 'poster.jpg');
        downloads.push(this.downloadImage(posterUrl, posterPath, 'poster'));
      }
    }

    // Download backdrop
    if (film.backdropPath) {
      const backdropUrl = await this.buildImageUrl(film.backdropPath, 'w780');
      if (backdropUrl) {
        const backdropPath = path.join(filmDir, 'backdrop.jpg');
        downloads.push(this.downloadImage(backdropUrl, backdropPath, 'backdrop'));
      }
    }

    // Wait for all downloads to complete
    if (downloads.length > 0) {
      await Promise.allSettled(downloads);
    }
  }

  /**
   * Download a single image from URL
   */
  private async downloadImage(url: string, filePath: string, imageType: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);

      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${imageType}: HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(filePath, () => {}); // Delete the file on error
          reject(err);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Build image URL with appropriate size
   */
  private async buildImageUrl(imagePath: string, size: string): Promise<string> {
    const config = await this.configManager.loadConfig();
    const baseUrl = 'https://image.tmdb.org/t/p/';

    // Determine image size based on user preference
    let finalSize = size;

    switch (config.user.imageQuality) {
      case 'low':
        finalSize = size === 'w500' ? 'w185' : 'w300';
        break;
      case 'medium':
        finalSize = size === 'w500' ? 'w500' : 'w780';
        break;
      case 'high':
        finalSize = size === 'w500' ? 'w780' : 'w1280';
        break;
    }

    return `${baseUrl}${finalSize}${imagePath}`;
  }

  /**
   * Generate human-readable metadata text
   */
  private generateMetadataText(film: Film): string {
    const lines = [
      `Film: ${film.title}`,
      `Original Title: ${film.originalTitle}`,
      `Release Date: ${film.releaseDate}`,
      `Runtime: ${film.runtime} minutes`,
      `Rating: ${film.voteAverage}/10 (${film.voteCount} votes)`,
      `Popularity: ${film.popularity}`,
      `Status: ${film.status}`,
      '',
      'Overview:',
      film.overview,
      '',
      'Genres:',
      film.genres.map(g => `- ${g.name}`).join('\n'),
      '',
      'Production Companies:',
      film.productionCompanies.map(c => `- ${c.name} (${c.originCountry})`).join('\n'),
      '',
      'Production Countries:',
      film.productionCountries.map(c => `- ${c.name}`).join('\n'),
      '',
      'Spoken Languages:',
      film.spokenLanguages.map(l => `- ${l.name} (${l.englishName})`).join('\n'),
      ''
    ];

    if (film.tagline) {
      lines.splice(8, 0, `Tagline: "${film.tagline}"`, '');
    }

    if (film.budget > 0) {
      lines.push(`Budget: $${film.budget.toLocaleString()}`);
    }

    if (film.revenue > 0) {
      lines.push(`Revenue: $${film.revenue.toLocaleString()}`);
    }

    if (film.imdbId) {
      lines.push(`IMDB: https://www.imdb.com/title/${film.imdbId}`);
    }

    if (film.homepage) {
      lines.push(`Homepage: ${film.homepage}`);
    }

    lines.push('', `Data retrieved on: ${new Date().toISOString()}`);

    return lines.join('\n');
  }

  /**
   * List all saved films
   */
  public async listSavedFilms(outputDir?: string): Promise<string[]> {
    try {
      const config = await this.configManager.loadConfig();
      const baseOutputDir = outputDir || config.user.defaultOutputDir;

      if (!FileHelpers.directoryExists(baseOutputDir)) {
        return [];
      }

      const contents = FileHelpers.getDirectoryContents(baseOutputDir);
      return contents.filter(item => {
        const itemPath = path.join(baseOutputDir, item);
        return FileHelpers.directoryExists(itemPath) &&
               FileHelpers.fileExists(path.join(itemPath, 'data.json'));
      });
    } catch (error) {
      throw new FileSystemError(
        `Failed to list saved films: ${error instanceof Error ? error.message : 'Unknown error'}`,
        outputDir || 'unknown',
        'list',
        { error }
      );
    }
  }

  /**
   * Get saved film data
   */
  public async getSavedFilm(filmDirName: string, outputDir?: string): Promise<Film | null> {
    try {
      const config = await this.configManager.loadConfig();
      const baseOutputDir = outputDir || config.user.defaultOutputDir;
      const filmDir = path.join(baseOutputDir, filmDirName);
      const dataPath = path.join(filmDir, 'data.json');

      if (!FileHelpers.fileExists(dataPath)) {
        return null;
      }

      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data) as Film;
    } catch (error) {
      throw new FileSystemError(
        `Failed to get saved film: ${error instanceof Error ? error.message : 'Unknown error'}`,
        filmDirName,
        'read',
        { error }
      );
    }
  }

  /**
   * Delete saved film data
   */
  public async deleteFilm(filmDirName: string, outputDir?: string): Promise<void> {
    try {
      const config = await this.configManager.loadConfig();
      const baseOutputDir = outputDir || config.user.defaultOutputDir;
      const filmDir = path.join(baseOutputDir, filmDirName);

      if (FileHelpers.directoryExists(filmDir)) {
        FileHelpers.removeDirectory(filmDir);
      }
    } catch (error) {
      throw new FileSystemError(
        `Failed to delete film: ${error instanceof Error ? error.message : 'Unknown error'}`,
        filmDirName,
        'delete',
        { error }
      );
    }
  }

  /**
   * Get storage statistics
   */
  public async getStorageStats(outputDir?: string): Promise<{
    totalFilms: number;
    totalSize: number;
    averageSize: number;
  }> {
    try {
      const config = await this.configManager.loadConfig();
      const baseOutputDir = outputDir || config.user.defaultOutputDir;

      if (!FileHelpers.directoryExists(baseOutputDir)) {
        return { totalFilms: 0, totalSize: 0, averageSize: 0 };
      }

      const filmDirs = await this.listSavedFilms(outputDir);
      let totalSize = 0;

      for (const filmDir of filmDirs) {
        const fullPath = path.join(baseOutputDir, filmDir);
        const contents = FileHelpers.getDirectoryContents(fullPath);

        for (const file of contents) {
          const filePath = path.join(fullPath, file);
          if (FileHelpers.fileExists(filePath)) {
            totalSize += FileHelpers.getFileSize(filePath);
          }
        }
      }

      return {
        totalFilms: filmDirs.length,
        totalSize,
        averageSize: filmDirs.length > 0 ? totalSize / filmDirs.length : 0
      };
    } catch (error) {
      throw new FileSystemError(
        `Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        outputDir || 'unknown',
        'stats',
        { error }
      );
    }
  }
}
