import { getMovieDetails, getMovieCredits, getSimilarMovies, getTVDetails, getTVCredits, getSimilarTV, getMovieVideos, getTVVideos, getMovieWatchProviders, getTVWatchProviders } from '../api/tmdb.js';
import { getShowWithEpisodes, getSeasons, getSeasonEpisodes, getCast as getTVMazeCast } from '../api/tvmaze.js';
import { normalizeTMDB, formatDate, formatRating, getGenreNames, PLACEHOLDER_POSTER } from '../utils/helpers.js';
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from '../utils/storage.js';
import { createCard } from './cards.js';

let currentItem = null;

export function setupModal() {
  const overlay = document.getElementById('detail-modal');
  if (!overlay) return;

  const closeBtn = overlay.querySelector('.modal-close');
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal();
  });
  overlay.addEventListener('mousedown', (e) => {
    // Only close if clicking directly on the overlay background
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
  });
}

export function closeModal() {
  const overlay = document.getElementById('detail-modal');
  if (overlay) overlay.hidden = true;
  document.body.style.overflow = '';
  currentItem = null;
}

export async function openModal(item) {
  const overlay = document.getElementById('detail-modal');
  if (!overlay) return;

  currentItem = item;
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';

  // Reset sections
  document.getElementById('episode-guide').hidden = true;
  document.getElementById('similar-section').hidden = true;
  document.getElementById('modal-cast').innerHTML = '';
  document.getElementById('modal-trailer').hidden = true;
  document.getElementById('trailer-container').innerHTML = '';
  document.getElementById('modal-providers').hidden = true;
  document.getElementById('providers-list').innerHTML = '';

  // Set basic info from what we already have
  document.getElementById('modal-title').textContent = item.title;
  document.getElementById('modal-overview').textContent = item.overview || 'No overview available.';
  document.getElementById('modal-poster-img').src = item.poster || PLACEHOLDER_POSTER;
  document.getElementById('modal-poster-img').alt = item.title;

  const backdrop = document.getElementById('modal-backdrop');
  if (item.backdrop) {
    backdrop.style.backgroundImage = `url(${item.backdrop})`;
  } else {
    backdrop.style.backgroundImage = 'none';
    backdrop.style.background = 'var(--bg-elevated)';
  }

  // Watchlist button
  const wBtn = document.getElementById('modal-watchlist-btn');
  const saved = isInWatchlist(item.id, item.source);
  wBtn.textContent = saved ? '✓ In Watchlist' : '+ Add to Watchlist';
  wBtn.onclick = () => {
    if (isInWatchlist(item.id, item.source)) {
      removeFromWatchlist(item.id, item.source);
      wBtn.textContent = '+ Add to Watchlist';
    } else {
      addToWatchlist({
        id: item.id, source: item.source, type: item.type,
        title: item.title, poster: item.poster, posterSmall: item.posterSmall,
        year: item.year, rating: item.rating,
      });
      wBtn.textContent = '✓ In Watchlist';
    }
    window.dispatchEvent(new CustomEvent('watchlist-changed'));
  };

  // Fetch full details based on source
  if (item.source === 'tmdb') {
    await loadTMDBDetails(item);
  } else if (item.source === 'tvmaze') {
    await loadTVMazeDetails(item);
  }
}

