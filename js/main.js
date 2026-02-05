import { getTrending, getTopRatedMovies, getPopularTV, getUpcoming, discoverMovies, discoverTV, getPersonDetails, getPersonCredits } from './api/tmdb.js';
import { normalizeTMDB, getAllGenres, getParams, genresReady, PLACEHOLDER_POSTER } from './utils/helpers.js';
import { getWatchlist, getPreferences, savePreferences, getRecentSearches, updateWatchlistCategory } from './utils/storage.js';
import { renderCards, renderSkeletons } from './components/cards.js';
import { setupAutocomplete, setupSearchForm, combinedSearch } from './components/search.js';
import { setupFilters, getSortParam, populateGenreSelect } from './components/filters.js';
import { setupModal, openModal } from './components/modal.js';

// Detect current page
const page = document.location.pathname.split('/').pop() || 'index.html';

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  setupGlobal();

  if (page === 'index.html' || page === '') initHome();
  else if (page === 'search.html') initSearch();
  else if (page === 'watchlist.html') initWatchlist();
  else if (page === 'genre.html') initGenre();
  else if (page === 'person.html') initPerson();
});

// ===== Global Setup (runs on every page) =====
function setupGlobal() {
  // Search bar
  const searchInput = document.getElementById('search-input');
  const searchForm = document.querySelector('.search-bar');
  const dropdown = document.getElementById('autocomplete-dropdown');

  if (searchInput && searchForm && dropdown) {
    setupSearchForm(searchForm, searchInput);
    setupAutocomplete(searchInput, dropdown, (item) => openModal(item));
  }

  // Modal
  setupModal();

  // Card click -> open modal (delegated)
  // Only handle clicks on cards that are NOT inside a modal
  document.addEventListener('click', (e) => {
    // Ignore clicks inside any modal
    if (e.target.closest('.modal-overlay')) return;

    const card = e.target.closest('.card');
    if (!card) return;
    if (e.target.closest('[data-action="watchlist"]')) return;
    if (e.target.closest('.card-category-select')) return;

    const id = Number(card.dataset.id);
    const source = card.dataset.source;
    const type = card.dataset.type;

    const posterImg = card.querySelector('.card-poster');
    const titleEl = card.querySelector('.card-title');
    const item = {
      id, source, type,
      title: titleEl?.textContent || '',
      poster: posterImg?.src || null,
      posterSmall: posterImg?.src || null,
      backdrop: null,
      overview: '',
      year: '',
      rating: 0,
    };
    openModal(item);
  });

  // Surprise Me
  const surpriseBtn = document.getElementById('surprise-btn');
  const surpriseModal = document.getElementById('surprise-modal');
  if (surpriseBtn && surpriseModal) {
    surpriseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Reset previous result
      const prevResult = document.getElementById('surprise-result');
      if (prevResult) { prevResult.innerHTML = ''; prevResult.hidden = true; }
      surpriseModal.hidden = false;
      document.body.style.overflow = 'hidden';
    });

    function closeSurprise() {
      surpriseModal.hidden = true;
      document.body.style.overflow = '';
      const result = document.getElementById('surprise-result');
      if (result) { result.innerHTML = ''; result.hidden = true; }
    }

    const surpriseClose = surpriseModal.querySelector('.modal-close');
    surpriseClose?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSurprise();
    });
    surpriseModal.addEventListener('click', (e) => {
      // Close when clicking the overlay background (not the inner card)
      if (e.target === surpriseModal) closeSurprise();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !surpriseModal.hidden) closeSurprise();
    });

    // Populate surprise genre select
    const surpriseGenre = document.getElementById('surprise-genre');
    if (surpriseGenre) populateGenreSelect(surpriseGenre, 'all');

    const rollBtn = document.getElementById('surprise-roll-btn');
    rollBtn?.addEventListener('click', () => rollSurprise());
  }

  // Carousel scroll buttons
  document.querySelectorAll('.carousel').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    const leftBtn = carousel.querySelector('.carousel-btn-left');
    const rightBtn = carousel.querySelector('.carousel-btn-right');
    if (track && leftBtn && rightBtn) {
      leftBtn.addEventListener('click', () => track.scrollBy({ left: -400, behavior: 'smooth' }));
      rightBtn.addEventListener('click', () => track.scrollBy({ left: 400, behavior: 'smooth' }));
    }
  });

  // Hamburger menu (for mobile - toggle mobile sidebar if on search page)
  const hamburger = document.querySelector('.hamburger-btn');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const sidebar = document.getElementById('filter-sidebar');
      if (sidebar) {
        sidebar.classList.toggle('open');
        hamburger.classList.toggle('active');

        // Create/toggle overlay
        let overlay = document.getElementById('sidebar-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'sidebar-overlay';
          overlay.className = 'sidebar-overlay';
          document.body.appendChild(overlay);

          overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            hamburger.classList.remove('active');
            overlay.classList.remove('active');
          });
        }
        overlay.classList.toggle('active');
      }
    });
  }

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    // Load saved theme preference
    const prefs = getPreferences();
    if (prefs.theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';

      if (newTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }

      // Save preference
      const prefs = getPreferences();
      prefs.theme = newTheme;
      savePreferences(prefs);
    });
  }
}

