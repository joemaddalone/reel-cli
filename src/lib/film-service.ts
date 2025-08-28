import { TMDBClient } from './tmdb-client';
import { ConfigManager } from './config-manager';
import { Film, SearchResult, SearchParams, MovieDetailsParams, APIError } from '../types';
import ora from 'ora';

export class FilmService {
  private tmdbClient: TMDBClient;
  private configManager: ConfigManager;

  constructor(apiKey: string) {
    this.tmdbClient = new TMDBClient(apiKey);
    this.configManager = new ConfigManager();
  }

  /**
   * Search for films with loading indicator
   */
  public async searchFilms(params: SearchParams): Promise<SearchResult[]> {
    const spinner = ora('Searching TMDB for films...').start();

    try {
      const results = await this.tmdbClient.searchMovies(params);
      spinner.succeed(`Found ${results.length} film(s)`);
      return results;
    } catch (error) {
      spinner.fail('Search failed');
      throw error;
    }
  }

  /**
   * Get detailed film information with loading indicator
   */
  public async getFilmDetails(params: MovieDetailsParams): Promise<Film> {
    const spinner = ora('Fetching film details...').start();

    try {
      const film = await this.tmdbClient.getMovieDetails(params);
      spinner.succeed('Film details retrieved');
      return film;
    } catch (error) {
      spinner.fail('Failed to get film details');
      throw error;
    }
  }

  /**
   * Test API connection
   */
  public async testConnection(): Promise<boolean> {
    const spinner = ora('Testing TMDB API connection...').start();

    try {
      const isConnected = await this.tmdbClient.testConnection();
      if (isConnected) {
        spinner.succeed('TMDB API connection successful');
      } else {
        spinner.fail('TMDB API connection failed');
      }
      return isConnected;
    } catch (error) {
      spinner.fail('TMDB API connection failed');
      return false;
    }
  }

  /**
   * Get image URLs for a film
   */
  public async getFilmImages(film: Film): Promise<{ poster?: string; backdrop?: string }> {
    try {
      const config = await this.tmdbClient.getConfiguration();
      const userConfig = await this.configManager.loadConfig();

      // Determine image size based on user preference
      let posterSize = 'w500'; // default
      let backdropSize = 'w780'; // default

      switch (userConfig.user.imageQuality) {
        case 'low':
          posterSize = 'w185';
          backdropSize = 'w300';
          break;
        case 'medium':
          posterSize = 'w500';
          backdropSize = 'w780';
          break;
        case 'high':
          posterSize = 'w780';
          backdropSize = 'w1280';
          break;
      }

      return {
        poster: film.posterPath ? `${config.baseUrl}${posterSize}${film.posterPath}` : undefined,
        backdrop: film.backdropPath ? `${config.baseUrl}${backdropSize}${film.backdropPath}` : undefined
      } as { poster?: string; backdrop?: string };
    } catch (error) {
      // Return undefined if image URLs can't be generated
      return {};
    }
  }

  /**
   * Validate search parameters
   */
  public validateSearchParams(params: SearchParams): void {
    if (!params.query || params.query.trim().length === 0) {
      throw new APIError('Search query is required', 400, 'validation');
    }

    if (params.query.trim().length < 2) {
      throw new APIError('Search query must be at least 2 characters', 400, 'validation');
    }

    if (params.year && (params.year < 1888 || params.year > new Date().getFullYear() + 1)) {
      throw new APIError('Invalid year specified', 400, 'validation');
    }
  }

  /**
   * Format film data for display
   */
  public formatFilmForDisplay(film: Film): string {
    const lines = [
      `📽️  ${film.title}`,
      `📅 Release Date: ${film.releaseDate}`,
      `⭐ Rating: ${film.voteAverage}/10 (${film.voteCount} votes)`,
      `⏱️  Runtime: ${film.runtime} minutes`,
      `📝 Overview: ${film.overview}`,
      `🎭 Genres: ${film.genres.map(g => g.name).join(', ')}`,
      `💰 Budget: $${film.budget.toLocaleString()}`,
      `💵 Revenue: $${film.revenue.toLocaleString()}`,
      `🏢 Production Companies: ${film.productionCompanies.map(c => c.name).join(', ')}`,
      `🌍 Countries: ${film.productionCountries.map(c => c.name).join(', ')}`,
      `🗣️  Languages: ${film.spokenLanguages.map(l => l.name).join(', ')}`
    ];

    if (film.tagline) {
      lines.splice(2, 0, `💬 Tagline: "${film.tagline}"`);
    }

    if (film.imdbId) {
      lines.push(`🔗 IMDB: https://www.imdb.com/title/${film.imdbId}`);
    }

    if (film.homepage) {
      lines.push(`🌐 Homepage: ${film.homepage}`);
    }

    return lines.join('\n');
  }
}