async function loadTMDBDetails(item) {
  try {
    const isMovie = item.type === 'movie';
    const [details, credits, similar, videos, providers] = await Promise.allSettled([
      isMovie ? getMovieDetails(item.id) : getTVDetails(item.id),
      isMovie ? getMovieCredits(item.id) : getTVCredits(item.id),
      isMovie ? getSimilarMovies(item.id) : getSimilarTV(item.id),
      isMovie ? getMovieVideos(item.id) : getTVVideos(item.id),
      isMovie ? getMovieWatchProviders(item.id) : getTVWatchProviders(item.id),
    ]);

    if (details.status === 'fulfilled') {
      const d = details.value;

      // Update poster and backdrop from API if we don't have them
      if (d.poster_path) {
        document.getElementById('modal-poster-img').src = `https://image.tmdb.org/t/p/w500${d.poster_path}`;
      }
      const backdropEl = document.getElementById('modal-backdrop');
      if (d.backdrop_path) {
        backdropEl.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${d.backdrop_path})`;
      }

      // Title (in case card only had partial text)
      const title = isMovie ? d.title : d.name;
      if (title) document.getElementById('modal-title').textContent = title;

      // Year from API
      const year = (isMovie ? d.release_date : d.first_air_date)?.slice(0, 4) || '';

      // Update meta
      const metaParts = [];
      if (year) metaParts.push(`<span>${year}</span>`);
      if (isMovie && d.runtime) metaParts.push(`<span>${d.runtime} min</span>`);
      if (!isMovie && d.number_of_seasons) metaParts.push(`<span>${d.number_of_seasons} Season${d.number_of_seasons > 1 ? 's' : ''}</span>`);
      if (d.original_language) metaParts.push(`<span>${d.original_language.toUpperCase()}</span>`);
      document.getElementById('modal-meta').innerHTML = metaParts.join('<span>·</span>');

      // Genres
      const genres = d.genres || [];
      document.getElementById('modal-genres').innerHTML = genres
        .map(g => `<span class="genre-tag">${g.name}</span>`)
        .join('');

      // Rating
      const rating = d.vote_average;
      document.getElementById('modal-rating').innerHTML = rating
        ? `<span class="rating-star">★</span><span class="rating-score">${formatRating(rating)}</span><span class="rating-count">(${d.vote_count?.toLocaleString() || 0} votes)</span>`
        : '';

      // Overview
      if (d.overview) {
        document.getElementById('modal-overview').textContent = d.overview;
      }
    }

    // Cast
    if (credits.status === 'fulfilled' && credits.value.cast) {
      renderCast(credits.value.cast.slice(0, 10));
    }

    // Similar
    if (similar.status === 'fulfilled' && similar.value.results?.length) {
      const track = document.getElementById('similar-track');
      track.innerHTML = '';
      similar.value.results.slice(0, 10).forEach(s => {
        const normalized = normalizeTMDB(s, item.type);
        const card = createCard(normalized);
        card.addEventListener('click', (e) => {
          if (e.target.closest('[data-action="watchlist"]')) return;
          openModal(normalized);
        });
        track.appendChild(card);
      });
      document.getElementById('similar-section').hidden = false;
    }

    // Trailers
    if (videos.status === 'fulfilled' && videos.value.results?.length) {
      const trailer = videos.value.results.find(v =>
        v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      ) || videos.value.results.find(v => v.site === 'YouTube');

      if (trailer) {
        renderTrailer(trailer.key);
      }
    }

    // Watch Providers
    if (providers.status === 'fulfilled' && providers.value.results) {
      const usProviders = providers.value.results.US;
      if (usProviders) {
        renderWatchProviders(usProviders);
      }
    }
  } catch (err) {
    console.error('Error loading TMDB details:', err);
  }
}

async function loadTVMazeDetails(item) {
  try {
    const [showData, castData] = await Promise.allSettled([
      getShowWithEpisodes(item.id),
      getTVMazeCast(item.id),
    ]);

    if (showData.status === 'fulfilled') {
      const show = showData.value;

      // Meta
      const metaParts = [];
      if (show.premiered) metaParts.push(`<span>${show.premiered.slice(0, 4)}</span>`);
      if (show.status) metaParts.push(`<span>${show.status}</span>`);
      if (show.runtime) metaParts.push(`<span>${show.runtime} min</span>`);
      if (show.network?.name) metaParts.push(`<span>${show.network.name}</span>`);
      if (show.language) metaParts.push(`<span>${show.language}</span>`);
      document.getElementById('modal-meta').innerHTML = metaParts.join('<span>·</span>');

      // Genres
      document.getElementById('modal-genres').innerHTML = (show.genres || [])
        .map(g => `<span class="genre-tag">${g}</span>`)
        .join('');

      // Rating
      const rating = show.rating?.average;
      document.getElementById('modal-rating').innerHTML = rating
        ? `<span class="rating-star">★</span><span class="rating-score">${formatRating(rating)}</span>`
        : '';

      // Episodes
      if (show._embedded?.episodes?.length) {
        renderEpisodeGuide(show._embedded.episodes, item.id);
      }
    }

    // Cast
    if (castData.status === 'fulfilled' && castData.value.length) {
      const cast = castData.value.slice(0, 10).map(c => ({
        name: c.person?.name || '',
        character: c.character?.name || '',
        profile_path: c.person?.image?.medium || null,
      }));
      renderCastRaw(cast);
    }
  } catch (err) {
    console.error('Error loading TVMaze details:', err);
  }
}

function renderCast(castArray) {
  const container = document.getElementById('modal-cast');
  if (!castArray.length) { container.innerHTML = ''; return; }

  container.innerHTML = `<h4>Cast</h4><div class="cast-list">
    ${castArray.map(c => `
      <a href="person.html?person_id=${c.id}" class="cast-member-link">
        <div class="cast-member">
          <img src="${c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : PLACEHOLDER_POSTER}" alt="${c.name}" loading="lazy">
          <div class="cast-member-name">${c.name}</div>
          <div class="cast-member-role">${c.character}</div>
        </div>
      </a>
    `).join('')}
  </div>`;
}

function renderCastRaw(castArray) {
  const container = document.getElementById('modal-cast');
  if (!castArray.length) { container.innerHTML = ''; return; }

  container.innerHTML = `<h4>Cast</h4><div class="cast-list">
    ${castArray.map(c => `
      <div class="cast-member">
        <img src="${c.profile_path || PLACEHOLDER_POSTER}" alt="${c.name}" loading="lazy">
        <div class="cast-member-name">${c.name}</div>
        <div class="cast-member-role">${c.character}</div>
      </div>
    `).join('')}
  </div>`;
}

async function renderEpisodeGuide(episodes, showId) {
  const guideEl = document.getElementById('episode-guide');
  const selectorEl = document.getElementById('season-selector');
  const listEl = document.getElementById('episode-list');

  // Group episodes by season
  const seasons = {};
  episodes.forEach(ep => {
    const s = ep.season || 1;
    if (!seasons[s]) seasons[s] = [];
    seasons[s].push(ep);
  });

  const seasonNums = Object.keys(seasons).map(Number).sort((a, b) => a - b);

  // Render season buttons
  selectorEl.innerHTML = seasonNums.map((s, i) =>
    `<button class="season-btn ${i === 0 ? 'active' : ''}" data-season="${s}">Season ${s}</button>`
  ).join('');

  function showSeason(num) {
    const eps = seasons[num] || [];
    listEl.innerHTML = eps.map(ep => `
      <div class="episode-item">
        <div class="episode-number">${ep.number || '?'}</div>
        <div class="episode-info">
          <div class="episode-name">${ep.name || 'TBA'}</div>
          <div class="episode-airdate">${ep.airdate || ''}</div>
          <div class="episode-summary">${ep.summary ? ep.summary.replace(/<[^>]+>/g, '') : ''}</div>
        </div>
      </div>
    `).join('');
  }

  // Show first season
  showSeason(seasonNums[0]);

  // Season button clicks
  selectorEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.season-btn');
    if (!btn) return;
    selectorEl.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    showSeason(Number(btn.dataset.season));
  });

  guideEl.hidden = false;
}

// Render YouTube trailer
function renderTrailer(youtubeKey) {
  const container = document.getElementById('trailer-container');
  const section = document.getElementById('modal-trailer');

  container.innerHTML = `
    <button class="trailer-play-btn" id="trailer-play-btn" aria-label="Play trailer">
      <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
      <span>Watch Trailer</span>
    </button>
    <div class="trailer-video" id="trailer-video" hidden>
      <iframe
        src=""
        data-src="https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0"
        title="Trailer"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
      <button class="trailer-close-btn" id="trailer-close-btn" aria-label="Close trailer">&times;</button>
    </div>
  `;

  const playBtn = document.getElementById('trailer-play-btn');
  const videoContainer = document.getElementById('trailer-video');
  const iframe = videoContainer.querySelector('iframe');
  const closeBtn = document.getElementById('trailer-close-btn');

  playBtn.addEventListener('click', () => {
    iframe.src = iframe.dataset.src;
    videoContainer.hidden = false;
    playBtn.hidden = true;
  });

  closeBtn.addEventListener('click', () => {
    iframe.src = '';
    videoContainer.hidden = true;
    playBtn.hidden = false;
  });

  section.hidden = false;
}

// Render watch providers (streaming services)
function renderWatchProviders(providers) {
  const container = document.getElementById('providers-list');
  const section = document.getElementById('modal-providers');

  const allProviders = [];

  // Flatrate = subscription streaming (Netflix, etc)
  if (providers.flatrate?.length) {
    providers.flatrate.forEach(p => {
      allProviders.push({ ...p, type: 'stream' });
    });
  }

  // Free = free with ads
  if (providers.free?.length) {
    providers.free.forEach(p => {
      allProviders.push({ ...p, type: 'free' });
    });
  }

  // Rent
  if (providers.rent?.length) {
    providers.rent.slice(0, 4).forEach(p => {
      allProviders.push({ ...p, type: 'rent' });
    });
  }

  // Buy
  if (providers.buy?.length) {
    providers.buy.slice(0, 4).forEach(p => {
      if (!allProviders.find(x => x.provider_id === p.provider_id)) {
        allProviders.push({ ...p, type: 'buy' });
      }
    });
  }

  if (allProviders.length === 0) {
    section.hidden = true;
    return;
  }

  // Deduplicate by provider_id
  const unique = allProviders.filter((p, i, arr) =>
    arr.findIndex(x => x.provider_id === p.provider_id) === i
  ).slice(0, 8);

  container.innerHTML = unique.map(p => `
    <a href="${providers.link || '#'}" target="_blank" rel="noopener" class="provider-item" title="${p.provider_name}">
      <img src="https://image.tmdb.org/t/p/w92${p.logo_path}" alt="${p.provider_name}" loading="lazy">
      <span class="provider-type">${p.type === 'stream' ? 'Stream' : p.type === 'free' ? 'Free' : p.type === 'rent' ? 'Rent' : 'Buy'}</span>
    </a>
  `).join('');

  section.hidden = false;
}
