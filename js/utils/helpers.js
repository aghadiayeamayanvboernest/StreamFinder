let genreData = { movie: [], tv: [] };
let genreMap = new Map();

// Load genre data and build the lookup map
async function loadGenres() {
  try {
    const res = await fetch('./data/genres.json');
    genreData = await res.json();
    // Build the lookup map after data is loaded
    genreMap = new Map();
    [...genreData.movie, ...genreData.tv].forEach(g => {
      if (!genreMap.has(g.id)) genreMap.set(g.id, g.name);
    });
  } catch { /* use empty defaults */ }
}

// Export promise so other modules can wait for genres
export const genresReady = loadGenres();

// Debounce utility
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getGenreName(id) {
  return genreMap.get(id) || 'Unknown';
}

export function getGenreNames(ids = []) {
  return ids.map(id => getGenreName(id));
}

export function getAllGenres() {
  return genreData;
}

// Normalize TMDB movie/tv result into a unified format
export function normalizeTMDB(item, type) {
  const isMovie = type === 'movie';
  return {
    id: item.id,
    source: 'tmdb',
    type: isMovie ? 'movie' : 'tv',
    title: isMovie ? item.title : item.name,
    overview: item.overview || '',
    poster: item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : null,
    posterSmall: item.poster_path
      ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
      : null,
    backdrop: item.backdrop_path
      ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
      : null,
    date: isMovie ? item.release_date : item.first_air_date,
    year: (isMovie ? item.release_date : item.first_air_date)?.slice(0, 4) || '',
    rating: item.vote_average || 0,
    voteCount: item.vote_count || 0,
    popularity: item.popularity || 0,
    genreIds: item.genre_ids || (item.genres ? item.genres.map(g => g.id) : []),
    language: item.original_language || '',
  };
}

// Normalize TVMaze result into the same unified format
export function normalizeTVMaze(item) {
  const show = item.show || item;
  return {
    id: show.id,
    source: 'tvmaze',
    type: 'tv',
    title: show.name || '',
    overview: show.summary ? show.summary.replace(/<[^>]+>/g, '') : '',
    poster: show.image?.original || show.image?.medium || null,
    posterSmall: show.image?.medium || null,
    backdrop: null,
    date: show.premiered || '',
    year: show.premiered?.slice(0, 4) || '',
    rating: show.rating?.average || 0,
    voteCount: 0,
    popularity: show.weight || 0,
    genreIds: [],
    genreNames: show.genres || [],
    language: show.language || '',
    network: show.network?.name || show.webChannel?.name || '',
    status: show.status || '',
    runtime: show.runtime || show.averageRuntime || 0,
    tvmazeId: show.id,
  };
}

// Format date to readable string
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Format rating display
export function formatRating(rating) {
  if (!rating) return 'N/A';
  return Number(rating).toFixed(1);
}

// Truncate text
export function truncate(text, max = 200) {
  if (!text || text.length <= max) return text || '';
  return text.slice(0, max).trimEnd() + '...';
}

// Get URL search params
export function getParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

// Placeholder poster
export const PLACEHOLDER_POSTER = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" fill="#1F1F1F">
    <rect width="300" height="450"/>
    <text x="150" y="225" text-anchor="middle" fill="#808080" font-family="sans-serif" font-size="14">No Image</text>
  </svg>`
);