// ===== Home Page =====
async function initHome() {
  const trendingTrack = document.getElementById('trending-track');
  const topRatedTrack = document.getElementById('top-rated-track');
  const popularTVTrack = document.getElementById('popular-tv-track');
  const upcomingTrack = document.getElementById('upcoming-track');
  const browseGrid = document.getElementById('browse-grid');
  const heroBg = document.getElementById('hero-backdrop');
  const heroTitle = document.getElementById('hero-title');
  const heroOverview = document.getElementById('hero-overview');
  const heroDetailsBtn = document.getElementById('hero-details-btn');
  const heroWatchlistBtn = document.getElementById('hero-watchlist-btn');

  // Show skeletons
  [trendingTrack, topRatedTrack, popularTVTrack, upcomingTrack].forEach(t => {
    if (t) renderSkeletons(t, 8);
  });
  if (browseGrid) renderSkeletons(browseGrid, 12);

  try {
    // Fetch all data in parallel
    const [trending, topRated, popularTV, upcoming] = await Promise.allSettled([
      getTrending('all', 'day'),
      getTopRatedMovies(),
      getPopularTV(),
      getUpcoming(),
    ]);

    // Hero - use first trending item
    if (trending.status === 'fulfilled' && trending.value.results?.length) {
      const heroItem = normalizeTMDB(trending.value.results[0], trending.value.results[0].media_type || 'movie');
      if (heroBg && heroItem.backdrop) heroBg.style.backgroundImage = `url(${heroItem.backdrop})`;
      if (heroTitle) heroTitle.textContent = heroItem.title;
      if (heroOverview) heroOverview.textContent = heroItem.overview;
      if (heroDetailsBtn) heroDetailsBtn.onclick = () => openModal(heroItem);
      if (heroWatchlistBtn) {
        const { addToWatchlist: addHero, isInWatchlist: checkHero } = await import('./utils/storage.js');
        heroWatchlistBtn.onclick = () => {
          if (!checkHero(heroItem.id, heroItem.source)) {
            addHero({ id: heroItem.id, source: heroItem.source, type: heroItem.type, title: heroItem.title, poster: heroItem.poster, posterSmall: heroItem.posterSmall, year: heroItem.year, rating: heroItem.rating });
            heroWatchlistBtn.textContent = '✓ In Watchlist';
          }
        };
      }

      // Trending carousel
      const trendingItems = trending.value.results.slice(1, 20).map(r =>
        normalizeTMDB(r, r.media_type || 'movie')
      );
      renderCards(trendingTrack, trendingItems);
    }

    // Top rated
    if (topRated.status === 'fulfilled' && topRated.value.results) {
      const items = topRated.value.results.slice(0, 20).map(r => normalizeTMDB(r, 'movie'));
      renderCards(topRatedTrack, items);
    }

    // Popular TV
    if (popularTV.status === 'fulfilled' && popularTV.value.results) {
      const items = popularTV.value.results.slice(0, 20).map(r => normalizeTMDB(r, 'tv'));
      renderCards(popularTVTrack, items);
    }

    // Upcoming movies
    if (upcoming.status === 'fulfilled' && upcoming.value.results) {
      const items = upcoming.value.results.slice(0, 20).map(r => normalizeTMDB(r, 'movie'));
      renderCards(upcomingTrack, items);
    }

    // Browse grid - combine some results
    if (browseGrid) {
      const allItems = [];
      if (trending.status === 'fulfilled') {
        trending.value.results?.slice(0, 12).forEach(r => {
          allItems.push(normalizeTMDB(r, r.media_type || 'movie'));
        });
      }
      renderCards(browseGrid, allItems);
    }
  } catch (err) {
    console.error('Home init error:', err);
  }
}

