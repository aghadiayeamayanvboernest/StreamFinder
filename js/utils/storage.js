const KEYS = {
  WATCHLIST: 'sf_watchlist',
  RECENT_SEARCHES: 'sf_recent_searches',
  PREFERENCES: 'sf_preferences',
};

function getJSON(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ===== Watchlist =====
export function getWatchlist() {
  return getJSON(KEYS.WATCHLIST, []);
}

export function addToWatchlist(item) {
  const list = getWatchlist();
  const exists = list.some(i => i.id === item.id && i.source === item.source);
  if (!exists) {
    if (!item.category) item.category = 'To Watch';
    list.push(item);
    setJSON(KEYS.WATCHLIST, list);
  }
  return list;
}

export function removeFromWatchlist(id, source) {
  const list = getWatchlist().filter(i => !(i.id === id && i.source === source));
  setJSON(KEYS.WATCHLIST, list);
  return list;
}

export function isInWatchlist(id, source) {
  return getWatchlist().some(i => i.id === id && i.source === source);
}

export function updateWatchlistCategory(id, source, newCategory) {
  const list = getWatchlist();
  const item = list.find(i => i.id === id && i.source === source);
  if (item) {
    item.category = newCategory;
    setJSON(KEYS.WATCHLIST, list);
  }
}

// ===== Recent Searches =====
export function getRecentSearches() {
  return getJSON(KEYS.RECENT_SEARCHES, []);
}

export function addRecentSearch(term) {
  const searches = getRecentSearches().filter(s => s !== term);
  searches.unshift(term);
  setJSON(KEYS.RECENT_SEARCHES, searches.slice(0, 10));
}

// ===== Preferences =====
export function getPreferences() {
  return getJSON(KEYS.PREFERENCES, {
    theme: 'dark',
    filters: {},
  });
}

export function savePreferences(prefs) {
  setJSON(KEYS.PREFERENCES, prefs);
}
