import { searchMulti } from '../api/tmdb.js';
import { searchShows } from '../api/tvmaze.js';
import { normalizeTMDB, normalizeTVMaze, debounce, PLACEHOLDER_POSTER } from '../utils/helpers.js';
import { addRecentSearch } from '../utils/storage.js';

let currentController = null;

// Combined search across both APIs
export async function combinedSearch(query, page = 1) {
  if (!query.trim()) return { results: [], totalPages: 1 };

  const [tmdbData, tvmazeData] = await Promise.allSettled([
    searchMulti(query, page),
    page === 1 ? searchShows(query) : Promise.resolve([]),
  ]);

  const results = [];

  // Process TMDB results
  if (tmdbData.status === 'fulfilled' && tmdbData.value.results) {
    tmdbData.value.results.forEach(item => {
      if (item.media_type === 'movie' || item.media_type === 'tv') {
        results.push(normalizeTMDB(item, item.media_type));
      }
    });
  }

  // Process TVMaze results (only on page 1 to avoid duplicates)
  if (page === 1 && tvmazeData.status === 'fulfilled' && Array.isArray(tvmazeData.value)) {
    tvmazeData.value.forEach(item => {
      const normalized = normalizeTVMaze(item);
      // Avoid duplicates by checking title similarity
      const isDuplicate = results.some(r =>
        r.title.toLowerCase() === normalized.title.toLowerCase() && r.type === 'tv'
      );
      if (!isDuplicate) {
        results.push(normalized);
      }
    });
  }

  const totalPages = tmdbData.status === 'fulfilled' ? tmdbData.value.total_pages || 1 : 1;
  return { results, totalPages };
}

// Setup autocomplete on a search input
export function setupAutocomplete(inputEl, dropdownEl, onSelect) {
  const doSearch = debounce(async (query) => {
    if (currentController) currentController.abort();
    currentController = new AbortController();

    if (query.length < 2) {
      dropdownEl.hidden = true;
      return;
    }

    try {
      const { results } = await combinedSearch(query);
      const top = results.slice(0, 8);

      if (top.length === 0) {
        dropdownEl.hidden = true;
        return;
      }

      dropdownEl.innerHTML = '';
      top.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        div.tabIndex = 0;
        div.dataset.index = i;
        div.innerHTML = `
          <img src="${item.posterSmall || item.poster || PLACEHOLDER_POSTER}" alt="">
          <div class="autocomplete-item-info">
            <div class="autocomplete-item-title">${item.title}</div>
            <div class="autocomplete-item-meta">${item.type === 'movie' ? 'Movie' : 'TV'} · ${item.year}</div>
          </div>
        `;
        div.addEventListener('click', () => {
          dropdownEl.hidden = true;
          onSelect(item);
        });
        dropdownEl.appendChild(div);
      });
      dropdownEl.hidden = false;
    } catch {
      dropdownEl.hidden = true;
    }
  }, 250);

  inputEl.addEventListener('input', (e) => doSearch(e.target.value));

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!inputEl.contains(e.target) && !dropdownEl.contains(e.target)) {
      dropdownEl.hidden = true;
    }
  });

  // Keyboard navigation in dropdown
  inputEl.addEventListener('keydown', (e) => {
    if (dropdownEl.hidden) return;
    const items = dropdownEl.querySelectorAll('.autocomplete-item');
    const focused = dropdownEl.querySelector('.focused');
    let idx = focused ? Number(focused.dataset.index) : -1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idx = Math.min(idx + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idx = Math.max(idx - 1, 0);
    } else if (e.key === 'Enter' && focused) {
      e.preventDefault();
      focused.click();
      return;
    } else if (e.key === 'Escape') {
      dropdownEl.hidden = true;
      return;
    } else {
      return;
    }

    items.forEach(i => i.classList.remove('focused'));
    if (items[idx]) items[idx].classList.add('focused');
  });
}

// Setup form submit for search bar
export function setupSearchForm(formEl, inputEl) {
  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = inputEl.value.trim();
    if (query) {
      addRecentSearch(query);
      window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }
  });
}
