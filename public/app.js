// =============================================================
// VOLTIXZ GAMES — ARCADE POSTER PORTAL & MULTI-ZONE ENGINE
// =============================================================

// State Variables
let currentUser = null;
let currentToken = localStorage.getItem('ott_jwt') || null;
let allFreeGames = [];
let activeCategory = 'all';
let userCoinBalance = (currentToken && !localStorage.getItem('ott_is_guest')) ? (parseInt(localStorage.getItem('ott_coins')) || 0) : 0;
let userBonusCoins = (currentToken && !localStorage.getItem('ott_is_guest')) ? (parseInt(localStorage.getItem('ott_bonus_coins')) || 0) : 0;
let lastRewardTime = 0;

// Global fast lookup map for all games
window.gameMap = {};

// Clean titles from dirty entities or suffixes
function cleanGameTitle(rawTitle) {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\(vs Smart AI\)/gi, '')
    .trim();
}

// Format multi-word game title for 3D poster stamp (1 or 2 lines)
function formatPosterLogoTitle(cleanTitle) {
  const words = cleanTitle.toUpperCase().split(' ');
  if (words.length <= 1) return words[0];
  if (words.length === 2) return `${words[0]}<br>${words[1]}`;
  if (words.length === 3) return `${words[0]} ${words[1]}<br>${words[2]}`;
  const mid = Math.ceil(words.length / 2);
  return `${words.slice(0, mid).join(' ')}<br>${words.slice(mid).join(' ')}`;
}

// -------------------------------------------------------------
// 1. PLAY WITH AI GAMES (6 Dedicated Real In-House Titles)
// -------------------------------------------------------------
const AI_GAMES = [
  {
    slug: 'ludo-hero-ai',
    title: 'Ludo Hero',
    badge: 'AI BOT',
    subtitle: 'Classic 15x15 Indian Board',
    thumbnail: '/assets/ludo_art.png',
    logoStyle: 'title-3d-cartoon',
    url: '/games/ludo_ai.html',
    rating: '4.9',
    plays: '42.8k'
  },
  {
    slug: 'carrom-clash-ai',
    title: 'Carrom Clash',
    badge: 'PHYSICS BOT',
    subtitle: 'Real Pocket Striker Arena',
    thumbnail: '/assets/posters/carrom-pool.svg',
    logoStyle: 'title-3d-gold',
    url: '/games/carrom_ai.html',
    rating: '4.9',
    plays: '38.5k'
  },
  {
    slug: 'chess-master-ai',
    title: 'Master Chess',
    badge: 'TACTICAL BOT',
    subtitle: 'Classic 8x8 Strategy Match',
    thumbnail: '/assets/posters/chess-master-ai.svg',
    logoStyle: 'title-3d-gold',
    url: '/games/chess_ai.html',
    rating: '4.8',
    plays: '34.2k'
  },
  {
    slug: 'checkers-classic-ai',
    title: 'Classic Checkers',
    badge: 'SMART AI',
    subtitle: 'Diagonal Jump & Crown King',
    thumbnail: '/assets/posters/checkers-classic-ai.svg',
    logoStyle: 'title-3d-fire',
    url: '/games/checkers_ai.html',
    rating: '4.8',
    plays: '26.4k'
  },
  {
    slug: 'connect4-arena-ai',
    title: 'Connect 4 Arena',
    badge: 'AI ENGINE',
    subtitle: 'Connect 4-in-a-Row Discs',
    thumbnail: '/assets/posters/connect4-arena-ai.svg',
    logoStyle: 'title-3d-cyber',
    url: '/games/connect4_ai.html',
    rating: '4.8',
    plays: '28.1k'
  },
  {
    slug: 'tictactoe-neon-ai',
    title: 'Neon Tic-Tac-Toe',
    badge: 'UNBEATABLE',
    subtitle: '3x3 Quick Tactical Arena',
    thumbnail: '/assets/posters/tictactoe-neon-ai.svg',
    logoStyle: 'title-3d-purple',
    url: '/games/tictactoe_ai.html',
    rating: '4.7',
    plays: '33.9k'
  }
];

// Register AI games in global map
AI_GAMES.forEach(g => { window.gameMap[g.slug] = g; });

// -------------------------------------------------------------
// 2. CURATED LOGO 3D STYLE & BADGE ASSIGNER
// -------------------------------------------------------------
function getGameLogoStyleAndBadge(title, category) {
  const t = title.toLowerCase();

  if (t.includes('carrom') || t.includes('pool')) {
    return { logoStyle: 'title-3d-gold', badge: 'POPULAR' };
  }
  if (t.includes('drive') || t.includes('fury') || t.includes('racing')) {
    return { logoStyle: 'title-3d-speed', badge: 'SPEED' };
  }
  if (t.includes('watermelon') || t.includes('fruit') || t.includes('slash')) {
    return { logoStyle: 'title-3d-cartoon', badge: 'HIT' };
  }
  if (t.includes('bubble')) {
    return { logoStyle: 'title-3d-purple', badge: 'CASUAL' };
  }
  if (t.includes('level') || t.includes('devil')) {
    return { logoStyle: 'title-3d-fire', badge: 'TRICKY' };
  }
  if (t.includes('slope') || t.includes('neon') || t.includes('run')) {
    return { logoStyle: 'title-3d-cyber', badge: '3D' };
  }
  if (t.includes('2048') || t.includes('cookie')) {
    return { logoStyle: 'title-3d-gold', badge: 'HIT' };
  }
  if (t.includes('brick') || t.includes('tetris') || t.includes('pong')) {
    return { logoStyle: 'title-3d-cyber', badge: 'RETRO' };
  }
  if (t.includes('snake') || t.includes('dino') || t.includes('t-rex')) {
    return { logoStyle: 'title-3d-emerald', badge: 'CLASSIC' };
  }
  if (t.includes('basketball')) {
    return { logoStyle: 'title-3d-fire', badge: 'SPORTS' };
  }
  if (t.includes('sudoku') || t.includes('minesweeper') || t.includes('puzzle')) {
    return { logoStyle: 'title-3d-cyber', badge: 'LOGIC' };
  }
  if (t.includes('cut the rope') || t.includes('candy')) {
    return { logoStyle: 'title-3d-cartoon', badge: 'POPULAR' };
  }
  if (t.includes('solitaire') || t.includes('card')) {
    return { logoStyle: 'title-3d-gold', badge: 'CLASSIC' };
  }

  // Category defaults
  if (category === 'action') return { logoStyle: 'title-3d-fire', badge: 'ACTION' };
  if (category === 'puzzle') return { logoStyle: 'title-3d-purple', badge: 'PUZZLE' };
  if (category === 'sports') return { logoStyle: 'title-3d-emerald', badge: 'SPORTS' };
  return { logoStyle: 'title-3d-cartoon', badge: 'FREE' };
}