// ===== Search Page =====
async function initSearch() {
  const params = getParams();
  const grid = document.getElementById('results-grid');
  const titleEl = document.getElementById('results-title');
  const countEl = document.getElementById('results-count');
  const emptyState = document.getElementById('empty-state');
  const errorState = document.getElementById('error-state');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const searchInput = document.getElementById('search-input');
  const recentSearchesEl = document.getElementById('recent-searches');
  const recentSearchesList = document.getElementById('recent-searches-list');
  const clearRecentBtn = document.getElementById('clear-recent-searches');

  let currentPage = 1;
  let totalPages = 1;
  let currentQuery = params.q || '';
  let currentFilters = {};

  if (searchInput && currentQuery) searchInput.value = currentQuery;
  if (titleEl && currentQuery) titleEl.textContent = `Results for "${currentQuery}"`;

  // Display recent searches if no query
  function renderRecentSearches() {
    const searches = getRecentSearches();
    if (searches.length > 0 && !currentQuery && recentSearchesEl && recentSearchesList) {
      recentSearchesList.innerHTML = searches.map(term => `
        <button class="recent-search-item" data-term="${term}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          ${term}
        </button>
      `).join('');
      recentSearchesEl.hidden = false;
    } else if (recentSearchesEl) {
      recentSearchesEl.hidden = true;
    }
  }

  // Handle recent search click
  if (recentSearchesList) {
    recentSearchesList.addEventListener('click', (e) => {
      const item = e.target.closest('.recent-search-item');
      if (item) {
        const term = item.dataset.term;
        window.location.href = `search.html?q=${encodeURIComponent(term)}`;
      }
    });
  }

  // Clear recent searches
  if (clearRecentBtn) {
    clearRecentBtn.addEventListener('click', () => {
      localStorage.removeItem('sf_recent_searches');
      if (recentSearchesEl) recentSearchesEl.hidden = true;
    });
  }

  renderRecentSearches();

  // Setup filters
  setupFilters(async (filters) => {
    currentFilters = filters;
    currentPage = 1;
    await doSearch();
  });

  async function doSearch() {
    if (grid) renderSkeletons(grid, 12);
    if (emptyState) emptyState.hidden = true;
    if (errorState) errorState.hidden = true;
    if (loadMoreBtn) loadMoreBtn.hidden = true;

    try {
      let results = [];

      if (currentQuery) {
        // Text search
        const data = await combinedSearch(currentQuery, currentPage);
        results = data.results;
        totalPages = data.totalPages;
      } else {
        // Discovery mode (no query, just filters)
        const sortParam = getSortParam(currentFilters.sort);
        const discoverParams = {
          sort_by: sortParam,
          genre: currentFilters.genre,
          minRating: currentFilters.minRating > 0 ? currentFilters.minRating : undefined,
          yearFrom: currentFilters.yearFrom,
          yearTo: currentFilters.yearTo,
          page: currentPage,
        };

        if (currentFilters.type === 'tv') {
          const data = await discoverTV(discoverParams);
          results = data.results.map(r => normalizeTMDB(r, 'tv'));
          totalPages = data.total_pages;
        } else if (currentFilters.type === 'movie') {
          const data = await discoverMovies(discoverParams);
          results = data.results.map(r => normalizeTMDB(r, 'movie'));
          totalPages = data.total_pages;
        } else {
          const [movies, tv] = await Promise.allSettled([
            discoverMovies(discoverParams),
            discoverTV(discoverParams),
          ]);
          if (movies.status === 'fulfilled') results.push(...movies.value.results.map(r => normalizeTMDB(r, 'movie')));
          if (tv.status === 'fulfilled') results.push(...tv.value.results.map(r => normalizeTMDB(r, 'tv')));
          results.sort((a, b) => b.popularity - a.popularity);
          totalPages = Math.max(
            movies.status === 'fulfilled' ? movies.value.total_pages : 1,
            tv.status === 'fulfilled' ? tv.value.total_pages : 1,
          );
        }
      }

      // Apply client-side filters to search results
      if (currentQuery) {
        results = applyFilters(results, currentFilters);
      }

      if (results.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.hidden = false;
      } else {
        renderCards(grid, results, currentPage > 1);
      }

      if (countEl) countEl.textContent = `${results.length} results`;
      if (loadMoreBtn) loadMoreBtn.hidden = currentPage >= totalPages;
    } catch (err) {
      console.error('Search error:', err);
      if (grid) grid.innerHTML = '';
      if (errorState) errorState.hidden = false;
    }
  }

  // Load more
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
      currentPage++;
      await doSearch();
    });
  }

  // Retry
  document.getElementById('retry-btn')?.addEventListener('click', () => doSearch());

  // Initial search
  await doSearch();
}

