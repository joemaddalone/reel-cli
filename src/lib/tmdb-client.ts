import { MovieDb } from 'moviedb-promise';
import {
  Film,
  SearchResult,
  SearchParams,
  MovieDetailsParams,
  APIError
} from '../types';

export class TMDBClient {
  private client: MovieDb;
  private imageBaseUrl: string = 'https://image.tmdb.org/t/p/';

  constructor(apiKey: string) {
    this.client = new MovieDb(apiKey);
  }

  /**
   * Search for films by title
   */
  public async searchMovies(params: SearchParams): Promise<SearchResult[]> {
    try {
      const searchParams: any = {
        query: params.query,
        page: params.page || 1,
        include_adult: params.includeAdult || false
      };

      if (params.year !== undefined) {
        searchParams.year = params.year;
      }

      if (params.primaryReleaseYear !== undefined) {
        searchParams.primary_release_year = params.primaryReleaseYear;
      }

      const response = await this.client.searchMovie(searchParams);

      if (!response.results) {
        return [];
      }

      return response.results.map((movie: any) => ({
        id: movie.id,
        title: movie.title || 'Unknown Title',
        releaseDate: movie.release_date || 'Unknown Date',
        posterPath: movie.poster_path,
        overview: movie.overview || 'No overview available',
        voteAverage: movie.vote_average || 0,
        voteCount: movie.vote_count || 0,
        popularity: movie.popularity || 0,
        adult: movie.adult || false,
        video: movie.video || false
      }));
    } catch (error) {
      throw new APIError(
        `Failed to search movies: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'search/movie',
        { query: params.query, error }
      );
    }
  }

  /**
   * Get detailed information about a specific film
   */
  public async getMovieDetails(params: MovieDetailsParams): Promise<Film> {
    try {
      const movie = await this.client.movieInfo({
        id: params.id,
        append_to_response: params.appendToResponse?.join(',') || 'credits,images,videos',
        language: params.language || 'en-US'
      });

      if (!movie.id) {
        throw new APIError('Movie not found', 404, `movie/${params.id}`);
      }

      return {
        id: movie.id,
        title: movie.title || 'Unknown Title',
        originalTitle: movie.original_title || movie.title || 'Unknown Title',
        overview: movie.overview || 'No overview available',
        releaseDate: movie.release_date || 'Unknown Date',
        posterPath: movie.poster_path || undefined,
        backdropPath: movie.backdrop_path || undefined,
        genres: (movie.genres || []).map((genre: any) => ({
          id: genre.id,
          name: genre.name
        })),
        runtime: movie.runtime || 0,
        voteAverage: movie.vote_average || 0,
        voteCount: movie.vote_count || 0,
        popularity: movie.popularity || 0,
        status: movie.status || 'Unknown',
        tagline: movie.tagline || '',
        budget: movie.budget || 0,
        revenue: movie.revenue || 0,
        productionCompanies: (movie.production_companies || []).map((company: any) => ({
          id: company.id,
          name: company.name,
          logoPath: company.logo_path,
          originCountry: company.origin_country
        })),
        productionCountries: (movie.production_countries || []).map((country: any) => ({
          iso31661: country.iso_3166_1,
          name: country.name
        })),
        spokenLanguages: (movie.spoken_languages || []).map((lang: any) => ({
          englishName: lang.english_name,
          iso6391: lang.iso_639_1,
          name: lang.name
        })),
        adult: movie.adult || false,
        video: movie.video || false,
        originalLanguage: movie.original_language || 'en',
        imdbId: movie.imdb_id,
        homepage: movie.homepage
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        `Failed to get movie details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        `movie/${params.id}`,
        { id: params.id, error }
      );
    }
  }

  /**
   * Get configuration for image URLs
   */
  public async getConfiguration(): Promise<{ baseUrl: string; posterSizes: string[]; backdropSizes: string[] }> {
    try {
      const config = await this.client.configuration();

      return {
        baseUrl: config.images?.base_url || this.imageBaseUrl,
        posterSizes: config.images?.poster_sizes || ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
        backdropSizes: config.images?.backdrop_sizes || ['w300', 'w780', 'w1280', 'original']
      };
    } catch (error) {
      // Return default configuration if API call fails
      return {
        baseUrl: this.imageBaseUrl,
        posterSizes: ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
        backdropSizes: ['w300', 'w780', 'w1280', 'original']
      };
    }
  }

  /**
   * Build image URL for a given path and size
   */
  public async buildImageUrl(path: string | null | undefined, size: string = 'w500'): Promise<string | null> {
    if (!path) return null;

    const config = await this.getConfiguration();
    const baseUrl = config.baseUrl || this.imageBaseUrl;

    return `${baseUrl}${size}${path}`;
  }

  /**
   * Test API connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.getConfiguration();
      return true;
    } catch {
      return false;
    }
  }
}