// -------------------------------------------------------------
// 3. RENDER VERTICAL POSTER CARD (Authentic Arcade Poster)
// -------------------------------------------------------------
function renderPosterCard(game, isAi = false) {
  // Ensure game is cached in lookup map
  window.gameMap[game.slug] = game;

  const cleanTitle = cleanGameTitle(game.title);
  const isPremium = !!game.is_premium;
  const subscribed = isUserSubscribed();

  const meta = isAi ? {
    logoStyle: game.logoStyle || 'title-3d-cartoon',
    badge: game.badge || 'AI BOT'
  } : getGameLogoStyleAndBadge(cleanTitle, game.category);

  // Automatically resolve to clean local poster if missing, premium, or external banner
  let thumbUrl = game.thumbnail;
  if (!thumbUrl || isPremium || thumbUrl.includes('gamezipper.com') || thumbUrl.includes('puzzle.png') || thumbUrl.includes('ottsol.cloud')) {
    thumbUrl = `/assets/posters/${game.slug}.svg`;
  }

  const rating = game.rating || '4.8';

  const badgeHtml = isPremium ? `
    <span class="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-black/90 text-amber-300 border border-amber-400/70 backdrop-blur-sm shadow-md flex items-center gap-1">
      <i class="fa-solid fa-crown text-[8px] text-amber-400"></i> VIP 3D
    </span>
  ` : `
    <span class="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-black/80 text-amber-300 border border-amber-400/40 backdrop-blur-sm shadow-md">
      ${isAi ? '<i class="fa-solid fa-robot mr-0.5 text-[8px]"></i> BOT' : meta.badge}
    </span>
  `;

  const overlayHtml = `
    <!-- Hover Glow Overlay -->
    <div class="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
      <span class="px-2.5 py-1 rounded-full bg-gradient-to-r from-neonCyan to-blue-600 text-black font-black text-[10px] flex items-center gap-1 shadow-lg shadow-cyan-500/40">
        <i class="fa-solid fa-play text-[8px]"></i> PLAY
      </span>
    </div>
  `;

  return `
    <div onclick="launchGameBySlug('${game.slug}')" 
         class="game-poster-card group shrink-0 ${isPremium ? 'border border-amber-500/35 shadow-amber-500/10 hover:border-amber-400' : ''}" 
         title="${cleanTitle}">
      
      <!-- Top Artwork Area with HD Vector / 3D Art -->
      <div class="flex-1 relative overflow-hidden bg-slate-950 select-none">
        
        <img src="${thumbUrl}" 
             alt="${cleanTitle}"
             loading="lazy"
             onerror="this.onerror=null; this.src='/assets/posters/${game.slug}.svg';"
             class="w-full h-full object-cover group-hover:scale-108 group-hover:brightness-110 transition-all duration-300">

        <!-- Top Metadata Row: Badge, Rating & Favorite Heart -->
        <div class="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
          ${badgeHtml}
          <div class="flex items-center gap-1">
            <span class="text-[9px] font-bold text-white px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm flex items-center gap-0.5 shadow-md">
              <i class="fa-solid fa-star text-amber-400 text-[8px]"></i> ${rating}
            </span>
            <button onclick="event.stopPropagation(); toggleFavoriteGame('${game.slug}');" data-fav-slug="${game.slug}" title="Save to Favorites" class="pointer-events-auto w-5 h-5 rounded-md bg-black/70 hover:bg-black text-[9px] flex items-center justify-center transition-transform active:scale-125 cursor-pointer shadow-md">
              <i class="fa-heart ${isFavoriteGame(game.slug) ? 'fa-solid text-rose-500' : 'fa-regular text-gray-300 hover:text-rose-400'}"></i>
            </button>
          </div>
        </div>

        <!-- Gradient fade to dark bottom bar -->
        <div class="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#070B18] to-transparent pointer-events-none"></div>

        ${overlayHtml}
      </div>

      <!-- Bottom Dark Title Bar -->
      <div class="h-10 px-2 flex flex-col items-center justify-center bg-[#070B18] border-t ${isPremium ? 'border-amber-500/20' : 'border-white/10'} shrink-0">
        <span class="text-[11px] sm:text-xs font-bold text-gray-100 truncate w-full text-center tracking-wide ${isPremium ? 'group-hover:text-amber-400' : 'group-hover:text-neonCyan'} transition-colors">
          ${cleanTitle}
        </span>
        <span class="text-[8.5px] font-semibold ${isPremium ? 'text-amber-400 font-bold' : 'text-gray-400'} uppercase tracking-wider">
          ${isPremium ? '👑 VIP Exclusive' : (isAi ? 'Smart AI' : (game.category || 'Arcade'))}
        </span>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 4. CAROUSEL SCROLL CONTROLLER
// -------------------------------------------------------------
function scrollRow(rowId, delta) {
  const el = document.getElementById(rowId);
  if (el) {
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }
}

function scrollToSection(target) {
  const container = document.getElementById('all-games-container');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth' });
  }
  if (target === 'prime-zone') {
    filterAllCategory('all');
  } else if (target === 'rapid-zone') {
    filterAllCategory('action');
  } else if (target === 'puzzle-zone') {
    filterAllCategory('puzzle');
  }
}

// -------------------------------------------------------------
// 5. INITIALIZATION & DATA LOADING
// -------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
  renderAiRow();
  initSoundFX();
  await checkAuthSession();
  await loadFreeGamesCatalog();
  refreshWalletModalData();

  // URL Auto-Launcher (?game=slug)
  const urlParams = new URLSearchParams(window.location.search);
  const targetSlug = urlParams.get('game');
  if (targetSlug) {
    setTimeout(() => {
      launchGameBySlug(targetSlug);
    }, 400);
  }
});

// Render Play with AI Zone Row
function renderAiRow() {
  const container = document.getElementById('aiRow');
  if (!container) return;
  container.innerHTML = AI_GAMES.map(g => renderPosterCard(g, true)).join('');
}

// Fetch all games with dual-redundant fallback (DB -> local JSON)
async function loadFreeGamesCatalog() {
  let loadedGames = [];
  try {
    const res = await fetch('/api/games');
    const data = await res.json();
    if (data.success && Array.isArray(data.games) && data.games.length > 0) {
      loadedGames = data.games;
    } else {
      throw new Error('API returned empty games list');
    }
  } catch (err) {
    console.warn('Primary /api/games failed, fetching local backup catalog:', err.message);
    try {
      const fallbackRes = await fetch('/parsed_games_57.json');
      const fallbackData = await fallbackRes.json();
      if (Array.isArray(fallbackData) && fallbackData.length > 0) {
        loadedGames = fallbackData;
      }
    } catch (fallbackErr) {
      console.error('Fallback catalog also failed:', fallbackErr);
    }
  }

  if (loadedGames.length > 0) {
    const aiSlugs = new Set(['ludo-hero-ai', 'carrom-clash-ai', 'chess-master-ai', 'checkers-classic-ai', 'connect4-arena-ai', 'tictactoe-neon-ai', 'ludo', 'carrom-pool', 'chess', 'checkers', 'tic-tac-toe']);
    allFreeGames = loadedGames.map(g => {
      if (!g.thumbnail || g.is_premium || g.thumbnail.includes('gamezipper.com') || g.thumbnail.includes('puzzle.png') || g.thumbnail.includes('ottsol.cloud')) {
        g.thumbnail = `/assets/posters/${g.slug}.svg`;
      }
      return g;
    }).filter(g => !aiSlugs.has(g.slug) && !g.is_multiplayer);
    allFreeGames.forEach(g => { window.gameMap[g.slug] = g; });
    populateCarouselZones(allFreeGames);
    filterAllCategory('all');
  }
}

// Populate the Prime, Rapid Fire, and Puzzle Carousels
function populateCarouselZones(games) {
  // Curate and populate OTT Exclusive VIP Arena Row
  const vipContainer = document.getElementById('vipRow');
  const vipGames = games.filter(g => g.is_premium);
  if (vipContainer) {
    vipContainer.innerHTML = vipGames.map(g => renderPosterCard(g, false)).join('');
  }

  // Update VIP Badge / button in VIP Section
  const vipStatusBadge = document.getElementById('vipStatusBadge');
  const vipSubscribeHeaderBtn = document.getElementById('vipSubscribeHeaderBtn');
  const isSub = isUserSubscribed();
  if (vipStatusBadge) {
    if (isSub) {
      vipStatusBadge.textContent = '👑 VIP ACTIVE';
      vipStatusBadge.className = 'text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/50';
    } else {
      vipStatusBadge.textContent = 'SUBSCRIBE TO UNLOCK';
      vipStatusBadge.className = 'text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-400/50';
    }
  }
  if (vipSubscribeHeaderBtn) {
    if (isSub) {
      vipSubscribeHeaderBtn.innerHTML = '<i class="fa-solid fa-crown text-xs"></i> <span>VIP Active</span>';
      vipSubscribeHeaderBtn.className = 'px-3.5 py-1.5 rounded-xl bg-emerald-500 text-black font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer';
    } else {
      vipSubscribeHeaderBtn.innerHTML = '<i class="fa-solid fa-gem text-xs"></i> <span>Unlock VIP</span>';
      vipSubscribeHeaderBtn.className = 'px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer';
    }
  }

  const primeContainer = document.getElementById('primeRow');
  const rapidContainer = document.getElementById('rapidRow');
  const puzzleContainer = document.getElementById('puzzleRow');

  // Curate Prime Zone Hits (exclude VIP games to keep rows distinct)
  const nonVipGames = games.filter(g => !g.is_premium);
  const primeKeywords = ['carrom', 'drive', 'watermelon', 'bubble', 'fruit', 'moto', 'penalty', 'arena', '2048', 'brick', 'snake', 'basketball', 'flappy', 'run'];
  const primeGames = nonVipGames.filter(g => primeKeywords.some(k => g.title.toLowerCase().includes(k)));
  const remainingPrime = nonVipGames.filter(g => !primeGames.includes(g));
  const fullPrimeList = [...primeGames, ...remainingPrime.slice(0, 5)];

  if (primeContainer) {
    primeContainer.innerHTML = fullPrimeList.slice(0, 15).map(g => renderPosterCard(g, false)).join('');
  }

  // Curate Rapid Fire Action & Fast Hits
  const rapidKeywords = ['devil', 'dino', 'arrow', 'sand', 'stack', 'steam', 'kitchen', 'typing', 'paint', 'escape', 'pong', 'speed', 'rush', 'fury'];
  const rapidGames = nonVipGames.filter(g => rapidKeywords.some(k => g.title.toLowerCase().includes(k)) || g.category === 'action');
  if (rapidContainer) {
    rapidContainer.innerHTML = (rapidGames.length > 0 ? rapidGames : nonVipGames).slice(0, 15).map(g => renderPosterCard(g, false)).join('');
  }

  // Curate Brain & Puzzle Arena
  const puzzleKeywords = ['rope', 'wood', 'sudoku', 'unblock', 'nonogram', 'jigsaw', 'alchemy', 'mahjong', 'solitaire', 'minesweeper', 'trivia', 'flow', 'crystal', 'word', 'dots', 'reversi', 'go'];
  const puzzleGames = nonVipGames.filter(g => puzzleKeywords.some(k => g.title.toLowerCase().includes(k)) || g.category === 'puzzle');
  if (puzzleContainer) {
    puzzleContainer.innerHTML = (puzzleGames.length > 0 ? puzzleGames : nonVipGames).slice(0, 15).map(g => renderPosterCard(g, false)).join('');
  }
}

// Render the main filterable explorer grid
function renderAllGamesGrid(games) {
  const grid = document.getElementById('allGamesGrid');
  if (!grid) return;

  if (games.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-gray-500">
        <i class="fa-solid fa-gamepad text-4xl mb-3 block text-gray-600"></i>
        <p class="text-sm font-semibold">No games found in this category.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = games.map(g => renderPosterCard(g, false)).join('');
}

// Category filter tabs controller
function filterAllCategory(category) {
  activeCategory = category;
  document.querySelectorAll('#categoryFilterTabs .cat-pill').forEach(btn => {
    const isCat = btn.getAttribute('data-cat') === category;
    if (isCat) {
      if (category === 'premium') {
        btn.className = 'cat-pill active px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-black transition-all shadow-md shadow-amber-500/30';
      } else if (category === 'favorites') {
        btn.className = 'cat-pill active px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500 text-white transition-all shadow-md shadow-rose-500/30 flex items-center gap-1.5';
      } else {
        btn.className = 'cat-pill active px-3.5 py-1.5 rounded-lg text-xs font-bold bg-neonCyan text-black transition-all';
      }
    } else {
      if (btn.getAttribute('data-cat') === 'premium') {
        btn.className = 'cat-pill px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-400 hover:text-black transition-all flex items-center gap-1.5';
      } else if (btn.getAttribute('data-cat') === 'favorites') {
        btn.className = 'cat-pill px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1.5';
      } else {
        btn.className = 'cat-pill px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 border border-white/10 text-gray-300 hover:border-neonCyan transition-all';
      }
    }
  });

  const subtitle = document.getElementById('allCountSubtitle');
  if (category === 'favorites') {
    const favSlugs = new Set(getFavoriteSlugs());
    const filtered = allFreeGames.filter(g => favSlugs.has(g.slug));
    if (subtitle) subtitle.textContent = `Showing ${filtered.length} Bookmarked Favorites`;
    if (filtered.length === 0) {
      const grid = document.getElementById('allGamesGrid');
      if (grid) {
        grid.innerHTML = `
          <div class="col-span-full py-16 text-center text-gray-400">
            <i class="fa-solid fa-heart-crack text-4xl mb-3 block text-rose-500/50"></i>
            <p class="text-sm font-bold text-white">No favorite games saved yet!</p>
            <p class="text-xs text-gray-500 mt-1">Tap the heart ❤️ on any game poster card to save it here.</p>
          </div>
        `;
      }
      return;
    }
    renderAllGamesGrid(filtered);
  } else if (category === 'premium') {
    const filtered = allFreeGames.filter(g => g.is_premium);
    if (subtitle) subtitle.textContent = `Showing ${filtered.length} VIP Exclusive 3D Games`;
    renderAllGamesGrid(filtered);
  } else if (category === 'all') {
    const freeList = allFreeGames.filter(g => !g.is_premium);
    if (subtitle) subtitle.textContent = `Showing all ${freeList.length} Games`;
    renderAllGamesGrid(freeList);
  } else {
    const filtered = allFreeGames.filter(g => !g.is_premium && g.category === category);
    if (subtitle) subtitle.textContent = `Showing ${filtered.length} ${category.toUpperCase()} Games`;
    renderAllGamesGrid(filtered);
  }
}

// Global Search input handler
function handleSearch(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    filterAllCategory(activeCategory);
    return;
  }
  const pool = activeCategory === 'premium'
    ? allFreeGames.filter(g => g.is_premium)
    : allFreeGames.filter(g => !g.is_premium);
  const filtered = pool.filter(g => 
    g.title.toLowerCase().includes(q) || 
    g.category.toLowerCase().includes(q)
  );
  renderAllGamesGrid(filtered);
}

// -------------------------------------------------------------
// 6. SAFE GAME LAUNCHER & IN-APP THEATER (With Multi-Aspect Cabinet Controller)
// -------------------------------------------------------------
const PORTRAIT_GAMES = new Set([
  'cut-the-rope',
  'magic-sort', 'memory-master', 
  'arrow-escape', 'sand-balls', 'fruit-slash', 'watermelon-merge', 
  'block-stacker', 'cyberpunk-flappy', 'bubble-shooter',
  'cloud-amp-sheep', 'paint-splash',
  'cut-the-rope-experiments', 'cut-the-rope-magic',
  'om-nom-run', 'om-nom-bubbles', 'cannon-balls-3d', 'tower-crash-3d',
  'table-tennis-world-tour', 'archery-world-tour'
]);

const STANDARD_GAMES = new Set([
  'flow-connect', 'classic-minesweeper', 'classic-sudoku', 'crossword-puzzle', 
  'nonogram-puzzle', 'jigsaw-puzzle', 'unblock-me', 'word-connections', 
  'go', 'dots-and-boxes', 'queens-puzzle', 
  'mahjong-solitaire', 'sliding-puzzle', '2048-galaxy',
  'ludo-hero-ai', 'carrom-clash-ai', 'chess-master-ai',
  'checkers-classic-ai', 'connect4-arena-ai', 'tictactoe-neon-ai',
  'pong'
]);

let currentTheaterSize = 'standard';
window.currentTheaterGameOrientation = 'landscape';

function setTheaterSize(mode) {
  currentTheaterSize = mode;
  const container = document.getElementById('theaterFrameContainer');
  const btnMobile = document.getElementById('theaterSizeMobile');
  const btnStandard = document.getElementById('theaterSizeStandard');
  const btnWide = document.getElementById('theaterSizeWide');

  if (!container) return;

  // Reset base classes with strict overflow protection
  container.className = 'transition-all duration-300 flex items-center justify-center relative bg-black shadow-2xl rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border border-white/10';

  const defaultBtnClass = 'px-2.5 py-1 rounded-lg text-gray-400 hover:text-white transition-all flex items-center gap-1.5';
  const activeBtnClass = 'px-2.5 py-1 rounded-lg bg-neonCyan text-black font-extrabold transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20';

  if (btnMobile) btnMobile.className = defaultBtnClass;
  if (btnStandard) btnStandard.className = defaultBtnClass;
  if (btnWide) btnWide.className = defaultBtnClass;

  const isPortrait = window.currentTheaterGameOrientation === 'portrait';
  const isMobileScreen = window.innerWidth < 640;

  if (isMobileScreen) {
    // Fill full screen cleanly on mobile devices without any letterboxing/overflow
    container.classList.add('w-full', 'h-full', 'max-w-full', 'max-h-full');
  } else if (mode === 'mobile') {
    if (isPortrait) {
      container.classList.add('w-auto', 'h-full', 'max-w-[480px]', 'max-h-full', 'aspect-[9/16]');
    } else {
      container.classList.add('w-auto', 'h-full', 'max-w-[850px]', 'max-h-full', 'aspect-[16/9]');
    }
  } else if (mode === 'standard') {
    if (isPortrait) {
      container.classList.add('w-auto', 'h-full', 'max-w-[600px]', 'max-h-full', 'aspect-[3/4]');
    } else {
      container.classList.add('w-auto', 'h-full', 'max-w-[980px]', 'max-h-full', 'aspect-[4/3]');
    }
  } else { // wide / full
    container.classList.add('w-full', 'h-full', 'max-w-full', 'max-h-full');
  }

  if (mode === 'mobile' && btnMobile) btnMobile.className = activeBtnClass;
  if (mode === 'standard' && btnStandard) btnStandard.className = activeBtnClass;
  if (mode === 'wide' && btnWide) btnWide.className = activeBtnClass;

  // Trigger resize inside iframe so responsive game engines adjust smoothly
  setTimeout(() => {
    try {
      const frame = document.getElementById('gameTheaterFrame');
      frame?.contentWindow?.dispatchEvent(new Event('resize'));
    } catch (e) {}
  }, 100);
}

// Window resize handler: auto-adjust game theater layout across screens
window.addEventListener('resize', () => {
  const overlay = document.getElementById('gameTheaterOverlay');
  if (overlay && !overlay.classList.contains('hidden')) {
    setTheaterSize(currentTheaterSize);
  }
});

let selectedModeGameSlug = null;

function openGameModeModal(slug) {
  selectedModeGameSlug = slug;
  let game = window.gameMap[slug];
  if (!game && (!window.allFreeGames || window.allFreeGames.length === 0)) {
    game = { slug, title: slug, category: 'VIP 3D' };
  }
  if (!game) {
    if (slug === 'snake') game = window.gameMap['classic-snake'];
    if (slug === 'classic-snake') game = window.gameMap['snake'];
    if (slug === '2048') game = window.gameMap['2048-galaxy'];
  }
  if (!game) {
    return launchGameBySlug(slug, true);
  }

  const modal = document.getElementById('gameModeSelectModal');
  const titleEl = document.getElementById('gameModeGameTitle');
  const badgeEl = document.getElementById('gameModeCategoryBadge');
  const posterEl = document.getElementById('gameModePosterImg');

  const cleanTitle = cleanGameTitle(game.title);
  if (titleEl) titleEl.textContent = cleanTitle;

  const isPremium = game.is_premium || game.category === 'premium' || (game.game_url || '').includes('ottsol.cloud');
  if (badgeEl) {
    if (isPremium) {
      badgeEl.textContent = '👑 VIP 3D EXCLUSIVE';
      badgeEl.className = 'text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40';
    } else {
      badgeEl.textContent = (game.category || 'ARCADE').toUpperCase() + ' ARENA';
      badgeEl.className = 'text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40';
    }
  }

  if (posterEl) {
    posterEl.src = game.thumbnail || `/assets/posters/${game.slug}.svg`;
  }

  if (modal) {
    modal.classList.remove('hidden');
    playArcadeSound('click');
  }
}

function closeGameModeModal() {
  const modal = document.getElementById('gameModeSelectModal');
  if (modal) modal.classList.add('hidden');
}

function launchSelectedGameSolo() {
  const slug = selectedModeGameSlug;
  closeGameModeModal();
  if (slug) {
    launchGameBySlug(slug, true);
  }
}

function openCreatePartyForSelectedGame() {
  const slug = selectedModeGameSlug;
  closeGameModeModal();
  if (!slug) return;

  openPartyModal();
  createPartyRoom(slug);
}

function startQuickMatchForSelectedGame() {
  const slug = selectedModeGameSlug;
  closeGameModeModal();
  openPartyModal();
  switchPartyTab('quick');
  startQuickMatchmaking(slug);
}

function launchSelectedGamePassPlay() {
  const slug = selectedModeGameSlug;
  closeGameModeModal();
  if (slug) {
    launchGameBySlug(slug, true, true);
  }
}

function joinRoomFromModeModal() {
  const input = document.getElementById('modeModalJoinCodeInput');
  const code = (input?.value || '').trim();
  if (!code) {
    if (input) {
      input.focus();
      input.classList.add('border-rose-500');
      setTimeout(() => input.classList.remove('border-rose-500'), 2000);
    }
    return;
  }
  closeGameModeModal();
  openPartyModal();
  switchPartyTab('join');
  joinPartyRoom(code);
}

// Games that support 2-player / versus / multiplayer / AI vs Human modes
const MULTIPLAYER_ELIGIBLE_GAMES = new Set([
  'ludo-hero-ai', 'ludo',
  'carrom-clash-ai', 'carrom-pool', 'carrom', 'striker-king-3d',
  'chess-master-ai', 'chess',
  'checkers-classic-ai', 'checkers',
  'connect4-arena-ai', 'connect-4', 'connect4',
  'tictactoe-neon-ai', 'tictactoe-neon', 'tic-tac-toe', 'tictactoe',
  'dice-duel', 'neon-dice-duel',
  '8-ball-billiards-classic', 'pro-billiards-3d', '8ball-pool', 'billiards',
  'power-puck-hockey', 'air-hockey',
  'table-tennis-world-tour', 'pong', 'ping-pong',
  'dots-and-boxes', 'reversi', 'go', 'trivia-crack',
  'penalty-shooters-2', 'cars-arena'
]);

function isMultiplayerGame(slug) {
  if (!slug) return false;
  const s = String(slug).toLowerCase().trim();
  if (MULTIPLAYER_ELIGIBLE_GAMES.has(s)) return true;
  const g = window.gameMap && window.gameMap[s];
  if (g && (g.is_multiplayer || g.category === '2 Player' || g.category === 'Multiplayer' || g.category === 'Board')) {
    return true;
  }
  return false;
}

async function launchGameBySlug(slug, forceDirect = false, isPassAndPlay = false) {
  // If not forcing direct play, only open Ludo King style Game Mode Selector for 2-player / versus games!
  // Single-player solo games start instantly!
  if (!forceDirect && isMultiplayerGame(slug)) {
    return openGameModeModal(slug);
  }

  let game = window.gameMap[slug];
  if (!game && (!window.allFreeGames || window.allFreeGames.length === 0)) {
    try {
      const fb = await fetch('/parsed_games_57.json').then(r => r.json());
      if (Array.isArray(fb)) {
        fb.forEach(g => { window.gameMap[g.slug] = g; });
      }
      game = window.gameMap[slug];
    } catch(e) {}
  }
  if (!game) {
    if (slug === 'snake') game = window.gameMap['classic-snake'];
    if (slug === 'classic-snake') game = window.gameMap['snake'];
    if (slug === '2048') game = window.gameMap['2048-galaxy'];
  }
  if (!game) {
    console.error('Game not found in catalog map:', slug);
    return;
  }

  // All games unlocked for instant free play!
  const title = cleanGameTitle(game.title);
  let playUrl = game.url || game.game_url;

  // Detect orientation
  const isPortrait = game.orientation === 'portrait' || PORTRAIT_GAMES.has(slug);
  window.currentTheaterGameOrientation = isPortrait ? 'portrait' : 'landscape';

  // Auto-detect optimal aspect ratio cabinet mode
  if (isPortrait) {
    setTheaterSize('mobile');
  } else if (STANDARD_GAMES.has(slug)) {
    setTheaterSize('standard');
  } else {
    setTheaterSize('wide');
  }

  // In-House Polished AI & Board Games (with Pass & Play or Live Party support)
  let gameModeParam = '';
  if (window.activePartySession && (
    window.activePartySession.slug === slug ||
    (slug.startsWith('ludo') && window.activePartySession.slug?.startsWith('ludo')) ||
    (slug.startsWith('carrom') && window.activePartySession.slug?.startsWith('carrom')) ||
    (slug.startsWith('chess') && window.activePartySession.slug?.startsWith('chess')) ||
    (slug.startsWith('checkers') && window.activePartySession.slug?.startsWith('checkers')) ||
    (slug.startsWith('connect4') && window.activePartySession.slug?.startsWith('connect4'))
  )) {
    const sess = window.activePartySession;
    const players = sess.players || [];
    const myUser = sess.myUser || getPartyUser();

    // Reliably determine player index in the match
    let myPlayerIndex = players.findIndex(p => 
      (p.id && myUser.id && String(p.id) === String(myUser.id)) ||
      (p.username && myUser.username && p.username.toLowerCase() === myUser.username.toLowerCase())
    );
    if (myPlayerIndex === -1) {
      const hostId = partyCurrentRoom?.hostId || sess.hostId || players[0]?.id;
      if (hostId && myUser?.id && String(hostId) === String(myUser.id)) {
        myPlayerIndex = 0;
      } else {
        myPlayerIndex = 1;
      }
    }
    const isHost = (myPlayerIndex === 0);

    gameModeParam = `?mode=party&room=${encodeURIComponent(sess.roomCode)}&myId=${encodeURIComponent(myUser.id || '')}&myUsername=${encodeURIComponent(myUser.username || '')}&myPlayerIndex=${myPlayerIndex}&isHost=${isHost}&players=${encodeURIComponent(JSON.stringify(players))}`;
  } else if (isPassAndPlay) {
    gameModeParam = '?mode=passplay';
  }

  if (slug === 'ludo-hero-ai' || slug === 'ludo') {
    playUrl = '/games/ludo_ai.html' + gameModeParam;
  } else if (slug === 'carrom-clash-ai' || slug === 'carrom-pool') {
    playUrl = '/games/carrom_ai.html' + gameModeParam;
  } else if (slug === 'chess-master-ai' || slug === 'chess') {
    playUrl = '/games/chess_ai.html' + gameModeParam;
  } else if (slug === 'checkers-classic-ai' || slug === 'checkers') {
    playUrl = '/games/checkers_ai.html' + gameModeParam;
  } else if (slug === 'connect4-arena-ai' || slug === 'connect-4' || slug === 'connect4') {
    playUrl = '/games/connect4_ai.html' + gameModeParam;
  } else if (slug === 'tictactoe-neon-ai' || slug === 'tic-tac-toe' || slug === 'tictactoe') {
    playUrl = '/games/tictactoe_ai.html' + gameModeParam;
  } else if (slug === 'neon-runner') {
    playUrl = '/games/runner.html?title=' + encodeURIComponent(title);
  } else if (playUrl && playUrl.startsWith('http')) {
    // Route through our clean game proxy to remove external ads & banners!
    playUrl = `/api/game-frame?url=${encodeURIComponent(playUrl)}`;
  } else {
    playUrl = '/games/runner.html?title=' + encodeURIComponent(title);
  }

  // Award Coins for playing (+10 Coins reward)
  awardGamePlayCoins(slug, title);

  openGameTheater(title, playUrl, game);
}

// -------------------------------------------------------------
// HOW TO PLAY ENCYCLOPEDIA (Full Bilingual Guide for Every Game)
// -------------------------------------------------------------
const GAME_HOW_TO_PLAY = {
  'checkers-classic-ai': {
    title: 'Classic Checkers',
    category: 'Board & Strategy',
    objective: 'Capture all of the AI opponent\'s black pieces or block them from making any legal moves.',
    controls: '🖱️ Mouse Click or 👆 Touch: Tap your glowing Red piece to select → Tap any highlighted GREEN square to move.',
    rules: `1. Regular pieces move 1 square diagonally forward onto dark squares.
2. If an AI piece is diagonally adjacent and the square behind it is empty, you can jump over it to capture and remove it!
3. Multiple consecutive jumps are allowed if another capture is open.
4. Reach the AI's back row (top row) to crown your piece into a KING 👑. Kings can move and jump both forwards and backwards!`,
    tips: `• Look for multi-jump capture chains to wipe out multiple opponent pieces in a single turn.
• Protect your back row pieces for as long as possible to prevent the AI from crowning kings.
• Central control gives your pieces more diagonal mobility and attack angles.`
  },
  'chess-master-ai': {
    title: 'Master Chess',
    category: 'Board & Strategy',
    objective: 'Checkmate the Black King so it cannot escape capture.',
    controls: '🖱️ Mouse Click or 👆 Touch: Tap your White piece → Tap a highlighted GREEN square to move or capture.',
    rules: `1. You play as White and make the first move.
2. Pawns: Move forward 1 square (or 2 on their first move); capture diagonally forward.
3. Knights: Move in an 'L' shape (2 squares in one direction, 1 square perpendicular) and can jump over pieces.
4. Bishops: Move diagonally any distance.
5. Rooks: Move horizontally or vertically any distance.
6. Queen: Moves any distance in straight or diagonal lines.
7. King: Moves 1 square in any direction. Checkmate the Black King to win!`,
    tips: `• Develop your Knights and Bishops early to control the center four squares.
• Don't bring your Queen out too early where it can be harassed by minor pieces.
• Look for forks (attacking two pieces simultaneously) with your Knights!`
  },
  'ludo-hero-ai': {
    title: 'Ludo Hero',
    category: 'Board & Family',
    objective: 'Race all 4 of your colored tokens around the board and into the central home triangle before AI.',
    controls: '👆 Touch or 🖱️ Click: Tap the Dice to roll → Tap your eligible token to move.',
    rules: `1. Roll a 6 on the dice to unlock a token from the starting base.
2. Rolling a 6 also awards you an extra bonus roll!
3. Move clockwise around the track according to the number rolled.
4. Landing on an opponent\'s token captures it and sends it back to their base!
5. Star-marked cells are Safe Zones where tokens cannot be captured.
6. Get all 4 tokens into the central Home triangle to win!`,
    tips: `• Spread your active tokens instead of keeping them clumped together.
• Park your tokens on colored Star Safe Zones whenever an AI token is trailing behind you.
• Always prioritize capturing opponent tokens to reset their progress back to zero!`
  },
  'carrom-clash-ai': {
    title: 'Carrom Pool Arena',
    category: 'Classic Sports',
    objective: 'Pocket all of your carrom men and the red Queen before the AI bot.',
    controls: '🖱️ Mouse / 👆 Touch: Slide striker left/right on baseline. Drag backwards to set aim & power, release to strike!',
    rules: `1. Place your striker anywhere along your baseline without touching the side lines.
2. Drag back to draw the aiming line and set strike power.
3. Pocket carrom men to keep your turn.
4. Pocketing the red Queen requires a 'Cover' (pocket one of your own pieces on the next strike).
5. Pocketing the striker counts as a foul and incurs a penalty piece return.`,
    tips: `• Use gentle bank shots off the wooden rails to pocket pieces tucked in tight corners.
• Only attempt to pocket the Queen when you have an easy follow-up cover shot lined up.
• Watch your striker trajectory to avoid scratching into a pocket.`
  },
  'connect4-arena-ai': {
    title: 'Connect 4 Arena',
    category: 'Puzzle & Strategy',
    objective: 'Be the first player to form a horizontal, vertical, or diagonal line of 4 of your discs.',
    controls: '👆 Touch or 🖱️ Click: Tap any of the 7 column arrows at the top of the board to drop your disc.',
    rules: `1. Players alternate turns dropping 1 disc into any unfilled column.
2. Discs fall straight down, occupying the lowest available space in that column.
3. Align 4 of your red discs in a consecutive row (up, down, across, or diagonally).
4. Watch out for AI bot traps and block the bot when it reaches 3 discs in a row!`,
    tips: `• Always claim the central column early—it offers the most winning line combinations.
• Build double-threat lines (two ways to complete 4-in-a-row) to force an unavoidable win.
• Never drop a piece right below an opponent's winning slot.`
  },
  'tictactoe-neon-ai': {
    title: 'Neon Tic Tac Toe',
    category: 'Casual Classic',
    objective: 'Get 3 of your marks in a horizontal, vertical, or diagonal row.',
    controls: '👆 Touch or 🖱️ Click: Tap any empty square on the 3x3 grid to place your X.',
    rules: `1. You play as X, AI plays as O.
2. Players take turns placing their mark in open grid slots.
3. First to align 3 consecutive marks wins the round.
4. If all 9 slots are filled with no 3-in-a-row, it is a Draw!`,
    tips: `• Starting in the center or a corner gives you the highest mathematical chance to win or force a draw.
• Create a 'fork' where you threaten two winning lines at once.`
  },
  'neon-run': {
    title: 'Neon Run / Neon Dash',
    category: 'Action & Reflex',
    objective: 'Jump over obstacles and spikes to survive to the end of the neon course.',
    controls: '⌨️ Spacebar or 👆 Screen Tap: Press Space or Tap anywhere on screen to Jump.',
    rules: `1. Your neon runner cube dashes forward automatically.
2. Tap or press Space to jump over glowing blocks and sharp red spikes.
3. Time your jumps rhythmically. Obstacles are spaced with ample room to land and leap.
4. Crashing into any obstacle resets the attempt. Reach 100% progress to clear the level!`,
    tips: `• Focus your eyes slightly ahead of the runner cube rather than right on it.
• Tap lightly and release quickly to time short hops versus full height leaps.
• Listen to the rhythmic pulse of the obstacles to stay in sync with the course.`
  },
  'classic-snake': {
    title: 'Classic Snake',
    category: 'Arcade Classic',
    objective: 'Eat glowing food to grow the snake as long as possible without crashing.',
    controls: '⌨️ Arrow Keys [↑][↓][←][→] or 👆 Swipe on screen to change snake direction.',
    rules: `1. Direct the snake towards glowing food dots.
2. Each food eaten increases your score and lengthens the snake.
3. Avoid colliding with the grid boundaries or your own growing body!`,
    tips: `• Travel in zigzag or perimeter sweeps to maximize empty grid space.
• Never trap your head between your body and an outer wall with no exit path.`
  },
  'pong': {
    title: 'Neon Retro Pong',
    category: 'Arcade Classic',
    objective: 'Deflect the ball past the AI opponent paddle to score points.',
    controls: '🖱️ Move Mouse vertically or ⌨️ [W][S] / [↑][↓] Arrow Keys to move your green paddle.',
    rules: `1. You control the glowing green paddle on the left.
2. Deflect the bouncing ball back towards the opponent's side.
3. Angle your returns by hitting the ball with the edges of your paddle.
4. Score points whenever the AI fails to return the ball!`,
    tips: `• Move your mouse smoothly up and down to position your paddle right in front of the ball trajectory.
• Hit the ball with the tip of your paddle to produce sharp, high-speed angle shots that fool the AI.`
  },
  't-rex-dino-runner': {
    title: 'T-Rex Dino Runner',
    category: 'Action & Reflex',
    objective: 'Run across the desert, leap over cacti and dodge pterodactyls to set a high score.',
    controls: '⌨️ [SPACE] or [↑] Arrow Key or 👆 Screen Tap to Jump | [↓] Arrow Key to Duck.',
    rules: `1. Press Spacebar or Tap anywhere to start running and jump.
2. Jump over small, medium, and large cacti along the desert floor.
3. Duck under high-flying pterodactyl birds.
4. The running speed increases the longer you survive!`,
    tips: `• Tap Space lightly for quick hops over small cacti.
• Watch the horizon ahead of the dinosaur to anticipate obstacle patterns early.`
  },
  'drive-fury': {
    title: 'Drive Fury',
    category: 'Racing & Physics',
    objective: 'Power through hill climbs, leap across chasms, grab high-flying coins, and reach the finish line!',
    controls: '⌨️ [→] or [D] Gas | [←] or [A] Brake | [SPACE] or [↑] or [W] JUMP | 👆 Tap Top to Jump, Bottom to Drive.',
    rules: `1. Press Right Arrow / [D] to accelerate forward with high-torque engine power.
2. Press Spacebar or Up Arrow / [W] to hydraulic JUMP high over obstacles and grab floating air coins!
3. Press Left Arrow / [A] to brake or reverse.
4. While airborne, use Left and Right arrows to balance your vehicle's pitch for perfect landings without flipping!`,
    tips: `• Use Spacebar jumps at the crest of hills for maximum airtime and coin collection!
• Level out your car's angle in mid-air before hitting the ground to avoid crashing your roof.`
  },
  '2048-galaxy': {
    title: '2048 Galaxy',
    category: 'Brain & Puzzle',
    objective: 'Slide numbered tiles to merge matching pairs and create the legendary 2048 tile.',
    controls: '⌨️ Arrow Keys [↑][↓][←][→] or 👆 Swipe in 4 directions to shift all tiles.',
    rules: `1. Every swipe moves all tiles across the grid in that direction.
2. When two tiles with the same number collide, they combine into their sum (2+2=4, 4+4=8, etc.).
3. A new tile (2 or 4) spawns after every move.
4. Keep merging without letting the board fill up!`,
    tips: `• Keep your highest value tile locked in a specific corner (e.g. bottom-right).
• Build descending chains along the edge leading into your corner tile.`
  },
  'tetris': {
    title: 'Classic Tetris',
    category: 'Arcade Classic',
    objective: 'Fit falling blocks together to clear horizontal lines and score points.',
    controls: '⌨️ [←][→] Move Left/Right | [↑] Rotate Block | [↓] Soft Drop | [SPACE] Instant Drop.',
    rules: `1. Tetromino shapes fall from the top of the matrix.
2. Rotate and position pieces so they form solid horizontal rows without gaps.
3. Completing a full line clears it and awards bonus points.
4. If blocks reach the top line, Game Over!`,
    tips: `• Keep the stack flat and avoid leaving deep vertical holes unless setting up a 4-line Tetris.
• Always keep a clean 1-wide column on the far right for the long I-bar piece.`
  },
  'sushi-stack': {
    title: 'Tower Stacker 3D / Sushi Stack',
    category: 'Arcade & Timing',
    objective: 'Stack moving blocks on top of each other to construct the tallest skyscraper.',
    controls: '👆 Screen Tap or ⌨️ [SPACE] key: Tap anywhere or press Spacebar to drop block.',
    rules: `1. Blocks swing back and forth across the top of your tower.
2. Tap at the exact moment the block aligns with the tower below.
3. Any section hanging over the edge gets sliced off, making subsequent blocks smaller!
4. Perfect alignments maintain block size and grant combo bonuses!`,
    tips: `• Match the rhythmic swing of the crane to drop the block at zero velocity apex points.
• Consecutive perfect placements trigger size-restoring combo effects.`
  },
  'magic-sort': {
    title: 'Magic Color Sort',
    category: 'Brain & Puzzle',
    objective: 'Sort the colored liquids so each test tube contains only one uniform color.',
    controls: '👆 Tap a test tube to lift liquid → Tap destination test tube to pour.',
    rules: `1. You can only pour liquid into another tube if the destination tube has the same top color and has empty room.
2. Empty tubes can hold any color.
3. Use logic to unblock trapped colors below. Complete all bottles to clear!`,
    tips: `• Keep at least one test tube completely empty as a buffer bottle.
• Always prioritize uncovering buried colors that match full or near-full bottles.`
  },
  'fruit-slash': {
    title: 'Fruit Slash',
    category: 'Action & Reflex',
    objective: 'Slice flying fruits for combos while strictly avoiding explosive bombs.',
    controls: '👆 Swipe finger or 🖱️ Drag mouse across flying fruits.',
    rules: `1. Swiftly swipe through multiple fruits in a single stroke for combo multipliers.
2. Do NOT touch or slice any black bombs — bombs detonate and end your game!
3. Don\'t let 3 fruits drop unsliced.`,
    tips: `• Wait for fruits to reach the peak of their arc before slicing through multiples at once.
• Keep your finger/mouse centered on the lower third of the screen.`
  },
  'bubble-shooter': {
    title: 'Bubble Shooter Galaxy',
    category: 'Casual Puzzle',
    objective: 'Clear the board by shooting bubbles to match 3 or more of the same color.',
    controls: '🖱️ Mouse / 👆 Touch: Drag to aim dotted guide, release or click to shoot | 🔄 Tap bottom shooter or press [S] to swap bubble | ⌨️ [A]/[D] or [←]/[→] to aim, [Space] to shoot.',
    rules: `1. Match 3 or more bubbles of identical color to pop them.
2. Popping supporting bubbles drops all attached bubbles underneath.
3. Clear bubbles fast before the ceiling shifts downwards!`,
    tips: `• Use wall bank bounces to reach hard-to-hit clusters deep inside the layout.
• Target anchor bubbles at the root to cause massive avalanches.`
  },
  'classic-sudoku': {
    title: 'Classic Sudoku',
    category: 'Brain & Logic',
    objective: 'Fill the 9x9 grid so every row, column, and 3x3 box contains digits 1 through 9.',
    controls: '👆 Tap any cell to select → Tap a number (1-9) on the keypad below.',
    rules: `1. Every row must contain digits 1-9 without repetition.
2. Every column must contain digits 1-9 without repetition.
3. Every 3x3 block must contain digits 1-9 without repetition.`,
    tips: `• Start with rows, columns, or 3x3 boxes that already have the most given numbers.
• Use process of elimination to spot unique candidates in a line.`
  },
  'classic-minesweeper': {
    title: 'Classic Minesweeper',
    category: 'Brain & Logic',
    objective: 'Uncover all safe tiles across the minefield without detonating any hidden bombs.',
    controls: '👆 Left Click / Tap: Reveal square | 🚩 Right Click / Flag button: Mark suspected mine.',
    rules: `1. Numbers indicate exactly how many mines touch that specific square.
2. Use deductive logic to flag all dangerous mine tiles.
3. Clicking a mine triggers a chain explosion!`,
    tips: `• A '1' next to a single hidden corner tile means that tile is guaranteed to be a mine.
• Flag known mines immediately so surrounding numbers can be cleared safely.`
  },
  'cars-arena': {
    title: 'Cars Arena 3D',
    category: 'Racing & Action',
    objective: 'Drift across collapsing hexagonal platforms and knock opponent cars off into the abyss!',
    controls: '🖱️ Drag Mouse / 👆 Swipe / ⌨️ [A][D] or [←][→] to steer and drift your car.',
    rules: `1. Drive across the floating arena. Platforms collapse and disappear behind you!
2. Drift tightly to leave trails of disappearing tiles in your opponents' paths.
3. Ram and push enemy cars over the edge.
4. Be the last car standing on the platform to win the crown!`,
    tips: `• Never drive in straight lines—always curve to cut off opponents.
• Keep moving forward; stopping causes the tile beneath you to vanish.`
  },
  'moto-x3m': {
    title: 'Moto X3M Bike Race',
    category: 'Action & Stunt',
    objective: 'Race your stunt motorcycle through extreme obstacle courses, loops, and explosive traps.',
    controls: '⌨️ [↑] / [W] Gas | [↓] / [S] Brake | [←][→] / [A][D] Lean & Balance in mid-air | 👆 On-Screen Pedals on Mobile.',
    rules: `1. Accelerate through ramps, loops, and elevator lifts.
2. Lean forward/backward in the air to land flat on your wheels.
3. Perform frontflips and backflips in mid-air to shave seconds off your race timer!
4. Reach the finish checkered flag alive to unlock 3 stars!`,
    tips: `• Backflips reduce your stage time by 0.5s each!
• Release gas right before big jumps to prevent overshooting into deadly spinning saws.`
  },
  'moto-x3m-pool-party': {
    title: 'Moto X3M Pool Party',
    category: 'Action & Stunt',
    objective: 'Ride across giant waterslides, splash pools, underwater tubes, and sun-soaked hazard courses!',
    controls: '⌨️ [↑] / [W] Gas | [↓] / [S] Brake | [←][→] Lean & Flip | 👆 Touch controls on mobile.',
    rules: `1. Speed through waterpark attractions and hydro-dynamited tracks.
2. Balance your dirtbike across slippery floating pipes and pool rings.
3. Flip in the air to gain bonus time deductions.
4. Hit every checkpoint to save your progress!`,
    tips: `• Hydroplaning gives you extra speed bursts across flat water pools.
• Land rear-wheel first when landing steep downhill slopes.`
  },
  'penalty-shooters-2': {
    title: 'Penalty Shooters 2',
    category: 'Sports & Soccer',
    objective: 'Choose your national team and win the championship penalty shootout as both striker and goalkeeper!',
    controls: '🖱️ Click & Hold / 👆 Touch: Drag to aim shot power & curve | Tap glove to make diving saves.',
    rules: `1. Striker Turn: Press and hold to aim at the goal corners, release to shoot.
2. Goalkeeper Turn: Watch the opponent\'s target marker and tap at the right instant to dive and block!
3. Score more penalties than your opponent in 5 rounds (or sudden death) to advance!`,
    tips: `• Aim high into the top corner nets for unstoppably fast strikes.
• Wait until the striker begins their kicking run-up before diving as goalkeeper.`
  },
  'cut-the-rope-experiments': {
    title: 'Cut the Rope: Experiments',
    category: 'Physics Puzzle',
    objective: 'Slice ropes, launch suction cups, and guide the candy directly into Om Nom\'s mouth!',
    controls: '🖱️ Drag Mouse / 👆 Swipe: Slice ropes with quick swipes, tap interactive lab gadgets.',
    rules: `1. Slice ropes holding the candy to let gravity swing it.
2. Collect up to 3 gold stars with the candy on each stage.
3. Use rocket boosters, suction cups, and water bubbles to navigate complex lab mazes.
4. Deliver the treat into Om Nom\'s mouth to complete the level!`,
    tips: `• Timing is key—cut ropes at the peak of their pendulum swing for maximum launch distance.
• Pop air bubbles right when the candy floats directly above Om Nom.`
  },
  'cut-the-rope-magic': {
    title: 'Cut the Rope: Magic',
    category: 'Physics Puzzle',
    objective: 'Transform Om Nom into magical shapes to bypass wizard traps and retrieve the candy!',
    controls: '🖱️ Swipe to cut ropes | 👆 Tap Om Nom to transform into bird, baby, fish, or mouse!',
    rules: `1. Slice ropes strategically to collect stars.
2. Tap the magic transformation button to morph Om Nom into different creatures with unique powers!
3. Bird form lets Om Nom fly; Fish form lets him dive underwater; Mouse form makes him scurry after cheese!`,
    tips: `• Switch between forms dynamically mid-air to solve complex multi-phase puzzles.
• Use mouse form to pull candy through tight crevices.`
  },
  'om-nom-run': {
    title: 'Om Nom Run 3D',
    category: 'Arcade & 3D Runner',
    objective: 'Dash down bustling city streets, dodge traffic, leap barriers, and collect golden coins!',
    controls: '⌨️ [A][D] or [←][→] Change Lanes | [↑] Jump | [↓] Slide | 👆 Swipe on Touchscreen.',
    rules: `1. Om Nom runs forward continuously.
2. Swipe or use arrows to dodge trains, roadblocks, and construction hurdles.
3. Jump over low obstacles and slide under high barriers.
4. Grab magnet, rocket, and coin multiplier power-ups!`,
    tips: `• Double-jump off trampolines to reach high rooftop coin trails.
• Use magnets to collect coins from all 3 lanes simultaneously without swerving.`
  },
  'om-nom-bubbles': {
    title: 'Om Nom Bubbles',
    category: 'Arcade Puzzle',
    objective: 'Aim and shoot colorful bubble candies to match 3 or more and clear the board!',
    controls: '🖱️ Move Mouse to Aim / 👆 Touch: Tap and release to launch bubble candy.',
    rules: `1. Match 3 or more bubbles of the same color to pop them.
2. Clear bubbles quickly before the ceiling descends.
3. Trigger chain reactions and drop large clusters for bonus score!`,
    tips: `• Bounce shots off sidewalls to slip candies into hard-to-reach ceiling anchors.
• Focus on breaking root bubbles to drop everything hanging beneath them.`
  },
  'tnt-bomb': {
    title: 'TNT Bomb 3D',
    category: 'Physics Destruction',
    objective: 'Place explosives strategically to demolish buildings and structures completely!',
    controls: '👆 Tap / 🖱️ Click: Select and place dynamite, rockets, and earthquake bombs → Tap DETONATE!',
    rules: `1. Analyze the structure\'s load-bearing pillars and structural weak points.
2. Plant your limited explosive charges on critical foundation beams.
3. Hit the detonator and watch gravity do the rest!
4. Bring the rubble below the target height line to win!`,
    tips: `• Blow out bottom corner supports first to cause buildings to topple sideways.
• Cluster bombs work best on dense brick layers.`
  },
  'cannon-balls-3d': {
    title: 'Cannon Balls 3D',
    category: 'Arcade & Physics',
    objective: 'Fire heavy cannonballs to smash colorful block towers in minimal shots!',
    controls: '🖱️ Aim & Click / 👆 Touch: Drag to aim cannon angle, release to fire.',
    rules: `1. You have a limited supply of cannon ammunition per tower.
2. Target the base of towers to induce massive collapse chain reactions.
3. Clear 100% of the blocks off the platform to clear the stage!`,
    tips: `• High-impact center-column shots crumble tall towers into pieces with a single hit.
• Save explosive special cannonballs for wide reinforced bases.`
  },
  'tower-crash-3d': {
    title: 'Tower Crash 3D',
    category: 'Arcade & Physics',
    objective: 'Shoot balls matching the color of tower blocks to topple towering 3D skyscrapers!',
    controls: '👆 Tap or 🖱️ Click: Fire colored ball | Swipe horizontally to rotate tower 360°.',
    rules: `1. You can only destroy blocks that match your current ball\'s color.
2. Rotate the tower around to locate matching color clusters.
3. Bring down the entire structure before running out of ammo!`,
    tips: `• Rotate the tower continuously to find large monolithic color patches.
• Target bottom blocks of the matching color to drop entire upper floors.`
  },
  'drift-cup-racing': {
    title: 'Drift Cup Racing',
    category: 'Racing & Arcade',
    objective: 'Drift around hairpin tarmac corners and beat rival racers across championship circuits!',
    controls: '⌨️ [←][→] or [A][D] to Steer & Drift | 👆 Touch Left/Right on Mobile.',
    rules: `1. Your car accelerates automatically.
2. Steer into corners early to initiate high-speed drift angles.
3. Maintain drift chains through corners to charge your Nitro Boost bar!
4. Finish 1st across 3 laps to unlock new cups and supercars!`,
    tips: `• Enter corners from the outside, clip the apex on the inside, and exit wide.
• Save your nitro boost for long straightaways.`
  },
  'table-tennis-world-tour': {
    title: 'Table Tennis World Tour',
    category: 'Sports & Arcade',
    objective: 'Swing your paddle, serve aces, and smash tournament rivals to win the World Cup!',
    controls: '🖱️ Drag Mouse / 👆 Swipe: Move paddle to return ball; swipe fast to smash with topspin.',
    rules: `1. Control the paddle with your mouse or finger.
2. Return opponent serves within table boundaries.
3. Swipe swiftly across the ball to execute high-speed spin shots and angled drop shots.
4. First to 11 points (by 2) wins the match!`,
    tips: `• Fast lateral swipes produce curved slice shots that curve away from your opponent.
• Move the paddle forward into the ball right at the peak of its bounce for maximum power.`
  },
  'archery-world-tour': {
    title: 'Archery World Tour',
    category: 'Sports & Precision',
    objective: 'Account for wind speed and distance to hit the bullseye across world-famous archery ranges!',
    controls: '🖱️ Click & Drag / 👆 Touch: Drag back to draw bowstring and aim; release to loose arrow.',
    rules: `1. Drag to pull the bowstring and line up the crosshair with the target.
2. Observe the wind indicator arrow and compensate your aim accordingly.
3. Release when steady to hit the golden 10-ring bullseye!`,
    tips: `• If the wind blows 3 m/s to the right, aim 3 units to the left of the yellow center.
• Don\'t hold the drawn bowstring too long or your archer\'s hands will begin shaking.`
  },
  '8-ball-billiards-classic': {
    title: '8 Ball Billiards Classic',
    category: 'Sports Classic',
    objective: 'Pocket all of your assigned balls (solids or stripes) and sink the 8-ball to claim victory!',
    controls: '🖱️ Mouse Drag / 👆 Touch: Aim cue stick, pull back power slider, and release to strike.',
    rules: `1. The first player to pocket a ball after the break is assigned Solids (1-7) or Stripes (9-15).
2. Pocket all 7 of your group\'s balls first.
3. Call your pocket and cleanly sink the black 8-ball to win the match.
4. Pocketing the 8-ball early or scratching on the 8-ball results in an instant loss!`,
    tips: `• Use gentle tap shots when pieces are hovering over the pocket to keep the cue ball in position.
• Plan 2 shots ahead to ensure a clear path for your next ball.`
  }
};