function applyFilters(results, filters) {
  return results.filter(item => {
    if (filters.type && filters.type !== 'all' && item.type !== filters.type) return false;
    if (filters.genre && item.genreIds?.length && !item.genreIds.includes(Number(filters.genre))) return false;
    if (filters.minRating && Number(filters.minRating) > 0 && item.rating < Number(filters.minRating)) return false;
    if (filters.yearFrom && item.year && Number(item.year) < Number(filters.yearFrom)) return false;
    if (filters.yearTo && item.year && Number(item.year) > Number(filters.yearTo)) return false;
    return true;
  });
}

// ===== Watchlist Page =====
function initWatchlist() {
  const grid = document.getElementById('watchlist-grid');
  const emptyState = document.getElementById('watchlist-empty');
  const countEl = document.getElementById('watchlist-count');
  const tabsEl = document.getElementById('watchlist-tabs');

  const CATEGORIES = ['All', 'To Watch', 'Watching Now', 'Already Watched'];
  let activeCategory = 'All';

  function renderTabs(allItems) {
    if (!tabsEl) return;
    tabsEl.innerHTML = CATEGORIES.map(cat => {
      const count = cat === 'All'
        ? allItems.length
        : allItems.filter(i => i.category === cat).length;
      return `<button class="watchlist-tab ${activeCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}<span class="watchlist-tab-count">${count}</span></button>`;
    }).join('');
  }

  if (tabsEl) {
    tabsEl.addEventListener('click', (e) => {
      const tab = e.target.closest('.watchlist-tab');
      if (!tab) return;
      activeCategory = tab.dataset.category;
      render();
    });
  }

  function render() {
    // Default missing category for backward compat
    const allItems = getWatchlist().map(i => ({ ...i, category: i.category || 'To Watch' }));

    renderTabs(allItems);

    const filtered = activeCategory === 'All' ? allItems : allItems.filter(i => i.category === activeCategory);
    if (countEl) countEl.textContent = `${filtered.length} title${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      if (grid) grid.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
    } else {
      if (emptyState) emptyState.hidden = true;
      renderCards(grid, filtered, false, true);
    }
  }

  render();
  window.addEventListener('watchlist-changed', render);
}

// ===== Genre Page =====
async function initGenre() {
  const genreGrid = document.getElementById('genre-grid');
  const resultsSection = document.getElementById('genre-results');
  const resultsTitle = document.getElementById('genre-results-title');
  const resultsGrid = document.getElementById('genre-results-grid');
  const backBtn = document.getElementById('genre-back-btn');
  const loadMoreBtn = document.getElementById('genre-load-more');

  // Wait for genres to load before rendering
  await genresReady;
  const allGenres = getAllGenres();
  // Combine and deduplicate
  const combined = [...allGenres.movie, ...allGenres.tv]
    .filter((g, i, arr) => arr.findIndex(x => x.id === g.id) === i);

  // Render genre cards
  genreGrid.innerHTML = combined.map(g =>
    `<div class="genre-card" data-genre-id="${g.id}" data-genre-name="${g.name}"><h3>${g.name}</h3></div>`
  ).join('');

  let currentGenrePage = 1;
  let currentGenreId = null;

  genreGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.genre-card');
    if (!card) return;
    currentGenreId = card.dataset.genreId;
    currentGenrePage = 1;
    genreGrid.style.display = 'none';
    resultsSection.hidden = false;
    resultsTitle.textContent = card.dataset.genreName;
    await loadGenreResults();
  });

  backBtn?.addEventListener('click', () => {
    genreGrid.style.display = '';
    resultsSection.hidden = true;
    resultsGrid.innerHTML = '';
  });

  async function loadGenreResults() {
    renderSkeletons(resultsGrid, 12);
    try {
      const [movies, tv] = await Promise.allSettled([
        discoverMovies({ genre: currentGenreId, page: currentGenrePage }),
        discoverTV({ genre: currentGenreId, page: currentGenrePage }),
      ]);

      const results = [];
      let maxPages = 1;
      if (movies.status === 'fulfilled') {
        results.push(...movies.value.results.map(r => normalizeTMDB(r, 'movie')));
        maxPages = Math.max(maxPages, movies.value.total_pages);
      }
      if (tv.status === 'fulfilled') {
        results.push(...tv.value.results.map(r => normalizeTMDB(r, 'tv')));
        maxPages = Math.max(maxPages, tv.value.total_pages);
      }

      results.sort((a, b) => b.popularity - a.popularity);
      renderCards(resultsGrid, results, currentGenrePage > 1);
      if (loadMoreBtn) loadMoreBtn.hidden = currentGenrePage >= maxPages;
    } catch (err) {
      console.error('Genre load error:', err);
      resultsGrid.innerHTML = '<div class="error-state"><h3>Failed to load</h3></div>';
    }
  }

  loadMoreBtn?.addEventListener('click', async () => {
    currentGenrePage++;
    await loadGenreResults();
  });
}

// ===== Person / Actor Page =====
async function initPerson() {
  const skeleton = document.getElementById('person-skeleton');
  const content = document.getElementById('person-content');
  const errorState = document.getElementById('person-error');
  const creditsSkeletonGrid = document.getElementById('person-credits-skeleton');

  // Show card skeletons in credits area while loading
  if (creditsSkeletonGrid) renderSkeletons(creditsSkeletonGrid, 12);

  const params = getParams();
  const personId = params.person_id;

  if (!personId) {
    if (skeleton) skeleton.hidden = true;
    if (errorState) errorState.hidden = false;
    return;
  }

  try {
    const [details, credits] = await Promise.all([
      getPersonDetails(personId),
      getPersonCredits(personId),
    ]);

    // Populate photo
    const photoUrl = details.profile_path
      ? `https://image.tmdb.org/t/p/w500${details.profile_path}`
      : PLACEHOLDER_POSTER;
    document.getElementById('person-photo').src = photoUrl;
    document.getElementById('person-photo').alt = details.name;

    // Populate name
    document.getElementById('person-name').textContent = details.name;

    // Populate bio (hide if empty)
    const bioEl = document.getElementById('person-bio');
    if (details.biography) {
      bioEl.textContent = details.biography;
    } else {
      bioEl.hidden = true;
    }

    // Merge movie + TV credits, normalize, sort by popularity, take top 20
    const movieCredits = (credits.movie_results || []).map(r => normalizeTMDB(r, 'movie'));
    const tvCredits = (credits.tv_results || []).map(r => normalizeTMDB(r, 'tv'));
    const allCredits = [...movieCredits, ...tvCredits]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 20);

    // Render credits as cards
    const grid = document.getElementById('person-credits-grid');
    renderCards(grid, allCredits);

    // Swap skeleton for content
    if (skeleton) skeleton.hidden = true;
    if (content) content.hidden = false;

    // Update page title
    document.title = `${details.name} - StreamFinder`;
  } catch (err) {
    console.error('Person page error:', err);
    if (skeleton) skeleton.hidden = true;
    if (errorState) errorState.hidden = false;
  }
}

