# 🎬 StreamFinder

**Your ultimate destination for discovering movies and TV shows across all streaming platforms — without the endless scrolling.**

StreamFinder is a modern, fully-featured web application built with vanilla JavaScript that helps users discover, organize, and track movies and TV shows. With advanced search capabilities, personalized watchlists, and comprehensive content information, StreamFinder makes it easy to find your next binge-worthy title.

---

## ✨ Features

### 🔍 **Multi-Source Search**
- Real-time autocomplete with live suggestions
- Simultaneous search across TMDB and TVMaze APIs
- Smart duplicate detection and data normalization
- Debounced search (250ms) for optimal performance

### 🎯 **Advanced Filtering & Discovery**
- Filter by genre (19 movie + 16 TV genres)
- Year range filtering (from/to)
- Minimum rating slider (0-10 scale)
- Content type filtering (Movies, TV Shows, or Both)
- Multiple sort options (Popularity, Rating, Release Date)
- Filter state persistence across sessions

### 📚 **Organized Watchlist**
- **Category Management**: Organize your watchlist into:
  - **To Watch** — Content you want to watch
  - **Watching Now** — Currently watching
  - **Already Watched** — Completed content
- Tab-based filtering with live item counts
- Quick category switching via dropdown on each card
- Persistent storage using localStorage
- One-click add/remove functionality

### 🎭 **Cast & Actor Pages**
- Clickable cast members in movie/TV detail views
- Dedicated actor profile pages with:
  - Professional headshot
  - Biography
  - Complete filmography ("Known For" section)
  - Top 20 credits sorted by popularity
- Seamless navigation between content and cast

### 📺 **Detailed Content Views**
- High-quality posters and backdrop images
- Complete metadata (runtime, seasons, release year, language)
- Genre tags and star ratings with vote counts
- Cast preview with top actors
- **Episode Guide** for TV shows (season-by-season breakdown)
- **Trailers** — Watch YouTube trailers directly in-app
- **Where to Watch** — See streaming availability (Netflix, Hulu, etc.)
- Related "Similar Titles" carousel

### 🎲 **Surprise Me**
- Random content picker when you can't decide
- Optional filters (type and genre)
- Smooth animations and instant results

### 🎨 **Polished User Experience**
- **Dark/Light Theme Toggle** — Seamless theme switching
- **Trending Content** — Homepage carousels with trending, top-rated, and upcoming titles
- **Genre Browse** — Explore content by specific genres
- **Recent Search History** — Quick access to past searches
- **Skeleton Loaders** — Smooth loading states during data fetches
- **Responsive Design** — Optimized for desktop, tablet, and mobile (360px+)
- **Touch Device Support** — Larger tap targets and always-visible controls
- **Keyboard Navigation** — Full keyboard accessibility
- **ARIA Labels** — Screen reader support throughout

---

## 🛠️ Tech Stack

**Frontend:**
- **Vanilla JavaScript (ES6 Modules)** — No frameworks, pure modern JS
- **HTML5** — Semantic markup
- **CSS3** — Custom properties (CSS variables), Grid, Flexbox
- **Modular Architecture** — Clean separation of concerns

**APIs:**
- **TMDB (The Movie Database)** — Movies, TV shows, trending, search, trailers, streaming providers, cast/crew
- **TVMaze** — TV show episodes, seasons, detailed cast information

**Storage:**
- **localStorage** — Watchlist, recent searches, theme preference, filter state