let currentActiveGame = null;

function getGameGuide(slug, title, category) {
  if (slug && GAME_HOW_TO_PLAY[slug]) return GAME_HOW_TO_PLAY[slug];
  
  // Fuzzy match by slug or title keywords
  const s = (slug + ' ' + title).toLowerCase();
  for (const key in GAME_HOW_TO_PLAY) {
    if (s.includes(key.replace('-ai', '')) || key.includes(slug)) {
      return GAME_HOW_TO_PLAY[key];
    }
  }

  // Category based smart fallback
  if (category === 'arcade') {
    return {
      title: title || 'Arcade Game',
      category: 'Arcade Classic',
      objective: 'Dodge obstacles, survive incoming hazards, and achieve the highest arcade score!',
      controls: '⌨️ Arrow Keys [↑][↓][←][→] or 👆 Touch: Move left, right, jump, or fire.',
      rules: '1. React quickly to avoid obstacles and hazards.\n2. Collect stars and power-ups for high scores.\n3. Keep your lives intact for as long as possible.',
      tips: '• Stay attentive to pattern changes as speed increases.\n• Grab multiplier bonuses early.'
    };
  }
  if (category === 'puzzle') {
    return {
      title: title || 'Brain Puzzle',
      category: 'Brain & Logic',
      objective: 'Analyze the grid, spot matching patterns, and solve the board in minimal moves.',
      controls: '🖱️ Mouse Click or 👆 Touch: Tap tiles or items to select, move, or connect them.',
      rules: '1. Plan your moves ahead.\n2. Match similar colors or symbols according to rules.\n3. Clear the board objective to win!',
      tips: '• Look 2-3 moves ahead before committing a move.\n• Keep key paths unblocked.'
    };
  }
  if (category === 'action') {
    return {
      title: title || 'Action Runner',
      category: 'Action & Reflex',
      objective: 'Run, jump, and navigate through obstacles to reach the finish line.',
      controls: '⌨️ Spacebar / Arrow Keys or 👆 Screen Tap: Jump, duck, and attack.',
      rules: '1. Time your movements precisely.\n2. Watch out for sudden spikes and traps.\n3. Reach the destination to complete the level!',
      tips: '• Focus on rhythmic jump timing.\n• Anticipate upcoming hazards.'
    };
  }

  return {
    title: title || 'Instant Game',
    category: 'Free Play Arena',
    objective: 'Complete the game objective, beat the AI or challenge, and climb the leaderboard!',
    controls: '🖱️ Mouse Click / 👆 Screen Tap / ⌨️ Keyboard: Tap or click on-screen buttons to interact.',
    rules: '1. Follow the on-screen instructions.\n2. Tap controls to play.\n3. Win matches and earn coins!',
    tips: '• Practice rounds help identify timing windows.\n• Stay focused and play deliberately.'
  };
}

