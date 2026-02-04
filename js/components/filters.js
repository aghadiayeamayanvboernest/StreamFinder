import { getAllGenres } from '../utils/helpers.js';
import { getPreferences, savePreferences } from '../utils/storage.js';

// Populate genre dropdown options
export function populateGenreSelect(selectEl, type = 'movie') {
  const genres = getAllGenres();
  const list = type === 'tv' ? genres.tv : genres.movie;
  // Keep the first "All Genres" option
  const firstOption = selectEl.querySelector('option');
  selectEl.innerHTML = '';
  if (firstOption) selectEl.appendChild(firstOption);

  // Combine both lists for "all" type and deduplicate by id
  const combined = type === 'all'
    ? [...genres.movie, ...genres.tv].filter((g, i, arr) => arr.findIndex(x => x.id === g.id) === i)
    : list;

  combined.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.name;
    selectEl.appendChild(opt);
  });
}

// Get current filter values from the UI
export function getFilterValues() {
  return {
    genre: document.getElementById('filter-genre')?.value || '',
    yearFrom: document.getElementById('filter-year-from')?.value || '',
    yearTo: document.getElementById('filter-year-to')?.value || '',
    minRating: document.getElementById('filter-rating')?.value || '0',
    type: document.getElementById('filter-type')?.value || 'all',
    sort: document.getElementById('filter-sort')?.value || 'popular',
  };
}

// Map sort option to TMDB sort_by param
export function getSortParam(sort) {
  switch (sort) {
    case 'rating': return 'vote_average.desc';
    case 'date': return 'primary_release_date.desc';
    default: return 'popularity.desc';
  }
}

// Setup filter interactions
export function setupFilters(onApply) {
  const ratingSlider = document.getElementById('filter-rating');
  const ratingDisplay = document.getElementById('rating-value');
  const applyBtn = document.getElementById('filter-apply-btn');
  const clearBtn = document.getElementById('filter-clear-btn');
  const typeSelect = document.getElementById('filter-type');
  const genreSelect = document.getElementById('filter-genre');
  const toggleBtn = document.getElementById('filter-toggle-btn');
  const sidebar = document.getElementById('filter-sidebar');

  if (ratingSlider && ratingDisplay) {
    ratingSlider.addEventListener('input', () => {
      ratingDisplay.textContent = ratingSlider.value;
    });
  }

  if (typeSelect && genreSelect) {
    typeSelect.addEventListener('change', () => {
      populateGenreSelect(genreSelect, typeSelect.value);
    });
    // Initial populate
    populateGenreSelect(genreSelect, typeSelect.value);
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const filters = getFilterValues();
      savePreferences({ ...getPreferences(), filters });
      if (sidebar) sidebar.classList.remove('open');
      onApply(filters);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (genreSelect) genreSelect.value = '';
      document.getElementById('filter-year-from').value = '';
      document.getElementById('filter-year-to').value = '';
      if (ratingSlider) { ratingSlider.value = 0; ratingDisplay.textContent = '0'; }
      if (typeSelect) typeSelect.value = 'all';
      document.getElementById('filter-sort').value = 'popular';
      onApply(getFilterValues());
    });
  }

  // Mobile filter toggle
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Restore saved filters
  const saved = getPreferences().filters;
  if (saved && Object.keys(saved).length) {
    if (typeSelect && saved.type) typeSelect.value = saved.type;
    if (genreSelect) {
      populateGenreSelect(genreSelect, saved.type || 'all');
      if (saved.genre) genreSelect.value = saved.genre;
    }
    if (saved.yearFrom) document.getElementById('filter-year-from').value = saved.yearFrom;
    if (saved.yearTo) document.getElementById('filter-year-to').value = saved.yearTo;
    if (ratingSlider && saved.minRating) {
      ratingSlider.value = saved.minRating;
      ratingDisplay.textContent = saved.minRating;
    }
    if (saved.sort) document.getElementById('filter-sort').value = saved.sort;
  }
}