**Design:**
- **Netflix-inspired UI** — Dark theme with red accent (#E50914)
- **Google Fonts** — Bebas Neue (headings), Inter (body)
- **Mobile-First** — Responsive breakpoints at 360px, 480px, 768px, 1200px

---

## 📂 Project Structure

```
StreamFinder/
├── index.html              # Homepage with hero and trending carousels
├── search.html             # Advanced search page with filters
├── genre.html              # Genre browsing and discovery
├── watchlist.html          # Personal watchlist with categories
├── person.html             # Actor/cast member profile page
├── css/
│   ├── main.css            # Global styles, layout, variables
│   ├── components.css      # Cards, modals, buttons, forms
│   ├── animations.css      # Skeleton loaders, transitions
│   └── responsive.css      # Media queries for all breakpoints
├── js/
│   ├── main.js             # App initialization, page routing
│   ├── api/
│   │   ├── tmdb.js         # TMDB API wrapper functions
│   │   └── tvmaze.js       # TVMaze API wrapper functions
│   ├── components/
│   │   ├── search.js       # Search bar, autocomplete
│   │   ├── filters.js      # Filter UI and logic
│   │   ├── modal.js        # Detail modal with episode guide
│   │   └── cards.js        # Card rendering, watchlist integration
│   └── utils/
│       ├── helpers.js      # Data normalization, formatting
│       └── storage.js      # localStorage management
├── data/
│   └── genres.json         # Genre ID to name mappings
└── favicon.svg             # Custom play button icon
```

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local development server (optional but recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aghadiayeamayanvboernest/StreamFinder.git
   cd StreamFinder
   ```

2. **Serve the files**

   Using Python:
   ```bash
   python -m http.server 8000
   ```

   Using Node.js (with `http-server`):
   ```bash
   npx http-server -p 8000
   ```

   Or simply open `index.html` in your browser (some features may require a server).

3. **Open in browser**
   ```
   http://localhost:8000
   ```

### API Keys

The project uses a public TMDB API key included in the code. For production use, you should:

1. Get your own API key from [TMDB](https://www.themoviedb.org/settings/api)
2. Replace the key in `js/api/tmdb.js`:
   ```javascript
   const API_KEY = 'your_api_key_here';
   ```

---

## 💡 Usage

### Search for Content
1. Use the search bar in the header (available on all pages)
2. Type at least 2 characters to see autocomplete suggestions
3. Press Enter or click a suggestion to view results
4. Apply filters on the search page (genre, year, rating, type)

### Manage Your Watchlist
1. Click the **+** button on any movie/TV card to add to watchlist
2. Navigate to the **Watchlist** page
3. Use category tabs to filter: **All**, **To Watch**, **Watching Now**, **Already Watched**
4. Change a title's category using the dropdown at the bottom of each card
5. Click the **×** button to remove from watchlist

### Explore Cast & Crew
1. Open any movie or TV show detail modal
2. Click on a cast member's name or photo
3. View their full profile with biography and filmography
4. Click any credit to view that movie/show's details

### Discover Content
- **Home Page** — Browse trending content, top rated, and upcoming releases
- **Genres** — Explore 35+ genres with pagination
- **Surprise Me** — Let the app pick something random for you
- **Similar Titles** — Find related content in each detail modal

### Keyboard Shortcuts
- `Escape` — Close modals
- `Arrow Keys` — Navigate autocomplete suggestions
- `Enter` — Submit search or select suggestion

---

## 🎨 Features in Detail

### Watchlist Categories
Organize your watchlist with three default categories:
- **To Watch** — New additions default here
- **Watching Now** — Currently in progress
- **Already Watched** — Completed content

Categories are stored locally and persist across sessions. Switch categories instantly with the dropdown on each card, and filter your view with the pill-style tabs showing live counts.

### Cast & Actor Pages
Every cast member in TMDB content is clickable, leading to a dedicated profile page featuring:
- **Circular profile photo** with graceful fallback
- **Full biography** (if available)
- **Known For section** — Top 20 credits sorted by popularity
- **Clickable filmography** — Each credit opens the detail modal
- **Responsive layout** — Stacks vertically on mobile

TVMaze cast members are displayed but not linked (different API, no person IDs).

### Streaming Availability
The "Where to Watch" section shows:
- **Subscription services** (Netflix, Hulu, Disney+, etc.)
- **Free with ads** options
- **Rental** providers
- **Purchase** options

Powered by TMDB's watch providers endpoint (US region).

### Episode Guide
For TV shows, get a complete breakdown:
- Season selector buttons
- Episode numbers, titles, and air dates
- Episode summaries (HTML tags stripped)
- Seamless season switching

---

## 📱 Responsive Design

StreamFinder is fully responsive with optimized layouts for:

- **Desktop (1200px+)** — 6-column grid, spacious layout
- **Tablet (768px)** — 4-column grid, collapsible filters
- **Mobile (480px)** — 3-column grid, bottom navigation
- **Small Mobile (360px)** — 2-column grid, compact UI

### Mobile Features
- **Bottom Navigation Bar** — Easy thumb access to Home, Search, Genres, Watchlist
- **Hamburger Menu** — Slide-out filter sidebar (search page only)
- **Touch Optimizations** — 44px minimum tap targets
- **iOS Zoom Prevention** — 16px input font size
- **Always-Visible Controls** — Watchlist buttons, category selects

---

## 🧩 Architecture

### Modular JavaScript
- **ES6 Modules** with import/export
- **Async/await** for API calls
- **Promise.allSettled** for parallel requests
- **Event delegation** for efficient DOM handling
- **Custom events** for reactive updates (watchlist-changed)

### Data Flow
1. **Page Detection** → Routes to init function (Home, Search, Genre, Watchlist, Person)
2. **API Calls** → Fetched via dedicated wrappers
3. **Normalization** → TMDB/TVMaze → unified format
4. **Rendering** → Cards → Click → Modal → Cast → Person Page
5. **Storage** → localStorage → Persistent state

### Error Handling
- Try-catch on all API calls
- Promise.allSettled for non-critical parallel requests
- Graceful fallbacks for missing data (images, bio, etc.)
- User-friendly error states with retry buttons

---

## 🌐 API Integration

### TMDB API
- **Base URL:** `https://api.themoviedb.org/3`
- **Endpoints Used:**
  - `/search/movie`, `/search/tv` — Search
  - `/trending/{media_type}/{time_window}` — Trending content
  - `/discover/movie`, `/discover/tv` — Filtered discovery
  - `/movie/{id}`, `/tv/{id}` — Details
  - `/movie/{id}/credits`, `/tv/{id}/credits` — Cast & crew
  - `/movie/{id}/videos`, `/tv/{id}/videos` — Trailers
  - `/movie/{id}/watch/providers`, `/tv/{id}/watch/providers` — Streaming
  - `/person/{id}` — Actor details
  - `/person/{id}/combined_credits` — Filmography

### TVMaze API
- **Base URL:** `https://api.tvmaze.com`
- **Endpoints Used:**
  - `/search/shows` — TV show search
  - `/shows/{id}/episodes` — Episode guide
  - `/shows/{id}/cast` — Cast information

---

## 🎯 Future Enhancements

Potential features for future iterations:
- User authentication and cloud sync
- Social features (share lists, rate/review)
- Notifications for new episodes
- Advanced stats and insights
- PWA support for offline access
- Export watchlist to CSV/JSON
- Compare mode for side-by-side analysis

---

## 👨‍💻 Author

**Aghadiaye Amayanvbo Ernest**

- LinkedIn: [ernest-jacob](https://www.linkedin.com/in/ernest-jacob)
- GitHub: [@aghadiayeamayanvboernest](https://github.com/aghadiayeamayanvboernest)
- Email: ernestjacob789@gmail.com

---

## 📄 License

This project is built for educational purposes as part of a web development portfolio.

---

## 🙏 Acknowledgments

- **TMDB** — Comprehensive movie and TV database
- **TVMaze** — Detailed TV show episode data
- **Google Fonts** — Bebas Neue and Inter typefaces
- **Claude AI** — Development assistance and pair programming

---

## 📸 Screenshots

*(Add screenshots of your app here)*

- Homepage with trending carousels
- Search page with filters
- Watchlist with categories
- Detail modal with cast
- Actor profile page
- Mobile responsive views

---

**Built with ❤️ using Vanilla JavaScript**