function updateTheaterHowToPlay(game, title) {
  const guide = getGameGuide(game?.slug, title || game?.title, game?.category);
  currentActiveGame = { ...game, guide };

  // Update Bottom Bar
  const controlsSummary = document.getElementById('theaterControlsSummary');
  const rulesSummary = document.getElementById('theaterRulesSummary');

  if (controlsSummary) controlsSummary.textContent = guide.controls;
  if (rulesSummary) rulesSummary.textContent = guide.objective;

  // Pre-fill Modal
  const mTitle = document.getElementById('modalGameTitle');
  const mBadge = document.getElementById('modalCategoryBadge');
  const mObj = document.getElementById('modalObjective');
  const mCtrl = document.getElementById('modalControls');
  const mRules = document.getElementById('modalRules');
  const mTips = document.getElementById('modalTips');

  if (mTitle) mTitle.textContent = guide.title;
  if (mBadge) mBadge.textContent = guide.category;
  if (mObj) mObj.textContent = guide.objective;
  if (mCtrl) mCtrl.textContent = guide.controls;
  if (mRules) mRules.textContent = guide.rules;
  if (mTips) mTips.textContent = guide.tips;
}

function openHowToPlayModal() {
  const modal = document.getElementById('howToPlayModal');
  if (modal) modal.classList.remove('hidden');
}

function closeHowToPlayModal() {
  const modal = document.getElementById('howToPlayModal');
  if (modal) modal.classList.add('hidden');
}

function openGameTheater(title, url, game = null) {
  const overlay = document.getElementById('gameTheaterOverlay');
  const frame = document.getElementById('gameTheaterFrame');
  const titleEl = document.getElementById('theaterGameTitle');

  if (game) {
    const isPortrait = game.orientation === 'portrait' || (game.slug && PORTRAIT_GAMES.has(game.slug));
    window.currentTheaterGameOrientation = isPortrait ? 'portrait' : 'landscape';
    window.currentTheaterGameSlug = game.slug;
  } else {
    window.currentTheaterGameSlug = null;
  }

  updateTheaterFavoriteBtn();
  playArcadeSound('click');

  titleEl.textContent = title;
  frame.src = url;
  overlay.classList.remove('hidden');

  // Update How to Play dock and modal
  updateTheaterHowToPlay(game, title);

  // Automatically focus the iframe on load so arrow keys and spacebar respond immediately
  frame.onload = () => {
    setTimeout(() => {
      try {
        frame.focus();
        frame.contentWindow?.focus();
      } catch (e) {}
    }, 150);
  };
  setTimeout(() => {
    try {
      frame.focus();
      frame.contentWindow?.focus();
    } catch (e) {}
  }, 200);
}

function closeGameTheater() {
  const overlay = document.getElementById('gameTheaterOverlay');
  const frame = document.getElementById('gameTheaterFrame');
  frame.src = 'about:blank';
  window.currentTheaterGameSlug = null;
  overlay.classList.add('hidden');
  closeHowToPlayModal();
  if (window.activePartySession) {
    if (partyWs && partyWs.readyState === WebSocket.OPEN) {
      partyWs.send(JSON.stringify({ type: 'PARTY_LEAVE' }));
    }
    window.activePartySession = null;
    partyCurrentRoom = null;
    const partyBar = document.getElementById('theaterPartyLiveBar');
    if (partyBar) partyBar.classList.add('hidden');
  }
}

function reloadCurrentGame() {
  const frame = document.getElementById('gameTheaterFrame');
  if (frame && frame.src && frame.src !== 'about:blank') {
    const s = frame.src;
    frame.src = 'about:blank';
    setTimeout(() => { 
      frame.src = s;
      setTimeout(() => {
        try { frame.focus(); frame.contentWindow?.focus(); } catch (e) {}
      }, 200);
    }, 80);
  }
}

function toggleTheaterFullscreen() {
  const frame = document.getElementById('gameTheaterFrame');
  if (!document.fullscreenElement) {
    frame.requestFullscreen().catch(err => alert(err.message));
  } else {
    document.exitFullscreen();
  }
}

// Forward keyboard controls from parent window directly into game iframe
window.addEventListener('keydown', (e) => {
  const overlay = document.getElementById('gameTheaterOverlay');
  if (!overlay || overlay.classList.contains('hidden')) return;
  const frame = document.getElementById('gameTheaterFrame');
  if (!frame || !frame.contentWindow) return;

  const gameCodes = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'Escape', 'Enter'];
  const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
  if (gameCodes.includes(e.code) || gameKeys.includes(e.key)) {
    // Prevent parent page scrolling on Space or Arrow keys
    e.preventDefault();

    // 1. Send via universal cross-realm postMessage bridge
    try {
      frame.contentWindow.postMessage({
        type: 'KEY_EVENT',
        action: 'keydown',
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        which: e.which || e.keyCode
      }, '*');
    } catch (err) {}

    // 2. Dispatch synthetic event with defined keyCode/which properties
    try {
      const FrameEvent = frame.contentWindow.KeyboardEvent || window.KeyboardEvent;
      const evt = new FrameEvent('keydown', {
        key: e.key,
        code: e.code,
        bubbles: true,
        cancelable: true
      });
      Object.defineProperty(evt, 'keyCode', { get: () => e.keyCode });
      Object.defineProperty(evt, 'which', { get: () => e.which || e.keyCode });
      frame.contentWindow.dispatchEvent(evt);
      frame.contentDocument?.dispatchEvent(evt);
      const canvas = frame.contentDocument?.querySelector('canvas');
      if (canvas) canvas.dispatchEvent(evt);
    } catch (err) {}
  }
});

window.addEventListener('keyup', (e) => {
  const overlay = document.getElementById('gameTheaterOverlay');
  if (!overlay || overlay.classList.contains('hidden')) return;
  const frame = document.getElementById('gameTheaterFrame');
  if (!frame || !frame.contentWindow) return;

  const gameCodes = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'Escape', 'Enter'];
  const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
  if (gameCodes.includes(e.code) || gameKeys.includes(e.key)) {
    try {
      frame.contentWindow.postMessage({
        type: 'KEY_EVENT',
        action: 'keyup',
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        which: e.which || e.keyCode
      }, '*');
    } catch (err) {}

    try {
      const FrameEvent = frame.contentWindow.KeyboardEvent || window.KeyboardEvent;
      const evt = new FrameEvent('keyup', {
        key: e.key,
        code: e.code,
        bubbles: true,
        cancelable: true
      });
      Object.defineProperty(evt, 'keyCode', { get: () => e.keyCode });
      Object.defineProperty(evt, 'which', { get: () => e.which || e.keyCode });
      frame.contentWindow.dispatchEvent(evt);
      frame.contentDocument?.dispatchEvent(evt);
      const canvas = frame.contentDocument?.querySelector('canvas');
      if (canvas) canvas.dispatchEvent(evt);
    } catch (err) {}
  }
});

// Auto-focus the game iframe on any pointer interaction within the theater cabinet
document.addEventListener('pointerdown', (e) => {
  const overlay = document.getElementById('gameTheaterOverlay');
  if (overlay && !overlay.classList.contains('hidden')) {
    const frame = document.getElementById('gameTheaterFrame');
    if (frame) {
      setTimeout(() => {
        try { frame.focus(); frame.contentWindow?.focus(); } catch(err) {}
      }, 50);
    }
  }
}, true);

// -------------------------------------------------------------
// 7. USER AUTHENTICATION & SESSIONS (JWT + NEON DB)
// -------------------------------------------------------------
async function checkAuthSession() {
  if (!currentToken) {
    localStorage.removeItem('ott_vip_subscribed');
    currentUser = null;
    updateAuthUI(null);
    updateCoinUI();
    return;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      const isGuest = Boolean(currentUser.is_guest || (currentUser.username && currentUser.username.startsWith('Gamer_')) || (currentUser.phone_or_email && currentUser.phone_or_email.startsWith('+9199999')));
      if (isGuest) {
        currentUser.isGuest = true;
        currentUser.is_guest = true;
        userCoinBalance = 0;
        userBonusCoins = 0;
        localStorage.setItem('ott_is_guest', 'true');
        localStorage.removeItem('ott_coins');
        localStorage.removeItem('ott_bonus_coins');
      } else {
        localStorage.removeItem('ott_is_guest');
        if (currentUser.coin_balance !== undefined && currentUser.coin_balance !== null) {
          userCoinBalance = Number(currentUser.coin_balance);
        }
        if (currentUser.bonus_coins !== undefined && currentUser.bonus_coins !== null) {
          userBonusCoins = Number(currentUser.bonus_coins);
        }
      }
      updateAuthUI(currentUser);
      updateCoinUI();
    } else {
      localStorage.removeItem('ott_jwt');
      currentToken = null;
      updateAuthUI(null);
      updateCoinUI();
    }
  } catch (err) {
    console.error('Session check failed:', err);
    updateCoinUI();
  }
}

// -------------------------------------------------------------
// 7.1 VIP SUBSCRIPTION PASS SYSTEM (OTT EXCLUSIVE)
// -------------------------------------------------------------
let pendingGameSlug = null;

function isUserSubscribed() {
  if (!currentToken || !currentUser) {
    localStorage.removeItem('ott_vip_subscribed');
    return false;
  }
  if (currentUser && currentUser.is_subscribed) {
    if (!currentUser.subscription_expires_at) return true;
    return new Date(currentUser.subscription_expires_at) > new Date();
  }
  return false;
}

function openSubscriptionModal(slug = null) {
  if (!currentToken) {
    openAuthModal();
    switchAuthTab('login');
    showToast('🔒 Please sign in or create an account to access VIP Pass!');
    return;
  }
  pendingGameSlug = slug;
  const modal = document.getElementById('subscriptionModal');
  if (modal) modal.classList.remove('hidden');
}

function closeSubscriptionModal() {
  const modal = document.getElementById('subscriptionModal');
  if (modal) modal.classList.add('hidden');
}

async function handleSubscribeSubmit() {
  if (!currentToken) {
    closeSubscriptionModal();
    openAuthModal();
    switchAuthTab('login');
    showToast('🔒 Please sign in or create an account to activate VIP Pass!');
    return;
  }

  const btn = document.getElementById('activateSubBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Activating VIP...';
  }

  try {
    const res = await fetch('/api/subscription/subscribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) {
      if (currentUser) {
        currentUser.is_subscribed = true;
      }
      closeSubscriptionModal();
      showToast('🎉 VIP Pass Activated! All 15 Exclusive Games Unlocked!');
      
      updateAuthUI(currentUser);
      populateCarouselZones(allFreeGames);
      filterAllCategory(activeCategory);

      if (pendingGameSlug) {
        const slugToLaunch = pendingGameSlug;
        pendingGameSlug = null;
        setTimeout(() => { launchGameBySlug(slugToLaunch); }, 300);
      }
    } else {
      if (data.requireLogin) {
        closeSubscriptionModal();
        openAuthModal();
        switchAuthTab('login');
      }
      showToast(data.message || 'Subscription activation failed');
    }
  } catch(e) {
    console.error('Subscription error:', e);
    showToast('Subscription request failed. Please check connection.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-crown text-sm"></i> <span>ACTIVATE VIP PASS NOW</span>';
    }
  }
}

function showToast(msg) {
  const existing = document.getElementById('ottToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'ottToast';
  toast.className = 'fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-extrabold text-xs shadow-2xl shadow-amber-500/40 flex items-center gap-2.5 transition-all transform translate-y-4 opacity-0 pointer-events-none';
  toast.innerHTML = `<i class="fa-solid fa-crown text-black text-sm"></i> <span>${msg}</span>`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => { toast.remove(); }, 300);
  }, 3500);
}

function updateAuthUI(user) {
  const container = document.getElementById('authNavContainer');
  const vipNavBtn = document.getElementById('vipNavBtn');
  const subscribed = isUserSubscribed();

  if (vipNavBtn) {
    if (subscribed) {
      vipNavBtn.innerHTML = '<i class="fa-solid fa-crown text-black text-xs"></i> <span class="inline">VIP<span class="hidden sm:inline"> ACTIVE</span></span>';
      vipNavBtn.className = 'shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-extrabold text-xs uppercase tracking-wider hover:opacity-95 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap';
    } else {
      vipNavBtn.innerHTML = '<i class="fa-solid fa-crown text-black text-xs"></i> <span class="inline">VIP<span class="hidden sm:inline"> PASS</span></span>';
      vipNavBtn.className = 'shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider hover:opacity-95 shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap';
    }
  }

  if (!container) return;

  if (user) {
    container.innerHTML = `
      <div class="shrink-0 flex items-center gap-2">
        <div class="hidden sm:flex flex-col text-right">
          <span class="text-xs font-bold text-white leading-tight">${user.username}</span>
          ${subscribed ? '<span class="text-[10px] text-amber-400 font-bold flex items-center gap-1 justify-end"><i class="fa-solid fa-crown text-[8px]"></i> VIP Pass</span>' : '<span class="text-[10px] text-emerald-400 font-medium">Free Member</span>'}
        </div>
        <img onclick="openProfileModal()" src="${user.avatar_url}" class="w-8 h-8 rounded-xl border ${subscribed ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-neonCyan'} cursor-pointer hover:scale-105 transition-all">
        <button onclick="handleLogout()" title="Sign Out" class="text-gray-400 hover:text-red-400 text-xs ml-0.5">
          <i class="fa-solid fa-right-from-bracket"></i>
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button onclick="openAuthModal()" class="shrink-0 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-neonCyan to-blue-600 text-black font-extrabold text-xs uppercase tracking-wider hover:opacity-90 shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap">
        <i class="fa-solid fa-user-lock"></i>
        <span>Sign In</span>
      </button>
    `;
  }
}

function openAuthModal() {
  document.getElementById('authModal')?.classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('authModal')?.classList.add('hidden');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');

  if (tab === 'login') {
    loginForm?.classList.remove('hidden');
    registerForm?.classList.add('hidden');
    if (tabLoginBtn) tabLoginBtn.className = 'flex-1 py-2 text-neonCyan border-b-2 border-neonCyan';
    if (tabRegisterBtn) tabRegisterBtn.className = 'flex-1 py-2 text-gray-400 hover:text-white';
  } else {
    loginForm?.classList.add('hidden');
    registerForm?.classList.remove('hidden');
    if (tabRegisterBtn) tabRegisterBtn.className = 'flex-1 py-2 text-neonCyan border-b-2 border-neonCyan';
    if (tabLoginBtn) tabLoginBtn.className = 'flex-1 py-2 text-gray-400 hover:text-white';
  }
}

async function handleGuestLogin() {
  try {
    const res = await fetch('/api/auth/guest', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('ott_jwt', data.token);
      localStorage.setItem('ott_is_guest', 'true');
      localStorage.removeItem('ott_coins');
      localStorage.removeItem('ott_bonus_coins');
      currentToken = data.token;
      currentUser = { ...data.user, isGuest: true, is_guest: true };
      userCoinBalance = 0;
      userBonusCoins = 0;
      updateAuthUI(currentUser);
      updateCoinUI();
      closeAuthModal();
      showToast('🎮 Welcome Guest Gamer! Create an account to earn and save coins.');
    }
  } catch (err) {
    alert('Guest sign-in failed.');
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const identifier = document.getElementById('loginIdentifier').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('ott_jwt', data.token);
      currentToken = data.token;
      currentUser = data.user;
      if (currentUser.coin_balance !== undefined) userCoinBalance = Number(currentUser.coin_balance);
      if (currentUser.bonus_coins !== undefined) userBonusCoins = Number(currentUser.bonus_coins);
      updateAuthUI(currentUser);
      updateCoinUI();
      closeAuthModal();
      showToast(`🎮 Welcome back, ${currentUser.username}!`);
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (err) {
    alert('Server error during sign in');
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value;
  const phone_or_email = document.getElementById('regPhone').value;
  const password = document.getElementById('regPassword').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, phone_or_email, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('ott_jwt', data.token);
      currentToken = data.token;
      currentUser = data.user;
      if (currentUser.coin_balance !== undefined) userCoinBalance = Number(currentUser.coin_balance);
      if (currentUser.bonus_coins !== undefined) userBonusCoins = Number(currentUser.bonus_coins);
      updateAuthUI(currentUser);
      updateCoinUI();
      closeAuthModal();
      showToast('🎉 Account created! 150 Starter Coins Added!');
    } else {
      alert(data.message || 'Registration failed');
    }
  } catch (err) {
    alert('Registration error');
  }
}

function openProfileModal() {
  if (!currentUser) return;
  document.getElementById('profileUsername').textContent = currentUser.username;
  document.getElementById('profilePhone').textContent = currentUser.phone_or_email;
  document.getElementById('profileAvatar').src = currentUser.avatar_url;
  document.getElementById('profileModal')?.classList.remove('hidden');
}

function closeProfileModal() {
  document.getElementById('profileModal')?.classList.add('hidden');
}

function handleLogout() {
  localStorage.removeItem('ott_jwt');
  localStorage.removeItem('ott_vip_subscribed');
  localStorage.removeItem('ott_is_guest');
  localStorage.removeItem('ott_coins');
  localStorage.removeItem('ott_bonus_coins');
  currentToken = null;
  currentUser = null;
  userCoinBalance = 0;
  userBonusCoins = 0;
  updateAuthUI(null);
  updateCoinUI();
  if (typeof allFreeGames !== 'undefined') {
    populateCarouselZones(allFreeGames);
  }
  if (typeof activeCategory !== 'undefined') {
    filterAllCategory(activeCategory);
  }
  closeProfileModal();
  showToast('Logged out successfully');
}