// ===== Surprise Me =====
async function rollSurprise() {
  const typeSelect = document.getElementById('surprise-type');
  const resultEl = document.getElementById('surprise-result');
  const rollBtn = document.getElementById('surprise-roll-btn');
  const genreSelect = document.getElementById('surprise-genre');

  const type = typeSelect?.value || 'all';
  const genre = genreSelect?.value || '';

  rollBtn.classList.add('surprise-rolling');
  rollBtn.textContent = 'Rolling...';

  try {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    let results = [];

    if (type === 'tv' || type === 'all') {
      try {
        const tvData = await discoverTV({ genre, page: randomPage });
        results.push(...tvData.results.map(r => normalizeTMDB(r, 'tv')));
      } catch { /* ignore */ }
    }
    if (type === 'movie' || type === 'all') {
      try {
        const movieData = await discoverMovies({ genre, page: randomPage });
        results.push(...movieData.results.map(r => normalizeTMDB(r, 'movie')));
      } catch { /* ignore */ }
    }

    if (results.length === 0) {
      resultEl.innerHTML = '<p>No results found. Try different filters.</p>';
      resultEl.hidden = false;
      return;
    }

    const pick = results[Math.floor(Math.random() * results.length)];

    // Close surprise modal fully, then open detail modal
    const surpriseModal = document.getElementById('surprise-modal');
    surpriseModal.hidden = true;
    const surpriseResult = document.getElementById('surprise-result');
    if (surpriseResult) { surpriseResult.innerHTML = ''; surpriseResult.hidden = true; }
    document.body.style.overflow = '';

    // Small delay so the surprise modal is fully gone before detail opens
    setTimeout(() => openModal(pick), 100);
  } catch (err) {
    console.error('Surprise error:', err);
    resultEl.innerHTML = '<p>Something went wrong. Please try again.</p>';
    resultEl.hidden = false;
  } finally {
    rollBtn.classList.remove('surprise-rolling');
    rollBtn.textContent = 'Roll the Dice';
  }
}
