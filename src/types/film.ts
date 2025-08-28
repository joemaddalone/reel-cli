export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logoPath?: string;
  originCountry: string;
}

export interface ProductionCountry {
  iso31661: string;
  name: string;
}

export interface SpokenLanguage {
  englishName: string;
  iso6391: string;
  name: string;
}

export interface Film {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  releaseDate: string;
  posterPath?: string | undefined;
  backdropPath?: string | undefined;
  genres: Genre[];
  runtime: number;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  productionCompanies: ProductionCompany[];
  productionCountries: ProductionCountry[];
  spokenLanguages: SpokenLanguage[];
  adult: boolean;
  video: boolean;
  originalLanguage: string;
  imdbId?: string | undefined;
  homepage?: string | undefined;
}

export interface SearchResult {
  id: number;
  title: string;
  releaseDate: string;
  posterPath?: string;
  overview: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  adult: boolean;
  video: boolean;
}

export interface FilmCollection {
  id: number;
  name: string;
  overview: string;
  posterPath?: string;
  backdropPath?: string;
  parts: Film[];
}