// -------------------------------------------------------------
// 8. COMPLETE WALLET, COIN SYSTEM & PROMO COUPONS CONTROLLER
// -------------------------------------------------------------

let currentWalletTab = 'wallet';

function updateCoinUI() {
  const navBalance = document.getElementById('navCoinBalance');
  if (navBalance) {
    navBalance.textContent = Number(userCoinBalance).toLocaleString();
  }
  const modalBalance = document.getElementById('walletModalBalance');
  if (modalBalance) {
    modalBalance.textContent = Number(userCoinBalance).toLocaleString();
  }
  const modalBonus = document.getElementById('walletModalBonus');
  if (modalBonus) {
    modalBonus.textContent = Number(userBonusCoins).toLocaleString();
  }
  const storeBadge = document.getElementById('storeBalanceBadge');
  if (storeBadge) {
    storeBadge.textContent = Number(userCoinBalance).toLocaleString();
  }
}

function switchWalletTab(tab) {
  currentWalletTab = tab || 'wallet';
  const tabs = ['wallet', 'quests', 'store', 'spin'];
  tabs.forEach(t => {
    const btn = document.getElementById(`walletTabBtn_${t}`);
    const pane = document.getElementById(`walletTab_${t}`);
    if (t === currentWalletTab) {
      if (pane) pane.classList.remove('hidden');
      if (btn) {
        btn.className = 'flex-1 py-2 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-md cursor-pointer';
      }
    } else {
      if (pane) pane.classList.add('hidden');
      if (btn) {
        btn.className = 'flex-1 py-2 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1 text-gray-300 hover:text-white cursor-pointer';
      }
    }
  });

  playArcadeSound('click');

  if (currentWalletTab === 'spin') {
    initSpinWheelCanvas();
    updateSpinButtonState();
  } else if (currentWalletTab === 'quests') {
    renderQuestsTab();
  } else if (currentWalletTab === 'store') {
    updateCoinUI();
  }
}

function openWalletModal(targetTab = 'wallet') {
  const modal = document.getElementById('walletModal');
  if (modal) {
    modal.classList.remove('hidden');
    switchWalletTab(targetTab);
    refreshWalletModalData();
  }
}

function closeWalletModal() {
  const modal = document.getElementById('walletModal');
  if (modal) modal.classList.add('hidden');
}

function getDailyClaimStatus() {
  const lastClaim = localStorage.getItem('ott_last_daily_claim');
  if (!lastClaim) return { canClaim: true, remainingHours: 0 };
  const diffHours = (Date.now() - new Date(lastClaim).getTime()) / (1000 * 60 * 60);
  if (diffHours < 24) {
    return { canClaim: false, remainingHours: Math.max(1, Math.ceil(24 - diffHours)) };
  }
  return { canClaim: true, remainingHours: 0 };
}

async function refreshWalletModalData() {
  updateCoinUI();
  try {
    const headers = {};
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
    const res = await fetch('/api/wallet/info', { headers });
    const data = await res.json();
    
    const guestStatus = getDailyClaimStatus();
    let isClaimLocked = false;
    let remainingHours = 24;

    if (data && data.success) {
      if (data.authenticated) {
        userCoinBalance = Number(data.coin_balance);
        userBonusCoins = Number(data.bonus_coins);
        updateCoinUI();
        if (!data.canClaimDaily) {
          isClaimLocked = true;
          remainingHours = data.nextClaimHours || 24;
        }
      } else {
        if (!guestStatus.canClaim) {
          isClaimLocked = true;
          remainingHours = guestStatus.remainingHours;
        }
      }

      // Update Daily Bonus claim button status in modal
      const claimBtn = document.getElementById('claimDailyModalBtn');
      if (claimBtn) {
        if (!currentToken) {
          claimBtn.disabled = false;
          claimBtn.className = 'w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer';
          claimBtn.innerHTML = `<i class="fa-solid fa-user-lock"></i> <span>SIGN IN TO CLAIM +50 COINS</span>`;
        } else if (isClaimLocked) {
          claimBtn.disabled = true;
          claimBtn.className = 'w-full py-2.5 rounded-xl bg-slate-800 text-gray-400 font-bold text-xs uppercase tracking-wider cursor-not-allowed border border-white/5 flex items-center justify-center gap-2 select-none shadow-none';
          claimBtn.innerHTML = `<i class="fa-solid fa-clock text-amber-400"></i> <span>Claimed! Next in ${remainingHours}h</span>`;
        } else {
          claimBtn.disabled = false;
          claimBtn.className = 'w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer';
          claimBtn.innerHTML = `<i class="fa-solid fa-gift"></i> <span>CLAIM +50 FREE COINS</span>`;
        }
      }

      // Update Daily Bonus gift button in navbar
      const navDailyBtn = document.getElementById('dailyBonusNavBtn');
      if (navDailyBtn) {
        if (isClaimLocked) {
          navDailyBtn.className = 'shrink-0 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-gray-400 text-xs flex items-center gap-1.5 cursor-not-allowed opacity-60';
          navDailyBtn.innerHTML = `<i class="fa-solid fa-check text-emerald-400"></i> <span class="hidden 2xl:inline text-[10px] uppercase font-bold tracking-wider">CLAIMED</span>`;
        } else {
          navDailyBtn.className = 'shrink-0 px-2 sm:px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 hover:border-emerald-300 text-emerald-300 font-extrabold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer';
          navDailyBtn.innerHTML = `<i class="fa-solid fa-gift text-emerald-400 animate-bounce"></i> <span class="hidden 2xl:inline text-[10px] uppercase font-black tracking-wider">DAILY BONUS</span>`;
        }
      }

      // Update Lucky Spin button in navbar
      const navSpinBtn = document.getElementById('spinWheelNavBtn');
      const spinStatus = getSpinCooldownStatus();
      const isSpinLocked = (data.authenticated && data.canSpinWheel === false) || !spinStatus.canSpin;
      if (navSpinBtn) {
        if (isSpinLocked) {
          navSpinBtn.className = 'shrink-0 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-gray-400 text-xs flex items-center gap-1.5 cursor-not-allowed opacity-60';
          navSpinBtn.innerHTML = `<i class="fa-solid fa-check text-pink-400"></i> <span class="hidden 2xl:inline text-[10px] uppercase font-bold tracking-wider">SPUN</span>`;
        } else {
          navSpinBtn.className = 'shrink-0 px-2 sm:px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/40 hover:border-pink-300 text-pink-300 font-extrabold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer';
          navSpinBtn.innerHTML = `<i class="fa-solid fa-dharmachakra text-pink-400 animate-spin-slow"></i> <span class="hidden 2xl:inline text-[10px] uppercase font-black tracking-wider">LUCKY SPIN</span>`;
        }
      }

      updateSpinButtonState(data);

      // Render transactions history
      const txContainer = document.getElementById('walletTransactionsList');
      if (txContainer) {
        if (data.transactions && data.transactions.length > 0) {
          txContainer.innerHTML = data.transactions.map(tx => {
            const isPositive = Number(tx.amount) >= 0;
            return `
              <div class="p-2 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs hover:border-white/10 transition-colors">
                <div class="flex items-center gap-2 truncate">
                  <span class="text-sm">${tx.type.includes('DAILY') ? '🎁' : tx.type.includes('COUPON') ? '🎟️' : tx.type.includes('WIN') ? '🏆' : '🎮'}</span>
                  <span class="text-gray-200 truncate text-[11px] font-medium">${tx.description || tx.type}</span>
                </div>
                <span class="${isPositive ? 'text-emerald-400' : 'text-rose-400'} font-bold shrink-0 text-xs">
                  ${isPositive ? '+' : ''}${tx.amount} 🪙
                </span>
              </div>
            `;
          }).join('');
        } else {
          txContainer.innerHTML = `
            <div class="p-2 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between text-gray-400 text-[11px]">
              <span>Starter Welcome Pack</span>
              <span class="text-emerald-400 font-bold">+150 🪙</span>
            </div>
          `;
        }
      }
      // Update quick coupon chips status
      const redeemed = getRedeemedCoupons();
      ['WELCOME100', 'BONUS500', 'OTTVIP', 'VOLTIXVIP'].forEach(code => {
        const btn = document.getElementById(`couponBtn_${code}`);
        if (btn) {
          if (redeemed.includes(code)) {
            btn.className = 'px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 text-gray-500 line-through cursor-not-allowed text-[10px] font-mono opacity-50';
            btn.title = `Coupon ${code} already redeemed`;
          } else {
            btn.className = (code === 'OTTVIP' || code === 'VOLTIXVIP')
              ? 'px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono hover:bg-purple-400 hover:text-black transition-colors cursor-pointer'
              : 'px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono hover:bg-amber-400 hover:text-black transition-colors cursor-pointer';
            btn.title = `Click to try ${code}`;
          }
        }
      });
    }
  } catch(e) {
    console.warn('Could not refresh wallet modal data:', e);
  }
}

async function claimDailyBonusReward() {
  if (!currentToken) {
    closeWalletModal();
    openAuthModal();
    switchAuthTab('login');
    showToast('🔒 Please sign in or create an account to claim daily bonus coins!');
    return;
  }

  const modalBtn = document.getElementById('claimDailyModalBtn');

  if (modalBtn) {
    modalBtn.disabled = true;
    modalBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Claiming...</span>';
  }

  try {
    const headers = {};
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

    const res = await fetch('/api/wallet/claim-daily', {
      method: 'POST',
      headers
    });
    const data = await res.json();

    if (data.success) {
      const reward = data.reward || 50;
      if (data.newBalance !== undefined) {
        userCoinBalance = Number(data.newBalance);
      } else {
        userCoinBalance += reward;
        localStorage.setItem('ott_coins', userCoinBalance);
      }
      // Save claim timestamp to lock out repeat claims for 24 hours
      localStorage.setItem('ott_last_daily_claim', new Date().toISOString());
      recordQuestProgress('daily_bonus');
      playArcadeSound('coin');

      updateCoinUI();
      showToast(data.message || `🎉 Claimed ${reward} Free Daily Coins!`);
    } else {
      showToast(data.message || 'Already claimed today!');
    }
  } catch(e) {
    showToast('Failed to claim daily reward');
  } finally {
    refreshWalletModalData();
  }
}

function getRedeemedCoupons() {
  try {
    return JSON.parse(localStorage.getItem('ott_redeemed_coupons') || '[]');
  } catch(e) {
    return [];
  }
}

function markCouponRedeemed(code) {
  const list = getRedeemedCoupons();
  const c = code.trim().toUpperCase();
  if (!list.includes(c)) {
    list.push(c);
    localStorage.setItem('ott_redeemed_coupons', JSON.stringify(list));
  }
}

function applyQuickCoupon(code) {
  const c = code.trim().toUpperCase();
  if (getRedeemedCoupons().includes(c)) {
    showToast(`⚠️ Coupon "${c}" has already been used!`);
    return;
  }
  const input = document.getElementById('couponCodeInput');
  if (input) {
    input.value = code;
    input.focus();
  }
}

async function handleCouponRedeem() {
  if (!currentToken) {
    closeWalletModal();
    openAuthModal();
    switchAuthTab('login');
    showToast('🔒 Please sign in or create an account to redeem promo coupons!');
    return;
  }

  const input = document.getElementById('couponCodeInput');
  if (!input) return;
  const rawCode = (input.value || '').trim();
  if (!rawCode) {
    showToast('⚠️ Please enter a coupon code.');
    return;
  }

  const code = rawCode.toUpperCase();
  const redeemed = getRedeemedCoupons();
  if (redeemed.includes(code)) {
    showToast(`⚠️ Coupon "${code}" has already been redeemed! Each coupon can only be used once.`);
    input.value = '';
    return;
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

    const res = await fetch('/api/wallet/redeem-coupon', {
      method: 'POST',
      headers,
      body: JSON.stringify({ code })
    });
    const data = await res.json();

    if (data.success) {
      markCouponRedeemed(code);

      if (data.type === 'VIP') {
        localStorage.setItem('ott_vip_subscribed', 'true');
        if (currentUser) currentUser.is_subscribed = true;
        updateAuthUI(currentUser);
        populateCarouselZones(allFreeGames);
        filterAllCategory(activeCategory);
        showToast(data.message);
      } else if (data.type === 'COINS') {
        if (data.newBalance !== undefined) {
          userCoinBalance = Number(data.newBalance);
        } else {
          userCoinBalance += Number(data.reward || 100);
          localStorage.setItem('ott_coins', userCoinBalance);
        }
        updateCoinUI();
        showToast(data.message);
      }
      input.value = '';
      refreshWalletModalData();
    } else {
      if (data.message && data.message.includes('already')) {
        markCouponRedeemed(code);
        refreshWalletModalData();
      }
      showToast(data.message || 'Invalid coupon code');
    }
  } catch(e) {
    showToast('Error redeeming coupon');
  }
}

async function awardGamePlayCoins(slug, title) {
  // Guests and unauthenticated players get NO coins!
  if (!currentToken || !currentUser || currentUser.isGuest || currentUser.is_guest) return;

  const game = window.gameMap ? window.gameMap[slug] : null;
  const isPremium = Boolean(game?.is_premium || game?.access_level === 'VIP' || game?.access_level === 'premium');
  // Free games award NO coins! Only premium games award 1 coin.
  if (!isPremium) return;

  const now = Date.now();
  if (now - lastRewardTime < 12000) return; // 12 second throttle between play awards
  lastRewardTime = now;

  // Track daily quests
  recordQuestProgress('play_3_games');
  recordQuestProgress('play_vip');

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

    const res = await fetch('/api/wallet/reward', {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason: 'GAME_PLAY', amount: 1, isPremium: true, gameSlug: slug, gameTitle: title })
    });
    const data = await res.json();
    if (data.success) {
      if (data.newBalance !== undefined) {
        userCoinBalance = Number(data.newBalance);
      } else {
        userCoinBalance += 1;
        localStorage.setItem('ott_coins', userCoinBalance);
      }
      playArcadeSound('coin');
      updateCoinUI();
      showToast(`🪙 +1 Coin Earned for playing premium game ${title}!`);
    }
  } catch(e) {}
}

// Universal AI Game Win Listener Bridge
window.addEventListener('message', async (e) => {
  if (e.data && (e.data.type === 'GAME_WIN' || e.data.event === 'game_win')) {
    const gameName = e.data.game || 'Match';
    recordQuestProgress('beat_ai');
    playArcadeSound('win');

    // Guests get NO coins!
    if (!currentToken || !currentUser || currentUser.isGuest || currentUser.is_guest) return;

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

      const res = await fetch('/api/wallet/reward', {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: 'AI_WIN', amount: 2, gameTitle: gameName })
      });
      const data = await res.json();
      if (data.success) {
        if (data.newBalance !== undefined) {
          userCoinBalance = Number(data.newBalance);
        } else {
          userCoinBalance += 2;
          localStorage.setItem('ott_coins', userCoinBalance);
        }
        updateCoinUI();
        showToast(`🏆 VICTORY in ${gameName}! +2 Coins Awarded!`);
      }
    } catch(err) {}
  }
});

// -------------------------------------------------------------
// 9. REDEEM STORE & VOUCHERS CONTROLLER
// -------------------------------------------------------------

async function redeemStoreItem(itemId, itemTitle, cost) {
  if (!currentToken) {
    closeWalletModal();
    openAuthModal();
    switchAuthTab('login');
    showToast('🔒 Please sign in or create an account to redeem rewards from the coin store!');
    return;
  }

  const itemCost = Number(cost) || 0;
  if (userCoinBalance < itemCost) {
    showToast(`⚠️ Insufficient coins! You need ${itemCost.toLocaleString()} coins for ${itemTitle}. Play more games to earn coins!`);
    return;
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

    const res = await fetch('/api/wallet/redeem-store-item', {
      method: 'POST',
      headers,
      body: JSON.stringify({ itemId, itemTitle, cost: itemCost })
    });
    const data = await res.json();

    if (data.success) {
      if (data.newBalance !== undefined) {
        userCoinBalance = Number(data.newBalance);
      } else {
        userCoinBalance = Math.max(0, userCoinBalance - itemCost);
        localStorage.setItem('ott_coins', userCoinBalance);
      }

      // If VIP pass was redeemed, activate VIP locally
      if (itemId === 'vip_7_days' || itemId === 'vip_30_days') {
        localStorage.setItem('ott_vip_subscribed', 'true');
        if (currentUser) currentUser.is_subscribed = true;
        updateAuthUI(currentUser);
        populateCarouselZones(allFreeGames);
        filterAllCategory(activeCategory);
      }

      // Show Voucher Announcement Banner
      const banner = document.getElementById('storeVoucherBanner');
      const titleEl = document.getElementById('storeVoucherTitle');
      const codeEl = document.getElementById('storeVoucherCode');
      if (banner && codeEl) {
        if (titleEl) titleEl.textContent = `REDEEMED: ${itemTitle.toUpperCase()}`;
        codeEl.textContent = data.voucherCode || `${itemId.toUpperCase().slice(0, 4)}-OTT-${Math.floor(1000 + Math.random() * 9000)}`;
        banner.classList.remove('hidden');
        banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      updateCoinUI();
      refreshWalletModalData();
      showToast(data.message || `🎉 Redeemed ${itemTitle}!`);
    } else {
      showToast(data.message || 'Redemption failed');
    }
  } catch(e) {
    console.error('Store redemption error:', e);
    showToast('Failed to redeem item. Please try again.');
  }
}

function copyStoreVoucherCode() {
  const codeEl = document.getElementById('storeVoucherCode');
  if (codeEl && codeEl.textContent) {
    const code = codeEl.textContent.trim();
    navigator.clipboard.writeText(code).then(() => {
      showToast(`📋 Copied voucher code: ${code}`);
    }).catch(() => {
      showToast(`Code: ${code}`);
    });
  }
}

// -------------------------------------------------------------
// 10. LUCKY SPIN WHEEL ENGINE
// -------------------------------------------------------------

const SPIN_SLICES = [
  { label: '2 Coins', shortText: '2 🪙', color: '#06B6D4', textColor: '#000000', type: 'COINS', amount: 2 },
  { label: '3 Coins', shortText: '3 🪙', color: '#10B981', textColor: '#000000', type: 'COINS', amount: 3 },
  { label: '4 Coins', shortText: '4 🪙', color: '#8B5CF6', textColor: '#FFFFFF', type: 'COINS', amount: 4 },
  { label: '5 Coins', shortText: '5 🪙', color: '#F59E0B', textColor: '#000000', type: 'COINS', amount: 5 },
  { label: '2 Coins', shortText: '2 🪙', color: '#3B82F6', textColor: '#FFFFFF', type: 'COINS', amount: 2 },
  { label: '8 Coins', shortText: '🌟 8 🪙', color: '#EC4899', textColor: '#FFFFFF', type: 'COINS', amount: 8 },
  { label: 'Better Luck', shortText: 'Try Again', color: '#334155', textColor: '#94A3B8', type: 'NONE', amount: 0 },
  { label: '3 Coins', shortText: '3 🪙', color: '#EAB308', textColor: '#000000', type: 'COINS', amount: 3 }
];

let spinWheelCurrentAngle = 0;
let isSpinningWheel = false;

function getSpinCooldownStatus() {
  const lastSpin = localStorage.getItem('ott_last_wheel_spin');
  if (!lastSpin) return { canSpin: true, remainingHours: 0, remainingMinutes: 0, formatted: '0h' };
  const diffMs = Date.now() - new Date(lastSpin).getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 24) {
    const totalRemainingMinutes = Math.max(1, Math.ceil((24 * 60) - (diffMs / (1000 * 60))));
    const h = Math.floor(totalRemainingMinutes / 60);
    const m = totalRemainingMinutes % 60;
    return {
      canSpin: false,
      remainingHours: h,
      remainingMinutes: m,
      formatted: h > 0 ? `${h}h ${m}m` : `${m}m`
    };
  }
  return { canSpin: true, remainingHours: 0, remainingMinutes: 0, formatted: '0h' };
}

