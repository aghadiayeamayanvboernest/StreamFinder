const BASE = 'https://api.tvmaze.com';

async function tvmazeFetch(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`TVMaze error: ${res.status}`);
  return res.json();
}

// Search TV shows
export async function searchShows(query) {
  return tvmazeFetch(`/search/shows?q=${encodeURIComponent(query)}`);
}

// Get show details by ID
export async function getShow(id) {
  return tvmazeFetch(`/shows/${id}`);
}

// Get show with embedded episodes
export async function getShowWithEpisodes(id) {
  return tvmazeFetch(`/shows/${id}?embed=episodes`);
}

// Get show seasons
export async function getSeasons(showId) {
  return tvmazeFetch(`/shows/${showId}/seasons`);
}

// Get episodes for a season
export async function getSeasonEpisodes(seasonId) {
  return tvmazeFetch(`/seasons/${seasonId}/episodes`);
}

// Get all episodes for a show
export async function getEpisodes(showId) {
  return tvmazeFetch(`/shows/${showId}/episodes`);
}

// Get show cast
export async function getCast(showId) {
  return tvmazeFetch(`/shows/${showId}/cast`);
}

// Get schedule (what's airing today)
export async function getSchedule(country = 'US', date = '') {
  const params = date ? `?country=${country}&date=${date}` : `?country=${country}`;
  return tvmazeFetch(`/schedule${params}`);
}

// Get a single random show from a page of shows
export async function getShowsByPage(page = 0) {
  return tvmazeFetch(`/shows?page=${page}`);
}
