import { getGenreNames, formatRating, PLACEHOLDER_POSTER } from '../utils/helpers.js';
import { isInWatchlist, addToWatchlist, removeFromWatchlist, updateWatchlistCategory } from '../utils/storage.js';

// Create a content card element
export function createCard(item, isWatchlistPage = false) {
  const card = document.createElement('div');
  card.className = 'card fade-in';
  card.dataset.id = item.id;
  card.dataset.source = item.source;
  card.dataset.type = item.type;

  const saved = isInWatchlist(item.id, item.source);
  const posterSrc = item.posterSmall || item.poster || PLACEHOLDER_POSTER;

  // Use X icon for watchlist page, otherwise use + or checkmark
  const buttonIcon = isWatchlistPage ? '×' : (saved ? '✓' : '+');

  card.innerHTML = `
    <img class="card-poster" src="${posterSrc}" alt="${item.title}" loading="lazy">
    <span class="card-type-badge ${item.type}">${item.type === 'movie' ? 'Movie' : 'TV'}</span>
    <button class="card-watchlist-btn ${saved ? 'saved' : ''}" aria-label="${saved ? 'Remove from' : 'Add to'} watchlist" data-action="watchlist">
      ${buttonIcon}
    </button>
    <div class="card-overlay">
      <div class="card-title">${item.title}</div>
      <div class="card-meta">
        <span class="card-rating">★ ${formatRating(item.rating)}</span>
        <span>${item.year}</span>
      </div>
    </div>
  `;

  // Category selector (watchlist page only)
  if (isWatchlistPage) {
    const categorySelect = document.createElement('select');
    categorySelect.className = 'card-category-select';
    categorySelect.setAttribute('aria-label', 'Change category');
    ['To Watch', 'Watching Now', 'Already Watched'].forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      opt.selected = (item.category || 'To Watch') === cat;
      categorySelect.appendChild(opt);
    });
    categorySelect.addEventListener('change', (e) => {
      e.stopPropagation();
      updateWatchlistCategory(item.id, item.source, e.target.value);
      window.dispatchEvent(new CustomEvent('watchlist-changed'));
    });
    card.appendChild(categorySelect);
  }

  // Watchlist toggle
  const wBtn = card.querySelector('.card-watchlist-btn');
  wBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isSaved = isInWatchlist(item.id, item.source);
    if (isSaved) {
      removeFromWatchlist(item.id, item.source);
      wBtn.classList.remove('saved');
      wBtn.textContent = isWatchlistPage ? '×' : '+';
      wBtn.setAttribute('aria-label', 'Add to watchlist');
    } else {
      addToWatchlist({
        id: item.id,
        source: item.source,
        type: item.type,
        title: item.title,
        poster: item.poster,
        posterSmall: item.posterSmall,
        year: item.year,
        rating: item.rating,
      });
      wBtn.classList.add('saved');
      wBtn.textContent = isWatchlistPage ? '×' : '✓';
      wBtn.setAttribute('aria-label', 'Remove from watchlist');
      wBtn.classList.add('pulse');
      setTimeout(() => wBtn.classList.remove('pulse'), 300);
    }
    // Dispatch a custom event so watchlist page can react
    window.dispatchEvent(new CustomEvent('watchlist-changed'));
  });

  return card;
}

// Render an array of items into a container
export function renderCards(container, items, append = false, isWatchlistPage = false) {
  if (!append) container.innerHTML = '';
  items.forEach(item => container.appendChild(createCard(item, isWatchlistPage)));
}

// Render skeleton loaders
export function renderSkeletons(container, count = 10) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const skel = document.createElement('div');
    skel.className = 'skeleton skeleton-card';
    container.appendChild(skel);
  }
}