function updateSpinButtonState(serverData) {
  const btn = document.getElementById('spinActionBtn');
  const btnText = document.getElementById('spinBtnText');
  if (!btn || !btnText) return;

  const localStatus = getSpinCooldownStatus();
  let isLocked = !localStatus.canSpin;
  let formattedTime = localStatus.formatted;

  if (serverData && serverData.authenticated) {
    if (serverData.canSpinWheel === false) {
      isLocked = true;
      const h = serverData.nextSpinHours || 24;
      formattedTime = `${h}h`;
    }
  }

  if (isSpinningWheel) {
    btn.disabled = true;
    btnText.textContent = 'SPINNING THE WHEEL...';
    btn.className = 'w-full py-3 rounded-2xl bg-slate-800 text-gray-400 font-bold text-xs uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2 select-none shadow-none';
    return;
  }

  if (!currentToken || !currentUser || currentUser.isGuest || currentUser.is_guest) {
    btn.disabled = false;
    btn.className = 'w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:opacity-95 active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all';
    btnText.innerHTML = '<i class="fa-solid fa-user-lock"></i> <span>SIGN IN TO SPIN LUCKY WHEEL</span>';
    return;
  }

  if (isLocked) {
    btn.disabled = true;
    btn.className = 'w-full py-3 rounded-2xl bg-slate-800/90 border border-white/10 text-gray-400 font-bold text-xs uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2 select-none shadow-none';
    btnText.innerHTML = `<i class="fa-solid fa-clock text-amber-400"></i> <span>ALREADY SPUN! NEXT SPIN IN ${formattedTime}</span>`;
  } else {
    btn.disabled = false;
    btn.className = 'w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:opacity-95 active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all';
    btnText.innerHTML = '<i class="fa-solid fa-dharmachakra"></i> <span>SPIN LUCKY WHEEL (1X DAILY)</span>';
  }
}

function initSpinWheelCanvas() {
  const canvas = document.getElementById('spinWheelCanvas');
  if (!canvas) return;
  drawSpinWheel(spinWheelCurrentAngle);
}

function drawSpinWheel(currentAngle) {
  const canvas = document.getElementById('spinWheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const radius = width / 2;
  const sliceCount = SPIN_SLICES.length;
  const sliceAngle = (2 * Math.PI) / sliceCount;

  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(radius, radius);
  ctx.rotate(currentAngle);

  // Draw slices
  for (let i = 0; i < sliceCount; i++) {
    const angle = i * sliceAngle;
    const slice = SPIN_SLICES[i];

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius - 2, angle, angle + sliceAngle);
    ctx.closePath();

    ctx.fillStyle = slice.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0B1020';
    ctx.stroke();

    // Text on slice
    ctx.save();
    ctx.rotate(angle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = slice.textColor;
    ctx.font = 'bold 11px Orbitron, sans-serif';
    ctx.fillText(slice.shortText, radius - 16, 0);
    ctx.restore();
  }

  ctx.restore();
}

async function spinLuckyWheel() {
  if (!currentToken || !currentUser || currentUser.isGuest || currentUser.is_guest) {
    closeWalletModal();
    openAuthModal();
    switchAuthTab('login');
    showToast('🔒 Please sign in or register to spin the Lucky Wheel! Guests cannot spin.');
    return;
  }

  if (isSpinningWheel) return;

  const status = getSpinCooldownStatus();
  if (!status.canSpin) {
    showToast(`⏳ You have already spun today! Next lucky spin in ${status.formatted}`);
    updateSpinButtonState();
    return;
  }

  isSpinningWheel = true;
  // Lock IMMEDIATELY before starting animation so no double-clicking or reloads can exploit
  localStorage.setItem('ott_last_wheel_spin', new Date().toISOString());
  updateSpinButtonState();

  // Hide old result banner
  const banner = document.getElementById('spinResultBanner');
  if (banner) banner.classList.add('hidden');

  // Choose prize (small coin values: 2, 3, 4, 5, 2, 8 (max 8), Better Luck, 3)
  // Indices: 0: 2, 1: 3, 2: 4, 3: 5, 4: 2, 5: 8, 6: Better Luck, 7: 3
  const weights = [30, 25, 15, 12, 20, 8, 15, 25];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;
  let targetIndex = 0;
  for (let i = 0; i < weights.length; i++) {
    if (rand < weights[i]) {
      targetIndex = i;
      break;
    }
    rand -= weights[i];
  }

  const selectedSlice = SPIN_SLICES[targetIndex];

  // The pointer arrow is at the TOP (270 degrees or 3*PI/2)
  const sliceCount = SPIN_SLICES.length;
  const sliceAngle = (2 * Math.PI) / sliceCount;
  const targetSliceCenter = targetIndex * sliceAngle + sliceAngle / 2;
  const targetTopAngle = (3 * Math.PI / 2) - targetSliceCenter;

  // Add 5 to 6 full rotations (in radians)
  const fullRotations = (5 + Math.floor(Math.random() * 2)) * 2 * Math.PI;
  const jitter = (Math.random() - 0.5) * (sliceAngle * 0.45);

  const startAngle = spinWheelCurrentAngle;
  let destAngle = targetTopAngle + jitter;
  while (destAngle < startAngle + fullRotations) {
    destAngle += 2 * Math.PI;
  }

  const totalDelta = destAngle - startAngle;
  const duration = 3600; // ms
  const startTime = performance.now();

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const easedProgress = easeOutCubic(progress);

    spinWheelCurrentAngle = startAngle + totalDelta * easedProgress;
    drawSpinWheel(spinWheelCurrentAngle);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      isSpinningWheel = false;
      spinWheelCurrentAngle = destAngle % (2 * Math.PI);
      drawSpinWheel(spinWheelCurrentAngle);
      updateSpinButtonState();
      handleSpinPrizeWon(selectedSlice);
    }
  }

  requestAnimationFrame(animate);
}

async function handleSpinPrizeWon(prize) {
  const banner = document.getElementById('spinResultBanner');
  if (banner) {
    banner.classList.remove('hidden');
    if (prize.type === 'NONE') {
      banner.className = 'p-2.5 rounded-xl bg-slate-800 border border-white/10 text-gray-300 font-bold text-xs';
      banner.textContent = '🍀 Better luck next time! Next daily spin in 24 hours.';
    } else if (prize.type === 'VIP') {
      banner.className = 'p-2.5 rounded-xl bg-purple-500/20 border border-purple-400 text-purple-300 font-black text-xs animate-bounce';
      banner.textContent = '👑 JACKPOT! You won a 1-Day VIP All-Access Pass!';
    } else {
      banner.className = 'p-2.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 font-black text-xs animate-bounce';
      banner.textContent = `🎉 CONGRATULATIONS! You won +${prize.amount} Free Coins!`;
    }
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

    const res = await fetch('/api/wallet/spin-wheel', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prizeType: prize.type,
        prizeAmount: prize.amount,
        prizeLabel: prize.label
      })
    });
    const data = await res.json();

    if (!data.success) {
      showToast(data.message || 'Already spun today!');
      refreshWalletModalData();
      return;
    }

    if (prize.type === 'COINS' && prize.amount > 0) {
      if (data.newBalance !== undefined) {
        userCoinBalance = Number(data.newBalance);
      } else {
        userCoinBalance += prize.amount;
        localStorage.setItem('ott_coins', userCoinBalance);
      }
      updateCoinUI();
    } else if (prize.type === 'VIP') {
      localStorage.setItem('ott_vip_subscribed', 'true');
      if (currentUser) currentUser.is_subscribed = true;
      updateAuthUI(currentUser);
      populateCarouselZones(allFreeGames);
      filterAllCategory(activeCategory);
    }

    refreshWalletModalData();
    showToast(data.message || `🎡 You won ${prize.label}!`);
  } catch(e) {
    console.error('Spin record error:', e);
  }
}

// -------------------------------------------------------------
// 11. ARCADE AUDIO FX SYNTHESIZER (Web Audio API)
// -------------------------------------------------------------

let audioCtx = null;
let isSoundEnabled = localStorage.getItem('ott_sound_enabled') !== 'false';

function initSoundFX() {
  const icon = document.getElementById('soundToggleIcon');
  if (icon) {
    icon.className = isSoundEnabled ? 'fa-solid fa-volume-high text-neonCyan' : 'fa-solid fa-volume-xmark text-gray-500';
  }
}

function toggleSoundFX() {
  isSoundEnabled = !isSoundEnabled;
  localStorage.setItem('ott_sound_enabled', isSoundEnabled ? 'true' : 'false');
  initSoundFX();
  if (isSoundEnabled) {
    playArcadeSound('coin');
    showToast('🔊 Sound Effects: ON');
  } else {
    showToast('🔇 Sound Effects: MUTED');
  }
}

function playArcadeSound(type) {
  if (!isSoundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;

    if (type === 'coin') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'win') {
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.28);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.3);
      });
    } else if (type === 'click') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch(e) {}
}

// -------------------------------------------------------------
// 12. FAVORITE GAMES BOOKMARKING SYSTEM
// -------------------------------------------------------------

function getFavoriteSlugs() {
  try {
    return JSON.parse(localStorage.getItem('ott_favorite_games') || '[]');
  } catch(e) {
    return [];
  }
}

function isFavoriteGame(slug) {
  return getFavoriteSlugs().includes(slug);
}

function toggleFavoriteGame(slug) {
  let favs = getFavoriteSlugs();
  const index = favs.indexOf(slug);
  let isFav = false;
  if (index !== -1) {
    favs.splice(index, 1);
  } else {
    favs.push(slug);
    isFav = true;
  }
  localStorage.setItem('ott_favorite_games', JSON.stringify(favs));
  playArcadeSound('click');

  if (activeCategory === 'favorites') {
    filterAllCategory('favorites');
  } else {
    document.querySelectorAll(`[data-fav-slug="${slug}"]`).forEach(btn => {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = isFav ? 'fa-heart fa-solid text-rose-500' : 'fa-heart fa-regular text-gray-300 hover:text-rose-400';
      }
    });
  }

  updateTheaterFavoriteBtn();
  showToast(isFav ? '❤️ Added to My Favorites!' : '💔 Removed from Favorites');
}

function updateTheaterFavoriteBtn() {
  const icon = document.getElementById('theaterFavoriteIcon');
  if (icon && window.currentTheaterGameSlug) {
    const isFav = isFavoriteGame(window.currentTheaterGameSlug);
    icon.className = isFav ? 'fa-solid fa-heart text-rose-500' : 'fa-regular fa-heart text-rose-400';
  }
}

function toggleCurrentTheaterFavorite() {
  if (window.currentTheaterGameSlug) {
    toggleFavoriteGame(window.currentTheaterGameSlug);
  }
}

// -------------------------------------------------------------
// 13. SHARE GAME LINK & CHALLENGE A FRIEND
// -------------------------------------------------------------

function shareCurrentGame() {
  const slug = window.currentTheaterGameSlug;
  const game = slug ? window.gameMap[slug] : null;
  const title = game ? cleanGameTitle(game.title) : 'Voltixz Games';
  const shareUrl = `${window.location.origin}/?game=${slug || ''}`;

  if (navigator.share) {
    navigator.share({
      title: `Play ${title} on Voltixz Games!`,
      text: `Challenge me in ${title}! Play free instant arcade on Voltixz Games:`,
      url: shareUrl
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(shareUrl).then(() => {
      playArcadeSound('coin');
      showToast(`🔗 Copied challenge link for ${title}!`);
    }).catch(() => {
      showToast(`Link: ${shareUrl}`);
    });
  }
}

// -------------------------------------------------------------
// 14. DAILY QUESTS & MILESTONES CONTROLLER
// -------------------------------------------------------------

const QUEST_METADATA = [
  { id: 'play_3_games', title: 'Arcade Explorer', desc: 'Play any 3 games in the catalog', target: 3, reward: 30, icon: '🎮' },
  { id: 'beat_ai', title: 'Grandmaster Champion', desc: 'Beat an AI opponent in Chess, Checkers or Ludo', target: 1, reward: 50, icon: '🏆' },
  { id: 'spin_wheel', title: 'Wheel of Fortune', desc: 'Spin today\'s Daily Lucky Wheel', target: 1, reward: 20, icon: '🎡' },
  { id: 'play_vip', title: 'VIP Enthusiast', desc: 'Launch and play any 3D VIP exclusive game', target: 1, reward: 35, icon: '👑' },
  { id: 'daily_bonus', title: 'Dedicated Gamer', desc: 'Claim your daily +50 login bonus', target: 1, reward: 25, icon: '🎁' }
];

function getDailyQuestsProgress() {
  const today = new Date().toISOString().slice(0, 10);
  let state = {};
  try {
    state = JSON.parse(localStorage.getItem('ott_daily_quests') || '{}');
  } catch(e) {}
  if (state.date !== today) {
    state = {
      date: today,
      quests: {
        play_3_games: { count: 0, target: 3, claimed: false },
        beat_ai: { count: 0, target: 1, claimed: false },
        spin_wheel: { count: 0, target: 1, claimed: false },
        play_vip: { count: 0, target: 1, claimed: false },
        daily_bonus: { count: 0, target: 1, claimed: false }
      }
    };
    localStorage.setItem('ott_daily_quests', JSON.stringify(state));
  }
  return state;
}

function recordQuestProgress(action, count = 1) {
  const state = getDailyQuestsProgress();
  if (!state.quests || !state.quests[action]) return;
  const q = state.quests[action];
  if (!q.claimed && q.count < q.target) {
    q.count = Math.min(q.target, q.count + count);
    localStorage.setItem('ott_daily_quests', JSON.stringify(state));
    renderQuestsTab();
  }
}

function renderQuestsTab() {
  const container = document.getElementById('questsContainer');
  if (!container) return;
  const state = getDailyQuestsProgress();

  container.innerHTML = QUEST_METADATA.map(m => {
    const q = (state.quests && state.quests[m.id]) || { count: 0, target: m.target, claimed: false };
    const isCompleted = q.count >= m.target;
    const isClaimed = !!q.claimed;
    const percent = Math.min(100, Math.round((q.count / m.target) * 100));

    let actionBtnHtml = '';
    if (isClaimed) {
      actionBtnHtml = `<span class="px-2.5 py-1 rounded-lg bg-slate-800 text-gray-500 text-[10px] font-bold border border-white/5 select-none"><i class="fa-solid fa-check text-emerald-400 mr-1"></i> CLAIMED</span>`;
    } else if (isCompleted) {
      const claimText = currentToken ? `CLAIM +${m.reward} 🪙` : `<i class="fa-solid fa-user-lock mr-1"></i> SIGN IN TO CLAIM`;
      actionBtnHtml = `<button onclick="claimQuestReward('${m.id}', '${m.title}', ${m.reward})" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-[10px] uppercase shadow-md shadow-emerald-500/20 active:scale-95 transition-all animate-bounce cursor-pointer flex items-center justify-center gap-1">${claimText}</button>`;
    } else {
      actionBtnHtml = `<span class="px-2 py-1 rounded-lg bg-black/50 text-amber-300 font-mono text-[10px] font-bold border border-white/10">${q.count}/${m.target}</span>`;
    }

    return `
      <div class="p-3 rounded-2xl bg-slate-900/80 border ${isCompleted && !isClaimed ? 'border-emerald-400/50 shadow-emerald-500/10' : 'border-white/10'} flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <span class="text-xl shrink-0">${m.icon}</span>
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-white text-xs truncate">${m.title}</span>
              <span class="text-[9px] font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30 shrink-0">+${m.reward} 🪙</span>
            </div>
            <p class="text-[10px] text-gray-400 leading-tight truncate">${m.desc}</p>
            <div class="w-full bg-black/60 rounded-full h-1.5 overflow-hidden border border-white/10">
              <div class="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-300" style="width: ${percent}%"></div>
            </div>
          </div>
        </div>
        <div class="shrink-0">
          ${actionBtnHtml}
        </div>
      </div>
    `;
  }).join('');
}

async function claimQuestReward(questId, questTitle, rewardAmount) {
  if (!currentToken) {
    closeWalletModal();
    openAuthModal();
    switchAuthTab('login');
    showToast('🔒 Please sign in or create an account to claim quest rewards!');
    return;
  }

  const state = getDailyQuestsProgress();
  if (state.quests && state.quests[questId]) {
    state.quests[questId].claimed = true;
    localStorage.setItem('ott_daily_quests', JSON.stringify(state));
  }

  playArcadeSound('win');

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

    const res = await fetch('/api/wallet/claim-quest', {
      method: 'POST',
      headers,
      body: JSON.stringify({ questId, questTitle, rewardAmount })
    });
    const data = await res.json();

    if (data.newBalance !== undefined) {
      userCoinBalance = Number(data.newBalance);
    } else {
      userCoinBalance += rewardAmount;
      localStorage.setItem('ott_coins', userCoinBalance);
    }

    updateCoinUI();
    refreshWalletModalData();
    renderQuestsTab();
    showToast(data.message || `🎉 Quest reward claimed: +${rewardAmount} Coins!`);
  } catch(e) {
    userCoinBalance += rewardAmount;
    localStorage.setItem('ott_coins', userCoinBalance);
    updateCoinUI();
    renderQuestsTab();
    showToast(`🎉 Quest reward claimed: +${rewardAmount} Coins!`);
  }
}

// -------------------------------------------------------------
// 15. GLOBAL CHAMPIONS LEADERBOARD CONTROLLER
// -------------------------------------------------------------

async function openLeaderboardModal() {
  playArcadeSound('click');
  const modal = document.getElementById('leaderboardModal');
  if (modal) {
    modal.classList.remove('hidden');
    renderLeaderboardData();
  }
}

function closeLeaderboardModal() {
  const modal = document.getElementById('leaderboardModal');
  if (modal) modal.classList.add('hidden');
}

async function renderLeaderboardData() {
  const podium = document.getElementById('leaderboardPodium');
  const list = document.getElementById('leaderboardList');
  const myRankBadge = document.getElementById('myRankBadge');
  const myRankUser = document.getElementById('myRankUsername');
  const myRankCoins = document.getElementById('myRankCoins');

  if (myRankCoins) myRankCoins.textContent = Number(userCoinBalance).toLocaleString();
  if (myRankUser) myRankUser.textContent = currentUser ? currentUser.username : 'You (Guest)';

  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    if (data.success && Array.isArray(data.leaders)) {
      const leaders = data.leaders;

      if (podium && leaders.length >= 3) {
        const p1 = leaders[0];
        const p2 = leaders[1];
        const p3 = leaders[2];

        podium.innerHTML = `
          <!-- Rank 2: Silver -->
          <div class="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-500/40 flex flex-col items-center justify-end space-y-1 mt-3">
            <span class="text-base">🥈</span>
            <img src="${p2.avatar_url}" class="w-10 h-10 rounded-full border border-slate-400">
            <span class="font-bold text-white text-[11px] truncate max-w-[80px]">${p2.username}</span>
            <span class="font-orbitron font-black text-amber-300 text-[10px]">${Number(p2.coin_balance).toLocaleString()} 🪙</span>
          </div>

          <!-- Rank 1: Gold -->
          <div class="p-3 rounded-2xl bg-gradient-to-b from-amber-500/20 to-slate-900 border-2 border-amber-400 flex flex-col items-center justify-end space-y-1 shadow-lg shadow-amber-500/20">
            <span class="text-xl animate-bounce">👑</span>
            <img src="${p1.avatar_url}" class="w-12 h-12 rounded-full border-2 border-amber-400 ring-2 ring-amber-400/40">
            <span class="font-extrabold text-white text-xs truncate max-w-[90px]">${p1.username}</span>
            <span class="font-orbitron font-black text-amber-300 text-xs">${Number(p1.coin_balance).toLocaleString()} 🪙</span>
          </div>

          <!-- Rank 3: Bronze -->
          <div class="p-2.5 rounded-2xl bg-slate-900/90 border border-amber-700/40 flex flex-col items-center justify-end space-y-1 mt-4">
            <span class="text-base">🥉</span>
            <img src="${p3.avatar_url}" class="w-10 h-10 rounded-full border border-amber-700">
            <span class="font-bold text-white text-[11px] truncate max-w-[80px]">${p3.username}</span>
            <span class="font-orbitron font-black text-amber-300 text-[10px]">${Number(p3.coin_balance).toLocaleString()} 🪙</span>
          </div>
        `;
      }

      if (list) {
        list.innerHTML = leaders.slice(3).map((player, idx) => {
          const rank = idx + 4;
          return `
            <div class="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between hover:border-white/15 transition-colors">
              <div class="flex items-center gap-2.5">
                <span class="font-orbitron font-bold text-gray-400 text-[11px] w-5 text-center">#${rank}</span>
                <img src="${player.avatar_url}" class="w-7 h-7 rounded-lg border border-white/10">
                <div>
                  <div class="font-bold text-white text-xs flex items-center gap-1.5">
                    ${player.username}
                    ${player.is_subscribed ? '<i class="fa-solid fa-crown text-[8px] text-amber-400"></i>' : ''}
                  </div>
                  <div class="text-[9.5px] text-gray-400">🔥 ${player.win_streak || 0} Streak • ${player.win_count || 0} Wins</div>
                </div>
              </div>
              <span class="font-orbitron font-black text-amber-300 text-xs">${Number(player.coin_balance).toLocaleString()} 🪙</span>
            </div>
          `;
        }).join('');
      }

      if (myRankBadge) {
        myRankBadge.textContent = data.myRank ? `#${data.myRank}` : '#8';
      }
    }
  } catch(e) {
    console.error('Failed to load leaderboard data:', e);
  }
}



