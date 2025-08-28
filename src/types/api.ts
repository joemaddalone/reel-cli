export interface TMDBConfig {
  images: {
    baseUrl: string;
    secureBaseUrl: string;
    backdropSizes: string[];
    logoSizes: string[];
    posterSizes: string[];
    profileSizes: string[];
    stillSizes: string[];
  };
  changeKeys: string[];
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  totalPages: number;
  totalResults: number;
}

export interface TMDBError {
  statusCode: number;
  statusMessage: string;
  success: boolean;
}

export interface SearchParams {
  query: string;
  page?: number;
  includeAdult?: boolean;
  year?: number | undefined;
  primaryReleaseYear?: number | undefined;
}

export interface MovieDetailsParams {
  id: number;
  appendToResponse?: string[];
  language?: string;
}

export interface ImageConfig {
  baseUrl: string;
  posterSizes: string[];
  backdropSizes: string[];
}

export interface ImageUrls {
  poster?: string;
  backdrop?: string;
  logo?: string;
}
