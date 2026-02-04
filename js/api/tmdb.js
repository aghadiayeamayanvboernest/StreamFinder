const BASE = 'https://api.themoviedb.org/3';
// TODO: Replace with your TMDB API key
const API_KEY = 'a5bf190f66c1a554ef472f806720e73d';

async function tmdbFetch(path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('api_key', API_KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

// Search movies
export async function searchMovies(query, page = 1) {
  return tmdbFetch('/search/movie', { query, page });
}

// Search TV shows
export async function searchTV(query, page = 1) {
  return tmdbFetch('/search/tv', { query, page });
}

// Multi-search (movies + TV + people)
export async function searchMulti(query, page = 1) {
  return tmdbFetch('/search/multi', { query, page });
}

// Trending (day or week)
export async function getTrending(mediaType = 'all', timeWindow = 'day') {
  return tmdbFetch(`/trending/${mediaType}/${timeWindow}`);
}

// Top rated movies
export async function getTopRatedMovies(page = 1) {
  return tmdbFetch('/movie/top_rated', { page });
}

// Popular TV shows
export async function getPopularTV(page = 1) {
  return tmdbFetch('/tv/popular', { page });
}

// Movie details
export async function getMovieDetails(id) {
  return tmdbFetch(`/movie/${id}`);
}

// TV show details
export async function getTVDetails(id) {
  return tmdbFetch(`/tv/${id}`);
}

// Movie credits (cast)
export async function getMovieCredits(id) {
  return tmdbFetch(`/movie/${id}/credits`);
}

// TV credits (cast)
export async function getTVCredits(id) {
  return tmdbFetch(`/tv/${id}/credits`);
}

// Similar movies
export async function getSimilarMovies(id) {
  return tmdbFetch(`/movie/${id}/similar`);
}

// Similar TV shows
export async function getSimilarTV(id) {
  return tmdbFetch(`/tv/${id}/similar`);
}

// Discover movies by genre
export async function discoverMovies(params = {}) {
  return tmdbFetch('/discover/movie', {
    sort_by: params.sort_by || 'popularity.desc',
    with_genres: params.genre,
    'vote_average.gte': params.minRating,
    'primary_release_date.gte': params.yearFrom ? `${params.yearFrom}-01-01` : undefined,
    'primary_release_date.lte': params.yearTo ? `${params.yearTo}-12-31` : undefined,
    page: params.page || 1,
  });
}

// Discover TV by genre
export async function discoverTV(params = {}) {
  return tmdbFetch('/discover/tv', {
    sort_by: params.sort_by || 'popularity.desc',
    with_genres: params.genre,
    'vote_average.gte': params.minRating,
    'first_air_date.gte': params.yearFrom ? `${params.yearFrom}-01-01` : undefined,
    'first_air_date.lte': params.yearTo ? `${params.yearTo}-12-31` : undefined,
    page: params.page || 1,
  });
}

// Upcoming movies
export async function getUpcoming(page = 1) {
  return tmdbFetch('/movie/upcoming', { page });
}

// Get movie videos (trailers, teasers, etc.)
export async function getMovieVideos(id) {
  return tmdbFetch(`/movie/${id}/videos`);
}

// Get TV show videos
export async function getTVVideos(id) {
  return tmdbFetch(`/tv/${id}/videos`);
}

// Get movie watch providers (streaming availability)
export async function getMovieWatchProviders(id) {
  return tmdbFetch(`/movie/${id}/watch/providers`);
}

// Get TV watch providers
export async function getTVWatchProviders(id) {
  return tmdbFetch(`/tv/${id}/watch/providers`);
}