// ============================================================================
// VOLTIXZ MULTIPLAYER & PARTY ARENA (REALTIME WEBSOCKET CLIENT)
// ============================================================================
let partyWs = null;
let partyCurrentRoom = null;
let partyMyUser = null;
let partyActiveTab = 'quick';
let partyQuickMatchTimer = null;
let partyIsMyTurn = false;
let partyGameState = null;
const PARTY_PLAYER_COLORS = ['#00F0FF', '#FF0055', '#FFD700', '#00FF66'];

// Initialize Guest Profile if not logged in (using sessionStorage so 2 tabs in same browser are separate players)
function getPartyUser() {
  if (currentUser) {
    return {
      id: currentUser.id,
      username: currentUser.username,
      avatar_url: currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.username)}`,
      isGuest: false
    };
  }
  let savedName = sessionStorage.getItem('voltix_guest_name') || localStorage.getItem('voltix_guest_name');
  if (!savedName) {
    savedName = 'Player_' + Math.floor(1000 + Math.random() * 9000);
    sessionStorage.setItem('voltix_guest_name', savedName);
    localStorage.setItem('voltix_guest_name', savedName);
  }
  let savedId = sessionStorage.getItem('voltix_guest_id');
  if (!savedId) {
    savedId = 'guest_' + Math.floor(100000 + Math.random() * 900000);
    sessionStorage.setItem('voltix_guest_id', savedId);
  }
  return {
    id: savedId,
    username: savedName,
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(savedName)}`,
    isGuest: true
  };
}

function updatePartyUserUI() {
  if (!partyMyUser) partyMyUser = getPartyUser();
  const nameEl = document.getElementById('partyUserName');
  const avatarEl = document.getElementById('partyUserAvatar');
  const tagEl = document.getElementById('partyUserTag');
  const inputEl = document.getElementById('partyGuestNameInput');

  if (nameEl) nameEl.textContent = partyMyUser.username;
  if (avatarEl) avatarEl.src = partyMyUser.avatar_url;
  if (tagEl) {
    tagEl.textContent = partyMyUser.isGuest ? 'GUEST' : 'VIP PLAYER';
    tagEl.className = partyMyUser.isGuest 
      ? 'text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
      : 'text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40';
  }
  if (inputEl && partyMyUser.isGuest) {
    inputEl.value = partyMyUser.username;
  }
}

function updatePartyGuestName() {
  const inputEl = document.getElementById('partyGuestNameInput');
  if (!inputEl) return;
  const newName = inputEl.value.trim();
  if (newName.length < 2) return alert('Name must be at least 2 characters');
  localStorage.setItem('voltix_guest_name', newName);
  updatePartyUserUI();
  if (partyWs && partyWs.readyState === WebSocket.OPEN) {
    partyWs.send(JSON.stringify({
      type: 'AUTH',
      token: currentToken || null,
      guestName: newName,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newName)}`
    }));
  }
  playArcadeSound('click');
}

// Connect WebSocket with Automatic Keep-Alive
function ensurePartyWebSocket(callback) {
  if (partyWs && partyWs.readyState === WebSocket.OPEN) {
    if (callback) callback();
    return;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;

  partyWs = new WebSocket(wsUrl);

  partyWs.onopen = () => {
    console.log('⚡ Voltixz Party WebSocket Connected!');
    const u = getPartyUser();
    partyWs.send(JSON.stringify({
      type: 'AUTH',
      token: currentToken || null,
      guestId: u.id,
      guestName: u.username,
      avatar: u.avatar_url
    }));
    if (callback) callback();
  };

  partyWs.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handlePartySocketMessage(msg);
    } catch(err) {
      console.warn('Party WS message error:', err);
    }
  };

  partyWs.onerror = (err) => {
    console.warn('Party WS error:', err);
  };

  partyWs.onclose = () => {
    console.log('Voltixz Party WS closed.');
  };
}

// Ping Keep-Alive
setInterval(() => {
  if (partyWs && partyWs.readyState === WebSocket.OPEN) {
    partyWs.send(JSON.stringify({ type: 'PING' }));
  }
}, 25000);

// Main Party Message Dispatcher
function handlePartySocketMessage(msg) {
  switch (msg.type) {
    case 'AUTH_SUCCESS':
      partyMyUser = msg.user;
      updatePartyUserUI();
      break;

    case 'PARTY_CREATED':
    case 'PARTY_JOINED':
    case 'PARTY_UPDATED':
      partyCurrentRoom = {
        code: msg.roomCode,
        gameSlug: msg.gameSlug,
        maxPlayers: msg.maxPlayers,
        hostId: msg.hostId,
        status: msg.status || 'LOBBY',
        players: msg.players
      };
      // Ensure party modal is open so joining player is immediately placed in lobby
      openPartyModal();
      showPartyScreen('lobby');
      renderLobbyView();
      playArcadeSound('click');
      break;

    case 'PARTY_ERROR':
      const partyErrEl = document.getElementById('partyJoinErrorMsg');
      if (partyErrEl) {
        partyErrEl.textContent = '❌ ' + (msg.message || 'Party action failed');
        partyErrEl.classList.remove('hidden');
      } else {
        alert(msg.message || 'Party action failed');
      }
      cancelQuickMatch();
      break;

    case 'PARTY_GAME_STARTED':
      partyGameState = msg.gameState;
      partyCurrentRoom.players = msg.players;
      
      // If native dice duel or tic-tac-toe arena:
      if (msg.gameSlug === 'dice-duel' || msg.gameSlug === 'tictactoe-neon') {
        showPartyScreen('arena');
        initGameArena(msg.gameSlug, msg.players, msg.currentTurn, msg.gameState);
      } else {
        // Launch full game in theater with Live Party Room HUD for ALL players!
        launchPartyTheaterGame(msg.gameSlug, msg.roomCode, msg.players);
      }
      playArcadeSound('click');
      break;

    case 'PARTY_GAME_UPDATE':
      const gameIframe = document.getElementById('gameTheaterFrame') || document.getElementById('gameIframe');
      if (gameIframe && gameIframe.contentWindow) {
        try {
          gameIframe.contentWindow.postMessage({
            type: 'PARTY_GAME_UPDATE',
            ...msg
          }, '*');
        } catch(e) {}
      }
      handleGameUpdate(msg);
      break;

    case 'PARTY_CHAT_MESSAGE':
      appendPartyChatMessage(msg);
      break;

    case 'MATCHMAKING_STARTED':
      // Handled in UI countdown
      break;

    case 'MATCH_FOUND':
      // 1v1 Quick Match Ready
      cancelQuickMatch();
      partyCurrentRoom = {
        code: msg.roomId,
        gameSlug: msg.gameSlug || 'dice-duel',
        maxPlayers: 2,
        hostId: msg.player1.id,
        players: [
          { id: msg.player1.id, user: msg.player1, username: msg.player1.username, color: '#00F0FF', score: 0, position: 0 },
          { id: msg.player2.id, user: msg.player2, username: msg.player2.username, color: '#FF0055', score: 0, position: 0 }
        ]
      };
      showPartyScreen('arena');
      initGameArena('dice-duel', partyCurrentRoom.players, msg.currentTurn, { targetScore: 25, boardTiles: 25 });
      playArcadeSound('click');
      break;

    case 'DICE_ROLLED':
      handle1v1DiceRoll(msg);
      break;

    case 'MATCH_COMPLETED':
      showPartyGameOver(msg.winnerName, msg.prizeCoins || 25, [
        { name: 'P1', score: msg.p1Score },
        { name: 'P2', score: msg.p2Score }
      ]);
      break;
  }
}

// -------------------------------------------------------------
// UI SCREEN SWITCHERS & MODAL CONTROLS
// -------------------------------------------------------------
function openPartyModal() {
  const modal = document.getElementById('partyModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  updatePartyUserUI();
  ensurePartyWebSocket();
  showPartyScreen('modeSelect');
  switchPartyTab('join');
  playArcadeSound('click');
}

function openPartyWithTab(tab) {
  openPartyModal();
  switchPartyTab(tab);
}

function closePartyModal(isGameStarting = false) {
  const modal = document.getElementById('partyModal');
  if (modal) modal.classList.add('hidden');
  cancelQuickMatch();
  // CRITICAL: NEVER leave room if game is starting or match is playing!
  if (isGameStarting || window.activePartySession || (partyCurrentRoom && partyCurrentRoom.status === 'PLAYING')) {
    return;
  }
  if (partyCurrentRoom && partyWs && partyWs.readyState === WebSocket.OPEN) {
    partyWs.send(JSON.stringify({ type: 'PARTY_LEAVE' }));
    partyCurrentRoom = null;
  }
}

function showPartyScreen(screenName) {
  const screens = {
    modeSelect: document.getElementById('partyModeSelectScreen'),
    lobby: document.getElementById('partyLobbyScreen'),
    arena: document.getElementById('partyGameArenaScreen'),
    gameOver: document.getElementById('partyGameOverScreen')
  };
  Object.keys(screens).forEach(k => {
    if (screens[k]) screens[k].classList.add('hidden');
  });
  if (screens[screenName]) {
    screens[screenName].classList.remove('hidden');
  }
}

function switchPartyTab(tab) {
  partyActiveTab = tab;
  const tabs = {
    quick: document.getElementById('partyTabQuick'),
    host: document.getElementById('partyTabHost'),
    join: document.getElementById('partyTabJoin')
  };
  const contents = {
    quick: document.getElementById('partyTabContentQuick'),
    host: document.getElementById('partyTabContentHost'),
    join: document.getElementById('partyTabContentJoin')
  };

  Object.keys(tabs).forEach(k => {
    if (tabs[k]) {
      if (k === tab) {
        tabs[k].className = 'flex-1 py-2 rounded-lg bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 text-white font-black uppercase tracking-wider transition-all cursor-pointer shadow-md';
      } else {
        tabs[k].className = 'flex-1 py-2 rounded-lg text-gray-400 hover:text-white uppercase tracking-wider transition-all cursor-pointer';
      }
    }
    if (contents[k]) {
      if (k === tab) contents[k].classList.remove('hidden');
      else contents[k].classList.add('hidden');
    }
  });
}

// -------------------------------------------------------------
// QUICK 1v1 MATCHMAKING
// -------------------------------------------------------------
function startQuickMatchmaking() {
  ensurePartyWebSocket(() => {
    const statusBox = document.getElementById('quickMatchStatusBox');
    const startBtn = document.getElementById('startQuickMatchBtn');
    const statusText = document.getElementById('quickMatchStatusText');

    if (statusBox) statusBox.classList.remove('hidden');
    if (startBtn) startBtn.classList.add('hidden');

    let secondsLeft = 5;
    if (statusText) statusText.textContent = `Matching with player (${secondsLeft}s)...`;

    clearInterval(partyQuickMatchTimer);
    partyQuickMatchTimer = setInterval(() => {
      secondsLeft--;
      if (secondsLeft > 0) {
        if (statusText) statusText.textContent = `Matching with player (${secondsLeft}s)...`;
      } else {
        if (statusText) statusText.textContent = `Pairing with Smart Bot...`;
        clearInterval(partyQuickMatchTimer);
      }
    }, 1000);

    partyWs.send(JSON.stringify({ type: 'QUICK_MATCH', gameSlug: 'dice-duel' }));
    playArcadeSound('click');
  });
}

function cancelQuickMatch() {
  clearInterval(partyQuickMatchTimer);
  const statusBox = document.getElementById('quickMatchStatusBox');
  const startBtn = document.getElementById('startQuickMatchBtn');
  if (statusBox) statusBox.classList.add('hidden');
  if (startBtn) startBtn.classList.remove('hidden');

  if (partyWs && partyWs.readyState === WebSocket.OPEN) {
    partyWs.send(JSON.stringify({ type: 'CANCEL_MATCHMAKING', gameSlug: 'dice-duel' }));
  }
}

// -------------------------------------------------------------
// PRIVATE PARTY HOST & JOIN
// -------------------------------------------------------------
// PRIVATE PARTY HOST & JOIN
// -------------------------------------------------------------
function createPartyRoom(explicitSlug = null) {
  ensurePartyWebSocket(() => {
    const gameChoice = explicitSlug || document.querySelector('input[name="partyGameChoice"]:checked')?.value || 'ludo-hero-ai';
    const maxPlayers = parseInt(document.querySelector('input[name="partyMaxPlayers"]:checked')?.value) || 4;

    partyWs.send(JSON.stringify({
      type: 'PARTY_CREATE',
      gameSlug: gameChoice,
      maxPlayers
    }));
    playArcadeSound('click');
  });
}

function updatePartyChoiceCardHighlight(slug) {
  const cards = document.querySelectorAll('.party-game-radio-card');
  cards.forEach(c => {
    const cardSlug = c.getAttribute('data-slug');
    if (cardSlug === slug) {
      c.classList.remove('border-white/15', 'bg-slate-900/90');
      c.classList.add('border-2', 'border-pink-500/80', 'bg-pink-950/40');
      const radio = c.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    } else {
      c.classList.remove('border-2', 'border-pink-500/80', 'bg-pink-950/40');
      c.classList.add('border', 'border-white/15', 'bg-slate-900/90');
    }
  });
}

document.addEventListener('click', (e) => {
  const card = e.target.closest('.party-game-radio-card');
  if (card) {
    const slug = card.getAttribute('data-slug');
    if (slug) {
      updatePartyChoiceCardHighlight(slug);
      playArcadeSound('click');
    }
  }
});

function joinPartyRoom(codeFromUrl) {
  const inputEl = document.getElementById('partyJoinCodeInput');
  const errorEl = document.getElementById('partyJoinErrorMsg');
  const code = (typeof codeFromUrl === 'string' && codeFromUrl.trim() ? codeFromUrl : inputEl?.value || '').trim().toUpperCase();

  if (!code) {
    if (errorEl) {
      errorEl.textContent = '⚠️ Pehle friend dwara share kiya gaya room code enter karein (e.g. VX-8492)';
      errorEl.classList.remove('hidden');
    }
    if (inputEl) {
      inputEl.focus();
      inputEl.classList.add('border-rose-500');
      setTimeout(() => inputEl.classList.remove('border-rose-500'), 2500);
    }
    return;
  }

  if (errorEl) errorEl.classList.add('hidden');
  if (inputEl) inputEl.value = code;

  ensurePartyWebSocket(() => {
    const u = getPartyUser();
    partyWs.send(JSON.stringify({
      type: 'PARTY_JOIN',
      roomCode: code,
      guestId: u.id,
      guestName: u.username,
      avatar: u.avatar_url
    }));
    playArcadeSound('click');
  });
}

function partyAddBot() {
  if (!partyCurrentRoom || !partyWs) return;
  partyWs.send(JSON.stringify({
    type: 'PARTY_ADD_BOT',
    roomCode: partyCurrentRoom.code
  }));
  playArcadeSound('click');
}

function leavePartyRoom() {
  if (partyWs && partyWs.readyState === WebSocket.OPEN) {
    partyWs.send(JSON.stringify({ type: 'PARTY_LEAVE' }));
  }
  partyCurrentRoom = null;
  const partyBar = document.getElementById('theaterPartyLiveBar');
  if (partyBar) partyBar.classList.add('hidden');
  showPartyScreen('modeSelect');
  playArcadeSound('click');
}

function startPartyGame() {
  if (!partyCurrentRoom || !partyWs) return;
  partyWs.send(JSON.stringify({
    type: 'PARTY_START',
    roomCode: partyCurrentRoom.code
  }));
  playArcadeSound('click');
}

function copyPartyCode() {
  if (!partyCurrentRoom?.code) return;
  navigator.clipboard.writeText(partyCurrentRoom.code);
  const btn = document.getElementById('copyCodeBtnText');
  if (btn) {
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy Code'; }, 2000);
  }
  playArcadeSound('click');
}

function copyPartyInviteLink() {
  if (!partyCurrentRoom?.code) return;
  const link = `${window.location.origin}/?party=${encodeURIComponent(partyCurrentRoom.code)}`;
  navigator.clipboard.writeText(link);
  const btn = document.getElementById('copyLinkBtnText');
  if (btn) {
    btn.textContent = 'Link Copied!';
    setTimeout(() => { btn.textContent = 'Share Link'; }, 2000);
  }
  playArcadeSound('click');
}

function sharePartyOnWhatsApp() {
  if (!partyCurrentRoom?.code) return;
  const link = `${window.location.origin}/?party=${encodeURIComponent(partyCurrentRoom.code)}`;
  const text = `🎮 Join my game room on Voltixz Arena!\n🔑 Room Code: *${partyCurrentRoom.code}*\n⚡ Tap link to join & play now: ${link}`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
}

// Launch full game in theater with live party HUD
function launchPartyTheaterGame(slug, roomCode, players) {
  // Save active party session details BEFORE closing modal
  window.activePartySession = {
    slug,
    roomCode,
    players,
    myUser: partyMyUser || getPartyUser()
  };
  if (partyCurrentRoom) {
    partyCurrentRoom.status = 'PLAYING';
  }

  closePartyModal(true);
  closeGameModeModal();

  // Launch game in theater directly
  launchGameBySlug(slug, true);

  const partyBar = document.getElementById('theaterPartyLiveBar');
  const codeEl = document.getElementById('theaterPartyRoomCode');
  const playersList = document.getElementById('theaterPartyPlayersList');

  if (partyBar) partyBar.classList.remove('hidden');
  if (codeEl) codeEl.textContent = roomCode;

  if (playersList && Array.isArray(players)) {
    playersList.innerHTML = players.map(p => `
      <img src="${p.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + p.username}" 
           title="${p.username} ${p.isBot ? '(BOT)' : ''}" 
           class="w-6 h-6 rounded-full border-2 border-slate-900 object-cover bg-slate-800" 
           style="border-color: ${p.color || '#00F0FF'}">
    `).join('');
  }
}

function sendPartyEmoji(emoji) {
  if (partyWs && partyWs.readyState === WebSocket.OPEN && partyCurrentRoom) {
    partyWs.send(JSON.stringify({
      type: 'PARTY_CHAT',
      emoji: emoji,
      text: ''
    }));
  }
  showFloatingEmoji(emoji);
}

function showFloatingEmoji(emoji) {
  const layer = document.getElementById('theaterFloatingEmojiLayer');
  if (!layer) return;

  const el = document.createElement('div');
  el.textContent = emoji;
  el.className = 'absolute text-4xl sm:text-5xl select-none transition-all duration-1000';
  const left = Math.random() * 70 + 15;
  el.style.left = left + '%';
  el.style.bottom = '15%';
  el.style.opacity = '1';

  layer.appendChild(el);

  setTimeout(() => {
    el.style.transform = 'translateY(-140px) scale(1.5)';
    el.style.opacity = '0';
  }, 40);

  setTimeout(() => {
    el.remove();
  }, 1200);

  playArcadeSound('click');
}

function toggleTheaterPartyChat() {
  const drawer = document.getElementById('theaterPartyChatDrawer');
  if (drawer) drawer.classList.toggle('hidden');
}

function sendTheaterPartyChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById('theaterPartyChatInput');
  const text = (input?.value || '').trim();
  if (!text || !partyWs || !partyCurrentRoom) return;

  partyWs.send(JSON.stringify({
    type: 'PARTY_CHAT',
    text: text,
    emoji: null
  }));
  input.value = '';
}

function renderLobbyView() {
  if (!partyCurrentRoom) return;

  const codeDisplay = document.getElementById('lobbyRoomCodeDisplay');
  const countEl = document.getElementById('lobbyPlayerCount');
  const maxCountEl = document.getElementById('lobbyMaxPlayerCount');
  const gameBadge = document.getElementById('lobbyGameNameBadge');
  const playersGrid = document.getElementById('lobbyPlayersGrid');
  const startBtn = document.getElementById('lobbyStartGameBtn');
  const addBotBtn = document.getElementById('lobbyAddBotBtn');
  const waitNotice = document.getElementById('lobbyWaitingNotice');

  if (codeDisplay) codeDisplay.textContent = partyCurrentRoom.code;
  if (countEl) countEl.textContent = partyCurrentRoom.players.length;
  if (maxCountEl) maxCountEl.textContent = partyCurrentRoom.maxPlayers;
  if (gameBadge) {
    const g = window.gameMap[partyCurrentRoom.gameSlug];
    const name = g ? cleanGameTitle(g.title) : (
      partyCurrentRoom.gameSlug === 'ludo-hero-ai' ? 'Ludo Hero' :
      partyCurrentRoom.gameSlug === 'carrom-clash-ai' ? 'Carrom Clash' :
      partyCurrentRoom.gameSlug === 'chess-master-ai' ? 'Chess Master' :
      partyCurrentRoom.gameSlug === 'checkers-classic-ai' ? 'Checkers Classic' :
      partyCurrentRoom.gameSlug === 'connect4-arena-ai' ? 'Connect 4' :
      partyCurrentRoom.gameSlug === 'tictactoe-neon' ? 'Neon Tic-Tac-Toe' :
      partyCurrentRoom.gameSlug === 'dice-duel' ? 'Neon Dice Duel' :
      partyCurrentRoom.gameSlug
    );
    gameBadge.textContent = '🎮 ' + name;
  }

  const isHost = partyMyUser && (
    partyCurrentRoom.hostId === partyMyUser.id || 
    (partyCurrentRoom.players[0] && partyCurrentRoom.players[0].id === partyMyUser.id) ||
    (partyCurrentRoom.players[0] && partyCurrentRoom.players[0].username === partyMyUser.username)
  );

  if (startBtn && waitNotice) {
    if (isHost) {
      if (addBotBtn) {
        if (partyCurrentRoom.players.length < partyCurrentRoom.maxPlayers) {
          addBotBtn.classList.remove('hidden');
        } else {
          addBotBtn.classList.add('hidden');
        }
      }
      startBtn.classList.remove('hidden');
      waitNotice.classList.add('hidden');
      if (partyCurrentRoom.players.length >= 2) {
        startBtn.disabled = false;
        startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      } else {
        startBtn.disabled = true;
        startBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
    } else {
      if (addBotBtn) addBotBtn.classList.add('hidden');
      startBtn.classList.add('hidden');
      waitNotice.classList.remove('hidden');
    }
  }

  if (playersGrid) {
    const slots = [];
    for (let i = 0; i < partyCurrentRoom.maxPlayers; i++) {
      const p = partyCurrentRoom.players[i];
      if (p) {
        slots.push(`
          <div class="p-3 rounded-2xl bg-slate-900/90 border border-white/15 text-center relative overflow-hidden group">
            <div class="w-2 h-2 rounded-full absolute top-2 right-2" style="background-color: ${p.color}; box-shadow: 0 0 8px ${p.color}"></div>
            <img src="${p.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + p.username}" class="w-12 h-12 mx-auto rounded-xl bg-slate-800 border border-white/20 object-cover mb-1.5">
            <div class="font-extrabold text-white text-xs truncate flex items-center justify-center gap-1">
              ${p.username}
              ${p.isHost ? '<i class="fa-solid fa-crown text-amber-400 text-[10px]" title="Host"></i>' : ''}
              ${p.isBot ? '<span class="text-[8.5px] bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded border border-cyan-400/30">BOT</span>' : ''}
            </div>
            <span class="text-[9.5px] font-black uppercase text-emerald-400 block mt-0.5">READY</span>
          </div>
        `);
      } else {
        if (isHost) {
          slots.push(`
            <div onclick="partyAddBot()" class="p-3 rounded-2xl bg-black/40 border border-dashed border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/20 text-center flex flex-col items-center justify-center min-h-[96px] text-gray-400 hover:text-cyan-300 cursor-pointer transition-all">
              <i class="fa-solid fa-robot text-base mb-1 text-cyan-400"></i>
              <span class="text-[10px] font-black uppercase tracking-wider">+ Add Bot</span>
            </div>
          `);
        } else {
          slots.push(`
            <div class="p-3 rounded-2xl bg-black/40 border border-dashed border-white/10 text-center flex flex-col items-center justify-center min-h-[96px] text-gray-500">
              <i class="fa-solid fa-user-plus text-base mb-1"></i>
              <span class="text-[10px] font-bold uppercase">Empty Slot</span>
            </div>
          `);
        }
      }
    }
    playersGrid.innerHTML = slots.join('');
  }
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// LIVE ARENA GAME ENGINES (DICE DUEL & TIC-TAC-TOE)
// -------------------------------------------------------------
function initGameArena(gameSlug, players, currentTurn, gameState) {
  partyGameState = gameState;
  const container = document.getElementById('arenaGameBoardContainer');
  const targetEl = document.getElementById('arenaTargetScore');
  if (targetEl) targetEl.textContent = (gameState?.targetScore || 30) + ' PTS';

  if (container) {
    if (gameSlug === 'tictactoe-neon') {
      renderTicTacToeArena(container, gameState?.grid || Array(9).fill(null), players);
    } else {
      // Default Dice Duel Neon Track
      renderDiceDuelArena(container, players);
    }
  }

  // MUST update indicator AFTER rendering DOM elements so arenaRollDiceBtn exists!
  updateTurnIndicator(currentTurn, players);
}

function updateTurnIndicator(currentTurnId, players) {
  partyIsMyTurn = partyMyUser && currentTurnId && (String(partyMyUser.id) === String(currentTurnId));
  const ind = document.getElementById('arenaTurnIndicator');
  const sub = document.getElementById('arenaTurnSubText');
  const rollBtn = document.getElementById('arenaRollDiceBtn');

  const curPlayer = players ? players.find(p => String(p.id || p.user?.id) === String(currentTurnId)) : null;
  const name = curPlayer ? (curPlayer.username || curPlayer.user?.username) : 'Opponent';

  if (ind) {
    if (partyIsMyTurn) {
      ind.textContent = '👉 YOUR TURN!';
      ind.className = 'font-orbitron font-extrabold text-xs sm:text-sm text-neonCyan animate-pulse';
    } else {
      ind.textContent = `⏳ ${name}'s Turn...`;
      ind.className = 'font-orbitron font-extrabold text-xs sm:text-sm text-gray-300';
    }
  }

  if (sub) {
    sub.textContent = partyIsMyTurn ? 'Tap ROLL DICE to advance on the track!' : 'Waiting for move...';
  }

  if (rollBtn) {
    rollBtn.disabled = !partyIsMyTurn;
    if (partyIsMyTurn) {
      rollBtn.className = 'px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse';
    } else {
      rollBtn.className = 'px-8 py-3 rounded-2xl bg-slate-800 text-gray-500 font-black text-xs uppercase tracking-wider transition-all cursor-not-allowed opacity-60';
    }
  }
}

function renderDiceDuelArena(container, players) {
  const maxScore = partyGameState?.targetScore || 30;
  container.innerHTML = `
    <!-- Neon Track (30 Tiles) -->
    <div class="space-y-3">
      <div class="flex items-center justify-between text-[11px] text-gray-400 font-bold px-1">
        <span>START (Tile 0)</span>
        <span class="text-amber-300 flex items-center gap-1"><i class="fa-solid fa-crown text-xs"></i> FINISH (Tile ${maxScore})</span>
      </div>

      <div class="relative w-full h-14 bg-slate-900 rounded-2xl border border-white/15 p-1 flex items-center overflow-x-auto no-scrollbar" id="diceDuelTrackBar">
        <!-- Progress track line -->
        <div class="absolute left-2 right-2 h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-amber-500 rounded-full opacity-40"></div>
        <!-- Boost Markers -->
        <div class="absolute left-[23%] text-[9px] text-cyan-300 font-black" title="Tile 7 Boost +3">🚀</div>
        <div class="absolute left-[46%] text-[9px] text-cyan-300 font-black" title="Tile 14 Boost +3">🚀</div>
        <div class="absolute left-[70%] text-[9px] text-cyan-300 font-black" title="Tile 21 Boost +3">🚀</div>
        <!-- Trap Markers -->
        <div class="absolute left-[36%] text-[9px] text-rose-400 font-black" title="Tile 11 Trap -2">⚡</div>
        <div class="absolute left-[76%] text-[9px] text-rose-400 font-black" title="Tile 23 Trap -2">⚡</div>

        <!-- Player Tokens -->
        <div id="diceTrackTokensContainer" class="w-full relative h-full flex items-center">
          ${players.map((p, idx) => {
            const pos = p.position || p.score || 0;
            const pct = Math.min(94, Math.max(2, (pos / maxScore) * 90));
            const color = p.color || PARTY_PLAYER_COLORS[idx % 4];
            const pId = p.id || p.user?.id;
            const pName = p.username || p.user?.username || 'Player';
            return `
              <div id="playerToken_${pId}" class="absolute -translate-x-1/2 flex flex-col items-center transition-all duration-500 ease-out z-10" style="left: ${pct}%;">
                <div class="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-black shadow-lg" style="background-color: ${color}; box-shadow: 0 0 10px ${color}">
                  ${pName.charAt(0).toUpperCase()}
                </div>
                <span class="text-[8px] font-black text-white bg-black/80 px-1 rounded truncate max-w-[50px]">${pName}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Player Score Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
        ${players.map((p, idx) => {
          const pId = p.id || p.user?.id;
          const pName = p.username || p.user?.username || 'Player';
          const color = p.color || PARTY_PLAYER_COLORS[idx % 4];
          return `
            <div class="p-2 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
              <span class="font-bold text-white truncate max-w-[80px]">${pName}</span>
              <span class="font-orbitron font-black" style="color: ${color}">
                <span id="scoreVal_${pId}">${p.position || p.score || 0}</span> / ${maxScore}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Center Dice Action Area -->
    <div class="text-center py-4 space-y-3">
      <div id="animatedDiceCube" class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-slate-100 to-white text-black font-black text-3xl flex items-center justify-center shadow-xl shadow-cyan-500/20 border-2 border-cyan-400 select-none">
        <span id="diceFaceValue">🎲</span>
      </div>

      <div id="diceRollEventText" class="text-xs font-bold text-cyan-300 min-h-[18px]">
        Tap ROLL DICE to begin race!
      </div>

      <div>
        <button id="arenaRollDiceBtn" onclick="performPartyRollDice()" class="px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer">
          <i class="fa-solid fa-dice mr-1.5"></i> ROLL DICE
        </button>
      </div>
    </div>
  `;
}

function renderTicTacToeArena(container, grid, players) {
  container.innerHTML = `
    <div class="max-w-[260px] mx-auto py-2">
      <div class="grid grid-cols-3 gap-2.5 aspect-square">
        ${grid.map((cell, idx) => `
          <button onclick="performTicTacToeMove(${idx})" class="w-full h-full rounded-2xl bg-slate-900 border-2 border-white/15 hover:border-cyan-400 flex items-center justify-center font-orbitron font-black text-3xl transition-all ${cell ? (cell === 'X' ? 'text-cyan-400' : 'text-pink-500') : 'text-transparent hover:bg-slate-800'} cursor-pointer">
            ${cell || ''}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function performPartyRollDice() {
  if (!partyIsMyTurn || !partyWs) return;
  partyIsMyTurn = false;
  updateTurnIndicator(null, partyCurrentRoom?.players || []);

  // Play dice sound & shake visual
  playArcadeSound('click');
  const cube = document.getElementById('animatedDiceCube');
  if (cube) {
    cube.classList.add('animate-spin');
    setTimeout(() => { cube.classList.remove('animate-spin'); }, 500);
  }

  if (partyCurrentRoom?.code?.startsWith('MATCH-') || partyCurrentRoom?.code?.startsWith('BOT-MATCH-')) {
    partyWs.send(JSON.stringify({
      type: 'GAME_ACTION',
      roomId: partyCurrentRoom.code,
      action: 'ROLL_DICE',
      data: {}
    }));
  } else {
    partyWs.send(JSON.stringify({
      type: 'PARTY_ACTION',
      action: 'ROLL_DICE',
      data: {}
    }));
  }
}

function performTicTacToeMove(cellIndex) {
  if (!partyIsMyTurn || !partyWs) return;
  partyWs.send(JSON.stringify({
    type: 'PARTY_ACTION',
    action: 'TICTACTOE_MOVE',
    data: { index: cellIndex }
  }));
  playArcadeSound('click');
}

function handleGameUpdate(msg) {
  if (msg.action === 'ROLL_DICE') {
    const diceFace = document.getElementById('diceFaceValue');
    const eventText = document.getElementById('diceRollEventText');
    const scoreVal = document.getElementById(`scoreVal_${msg.rollerId}`);
    const token = document.getElementById(`playerToken_${msg.rollerId}`);

    if (diceFace) diceFace.textContent = msg.roll;
    if (eventText) {
      eventText.textContent = msg.tileEvent ? `Rolled ${msg.roll} → ${msg.tileEvent}` : `Rolled ${msg.roll}! Moving to tile ${msg.newPosition}`;
    }
    if (scoreVal) scoreVal.textContent = msg.newPosition;
    if (token) {
      const pct = Math.min(95, Math.max(2, (msg.newPosition / 30) * 92));
      token.style.left = `${pct}%`;
    }

    if (msg.gameOver) {
      setTimeout(() => {
        showPartyGameOver(msg.winner.username, msg.winner.prizeCoins, msg.players);
      }, 700);
    } else {
      updateTurnIndicator(msg.nextTurn, partyCurrentRoom.players);
    }
  }

  else if (msg.action === 'TICTACTOE_MOVE') {
    const container = document.getElementById('arenaGameBoardContainer');
    if (container) {
      renderTicTacToeArena(container, msg.grid, partyCurrentRoom.players);
    }

    if (msg.gameOver) {
      if (msg.isDraw) {
        showPartyGameOver('Draw Match!', 10, partyCurrentRoom.players);
      } else {
        showPartyGameOver(msg.winner.username, msg.winner.prizeCoins, partyCurrentRoom.players);
      }
    } else {
      updateTurnIndicator(msg.nextTurn, partyCurrentRoom.players);
    }
  }
}

function handle1v1DiceRoll(msg) {
  const diceFace = document.getElementById('diceFaceValue');
  const eventText = document.getElementById('diceRollEventText');
  if (diceFace) diceFace.textContent = msg.roll;

  const target = msg.targetScore || 25;
  const p1 = partyCurrentRoom?.players[0];
  const p2 = partyCurrentRoom?.players[1];
  if (!p1 || !p2) return;

  const p1Id = p1.id || p1.user?.id;
  const p2Id = p2.id || p2.user?.id;

  const p1ScoreEl = document.getElementById(`scoreVal_${p1Id}`);
  const p2ScoreEl = document.getElementById(`scoreVal_${p2Id}`);
  if (p1ScoreEl) p1ScoreEl.textContent = msg.p1Score;
  if (p2ScoreEl) p2ScoreEl.textContent = msg.p2Score;

  const tokenP1 = document.getElementById(`playerToken_${p1Id}`);
  const tokenP2 = document.getElementById(`playerToken_${p2Id}`);

  if (tokenP1) tokenP1.style.left = `${Math.min(94, Math.max(2, (msg.p1Score / target) * 90))}%`;
  if (tokenP2) tokenP2.style.left = `${Math.min(94, Math.max(2, (msg.p2Score / target) * 90))}%`;

  const isRollerMe = partyMyUser && (String(msg.rollerId) === String(partyMyUser.id));
  if (eventText) {
    eventText.textContent = isRollerMe ? `You rolled a ${msg.roll}!` : `Opponent rolled a ${msg.roll}!`;
  }

  // Switch turn
  const nextTurnId = (String(msg.rollerId) === String(p1Id)) ? p2Id : p1Id;
  updateTurnIndicator(nextTurnId, partyCurrentRoom.players);
}

function showPartyGameOver(winnerName, prizeCoins, players) {
  showPartyScreen('gameOver');
  playArcadeSound('win');

  const winnerEl = document.getElementById('partyWinnerName');
  const scoresList = document.getElementById('partyFinalScoresList');

  if (winnerEl) winnerEl.textContent = `${winnerName} Wins!`;
  if (scoresList && players) {
    scoresList.innerHTML = players.map(p => `
      <div class="flex items-center justify-between p-1.5 rounded-lg bg-black/40">
        <span class="text-white font-bold">${p.username || p.name || 'Player'}</span>
        <span class="text-amber-300 font-orbitron font-black">${p.score || p.position || 0} PTS</span>
      </div>
    `).join('');
  }

  // Update user coin balance in UI (only registered non-guest users)
  if (currentToken && currentUser && !currentUser.isGuest && !currentUser.is_guest && prizeCoins > 0) {
    userCoinBalance += Math.min(Number(prizeCoins) || 0, 5);
    localStorage.setItem('ott_coins', userCoinBalance);
    updateCoinUI();
  }
}

function backToPartyLobby() {
  if (partyCurrentRoom) {
    showPartyScreen('lobby');
    renderLobbyView();
  } else {
    showPartyScreen('modeSelect');
  }
}

// -------------------------------------------------------------
// LIVE CHAT & EMOJI REACTIONS
// -------------------------------------------------------------
function sendPartyEmoji(emoji) {
  if (!partyWs || partyWs.readyState !== WebSocket.OPEN) return;
  partyWs.send(JSON.stringify({
    type: 'PARTY_CHAT',
    emoji
  }));
}

function sendPartyChatMessage() {
  const input = document.getElementById('partyChatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  if (!partyWs || partyWs.readyState !== WebSocket.OPEN) return;

  partyWs.send(JSON.stringify({
    type: 'PARTY_CHAT',
    text
  }));
  input.value = '';
}

function appendPartyChatMessage(msg) {
  const stream = document.getElementById('partyChatMessagesStream');
  if (!stream) return;

  if (msg.emoji) {
    // Floating emoji animation on screen
    const floating = document.createElement('div');
    floating.textContent = msg.emoji;
    floating.className = 'fixed z-[60] text-4xl animate-bounce pointer-events-none';
    floating.style.left = `${Math.floor(20 + Math.random() * 60)}%`;
    floating.style.top = `${Math.floor(30 + Math.random() * 40)}%`;
    document.body.appendChild(floating);
    setTimeout(() => { floating.remove(); }, 2000);
  }

  if (msg.text) {
    const el = document.createElement('div');
    el.className = 'p-1 px-2 rounded-lg bg-white/5 border border-white/5 flex items-center gap-1.5 text-[11px]';
    el.innerHTML = `
      <span class="font-bold text-cyan-300">${msg.senderName}:</span>
      <span class="text-gray-200">${msg.text}</span>
    `;
    stream.appendChild(el);
    stream.scrollTop = stream.scrollHeight;
  }
}

// -------------------------------------------------------------
// URL INVITE AUTO-JOIN ON PAGE LOAD (?party=VX-XXXX)
// -------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const partyCode = params.get('party') || params.get('room');
  if (partyCode) {
    setTimeout(() => {
      openPartyModal();
      joinPartyRoom(partyCode);
    }, 800);
  }
});

// -------------------------------------------------------------
// PARTY GAME IFRAME BRIDGE (LUDO & BOARD GAMES MULTIPLAYER)
// -------------------------------------------------------------
window.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'PARTY_ACTION' || (event.data.action && event.data.action.startsWith('LUDO_')) || event.data.action === 'BOARD_ACTION') {
    ensurePartyWebSocket(() => {
      if (partyWs && partyWs.readyState === WebSocket.OPEN) {
        partyWs.send(JSON.stringify({
          type: 'PARTY_ACTION',
          roomCode: event.data.roomCode || window.activePartySession?.roomCode || (window.currentPartyRoom && window.currentPartyRoom.code),
          gameSlug: event.data.gameSlug || 'ludo-hero-ai',
          ...event.data
        }));
      }
    });
  }
});
