const fs = require('fs');
const path = require('path');
const db = require('../db.js');

// In-Memory Active Sessions Store
// Key: userId, Value: { id, username, ip, userAgent, lastSeen }
const activeSessions = new Map();

// Helper to sanitize IP
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.socket?.remoteAddress || 
         req.ip || 
         '127.0.0.1';
}

// Track user activity
function trackActiveUser(userId, username, ip = '127.0.0.1', userAgent = 'Unknown') {
  if (!userId || !username) return;
  activeSessions.set(Number(userId), {
    id: Number(userId),
    username,
    ip,
    userAgent,
    lastSeen: Date.now()
  });
}

// Remove inactive sessions (inactive > 15 minutes)
function cleanStaleSessions() {
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
  for (const [userId, session] of activeSessions.entries()) {
    if (session.lastSeen < fifteenMinutesAgo) {
      activeSessions.delete(userId);
    }
  }
}
setInterval(cleanStaleSessions, 60 * 1000);

// Record login event in DB and active session
async function recordLogin(userId, username, ip, userAgent, loginType = 'STANDARD') {
  try {
    trackActiveUser(userId, username, ip, userAgent);

    // Update last_login_at in users table
    if (userId) {
      await db.query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [userId]
      ).catch(() => {});
    }

    // Insert into login_logs
    await db.query(
      `INSERT INTO login_logs (user_id, username, ip_address, user_agent, login_type, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId || null, username, ip, userAgent, loginType]
    );
  } catch (err) {
    console.error('Failed to record login log:', err.message);
  }
}

// Get live active sessions
function getActiveSessionsList() {
  cleanStaleSessions();
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const list = [];
  for (const session of activeSessions.values()) {
    list.push({
      ...session,
      isOnline: session.lastSeen >= fiveMinutesAgo,
      activeSecondsAgo: Math.round((Date.now() - session.lastSeen) / 1000)
    });
  }
  return list.sort((a, b) => b.lastSeen - a.lastSeen);
}

// Get Dashboard Statistics
async function getDashboardStats() {
  cleanStaleSessions();
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  let onlineNowCount = 0;
  for (const session of activeSessions.values()) {
    if (session.lastSeen >= fiveMinutesAgo) onlineNowCount++;
  }

  const [usersCountRes, gamesCountRes, walletCoinsRes, recentLoginsRes, categoryStatsRes] = await Promise.all([
    db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE username LIKE 'Gamer_%' OR phone_or_email LIKE '+9199999%') as guest_users,
        COUNT(*) FILTER (WHERE username NOT LIKE 'Gamer_%' AND phone_or_email NOT LIKE '+9199999%') as registered_users,
        COUNT(*) FILTER (WHERE is_banned = true) as banned_users,
        COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '24 hours') as active_today
      FROM users
    `),
    db.query(`
      SELECT 
        COUNT(*) as total_games,
        COUNT(*) FILTER (WHERE is_featured = true) as featured_games,
        COALESCE(SUM(plays_count), 0) as total_plays
      FROM games
    `),
    db.query(`
      SELECT 
        COALESCE(SUM(coin_balance), 0) as total_coins_in_circulation,
        COALESCE(SUM(bonus_coins), 0) as total_bonus_coins
      FROM wallets
    `),
    db.query(`
      SELECT COUNT(*) as logins_24h 
      FROM login_logs 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `),
    db.query(`
      SELECT category, COUNT(*) as count, COALESCE(SUM(plays_count), 0) as plays
      FROM games 
      GROUP BY category 
      ORDER BY count DESC
    `)
  ]);

  const u = usersCountRes.rows[0] || {};
  const g = gamesCountRes.rows[0] || {};
  const w = walletCoinsRes.rows[0] || {};
  const l = recentLoginsRes.rows[0] || {};

  return {
    totalUsers: Number(u.total_users || 0),
    guestUsers: Number(u.guest_users || 0),
    registeredUsers: Number(u.registered_users || 0),
    bannedUsers: Number(u.banned_users || 0),
    activeToday: Number(u.active_today || 0),
    onlineNow: onlineNowCount,
    totalGames: Number(g.total_games || 0),
    featuredGames: Number(g.featured_games || 0),
    totalPlays: Number(g.total_plays || 0),
    totalCoins: Number(w.total_coins_in_circulation || 0),
    logins24h: Number(l.logins_24h || 0),
    categoryStats: categoryStatsRes.rows
  };
}

// Get Users List (Searchable, filterable)
async function getUsersList({ search = '', filter = 'all', limit = 50, offset = 0 } = {}) {
  cleanStaleSessions();
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  let query = `
    SELECT 
      u.id, 
      u.username, 
      u.phone_or_email, 
      u.avatar_url, 
      u.country_code, 
      u.is_banned, 
      u.is_admin,
      u.win_count, 
      u.loss_count, 
      u.win_streak,
      u.last_login_at, 
      u.created_at,
      COALESCE(w.coin_balance, 0) as coin_balance,
      COALESCE(w.bonus_coins, 0) as bonus_coins
    FROM users u
    LEFT JOIN wallets w ON u.id = w.user_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (u.username ILIKE $${params.length} OR u.phone_or_email ILIKE $${params.length})`;
  }

  if (filter === 'registered') {
    query += ` AND (u.username NOT LIKE 'Gamer_%' AND u.phone_or_email NOT LIKE '+9199999%')`;
  } else if (filter === 'guest') {
    query += ` AND (u.username LIKE 'Gamer_%' OR u.phone_or_email LIKE '+9199999%')`;
  } else if (filter === 'banned') {
    query += ` AND u.is_banned = true`;
  }

  query += ` ORDER BY u.last_login_at DESC NULLS LAST, u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const res = await db.query(query, params);
  
  // Attach live online status
  const users = res.rows.map(user => {
    const session = activeSessions.get(user.id);
    const isOnline = session && session.lastSeen >= fiveMinutesAgo;
    return {
      ...user,
      is_online: !!isOnline,
      last_active_session: session || null
    };
  });

  return users;
}

// Toggle User Ban
async function toggleUserBan(userId) {
  const current = await db.query('SELECT is_banned, username FROM users WHERE id = $1', [userId]);
  if (current.rows.length === 0) throw new Error('User not found');
  
  const newStatus = !current.rows[0].is_banned;
  await db.query('UPDATE users SET is_banned = $1 WHERE id = $2', [newStatus, userId]);
  
  if (newStatus) {
    // If banned, kick from active sessions
    activeSessions.delete(Number(userId));
  }

  return { userId, username: current.rows[0].username, is_banned: newStatus };
}

// Get Login Logs History
async function getLoginLogs(limit = 100) {
  const res = await db.query(
    `SELECT l.id, l.user_id, l.username, l.ip_address, l.user_agent, l.login_type, l.created_at,
            u.avatar_url, u.is_banned
     FROM login_logs l
     LEFT JOIN users u ON l.user_id = u.id
     ORDER BY l.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows;
}

// Helper to create slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Sync new/edited game to parsed_games_57.json and public/parsed_games_57.json
function syncCatalogFile(gameData, action = 'upsert') {
  const filePaths = [
    path.join(__dirname, '..', 'parsed_games_57.json'),
    path.join(__dirname, '..', 'public', 'parsed_games_57.json')
  ];

  for (const fp of filePaths) {
    try {
      if (fs.existsSync(fp)) {
        let catalog = JSON.parse(fs.readFileSync(fp, 'utf8'));
        if (Array.isArray(catalog)) {
          const idx = catalog.findIndex(g => g.slug === gameData.slug || (gameData.id && g.id === gameData.id));
          if (action === 'delete') {
            if (idx !== -1) catalog.splice(idx, 1);
          } else {
            if (idx !== -1) {
              catalog[idx] = { ...catalog[idx], ...gameData };
            } else {
              catalog.unshift(gameData);
            }
          }
          fs.writeFileSync(fp, JSON.stringify(catalog, null, 2), 'utf8');
        }
      }
    } catch (e) {
      console.warn(`Failed to sync catalog file ${fp}:`, e.message);
    }
  }
}

// Add New Game
async function addGame(data) {
  const title = (data.title || '').trim();
  if (!title) throw new Error('Game title is required');

  let slug = (data.slug || '').trim() || generateSlug(title);
  slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!slug) slug = `game-${Date.now()}`;

  // Check unique slug
  const existing = await db.query('SELECT id FROM games WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) {
    slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
  }

  const category = (data.category || 'arcade').toLowerCase();
  let thumbnail = (data.thumbnail || '').trim() || '/assets/posters/default-game.svg';
  let gameUrl = (data.game_url || '').trim() || `/play/${slug}`;
  const isMultiplayer = !!data.is_multiplayer;
  const minPlayers = Number(data.min_players || 1);
  const maxPlayers = Number(data.max_players || 1);
  const entryFeeCoins = Number(data.entry_fee_coins || 0);
  const orientation = (data.orientation || 'portrait').toLowerCase() === 'landscape' ? 'landscape' : 'portrait';
  const rating = Number(data.rating || 4.9);
  const playsCount = Number(data.plays_count || 1200);
  const isFeatured = !!data.is_featured;
  const isPremium = !!data.is_premium;

  const insertRes = await db.query(`
    INSERT INTO games (
      slug, title, category, thumbnail, game_url, 
      is_multiplayer, min_players, max_players, entry_fee_coins, 
      orientation, rating, plays_count, is_featured, is_premium
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `, [
    slug, title, category, thumbnail, gameUrl,
    isMultiplayer, minPlayers, maxPlayers, entryFeeCoins,
    orientation, rating, playsCount, isFeatured, isPremium
  ]);

  const newGame = insertRes.rows[0];
  syncCatalogFile(newGame, 'upsert');
  return newGame;
}

// Update Existing Game
async function updateGame(id, data) {
  const currentRes = await db.query('SELECT * FROM games WHERE id = $1', [id]);
  if (currentRes.rows.length === 0) throw new Error('Game not found');
  const current = currentRes.rows[0];

  const title = data.title !== undefined ? String(data.title).trim() : current.title;
  const category = data.category !== undefined ? String(data.category).toLowerCase() : current.category;
  const thumbnail = data.thumbnail !== undefined ? String(data.thumbnail).trim() : current.thumbnail;
  const gameUrl = data.game_url !== undefined ? String(data.game_url).trim() : current.game_url;
  const isMultiplayer = data.is_multiplayer !== undefined ? !!data.is_multiplayer : current.is_multiplayer;
  const minPlayers = data.min_players !== undefined ? Number(data.min_players) : current.min_players;
  const maxPlayers = data.max_players !== undefined ? Number(data.max_players) : current.max_players;
  const entryFeeCoins = data.entry_fee_coins !== undefined ? Number(data.entry_fee_coins) : current.entry_fee_coins;
  const orientation = data.orientation !== undefined ? (String(data.orientation).toLowerCase() === 'landscape' ? 'landscape' : 'portrait') : current.orientation;
  const rating = data.rating !== undefined ? Number(data.rating) : current.rating;
  const playsCount = data.plays_count !== undefined ? Number(data.plays_count) : current.plays_count;
  const isFeatured = data.is_featured !== undefined ? !!data.is_featured : current.is_featured;
  const isPremium = data.is_premium !== undefined ? !!data.is_premium : current.is_premium;

  const updateRes = await db.query(`
    UPDATE games SET
      title = $1,
      category = $2,
      thumbnail = $3,
      game_url = $4,
      is_multiplayer = $5,
      min_players = $6,
      max_players = $7,
      entry_fee_coins = $8,
      orientation = $9,
      rating = $10,
      plays_count = $11,
      is_featured = $12,
      is_premium = $13
    WHERE id = $14
    RETURNING *
  `, [
    title, category, thumbnail, gameUrl,
    isMultiplayer, minPlayers, maxPlayers, entryFeeCoins,
    orientation, rating, playsCount, isFeatured, isPremium,
    id
  ]);

  const updatedGame = updateRes.rows[0];
  syncCatalogFile(updatedGame, 'upsert');
  return updatedGame;
}

// Delete Game
async function deleteGame(id) {
  const currentRes = await db.query('SELECT * FROM games WHERE id = $1', [id]);
  if (currentRes.rows.length === 0) throw new Error('Game not found');
  const game = currentRes.rows[0];

  await db.query('DELETE FROM games WHERE id = $1', [id]);
  syncCatalogFile(game, 'delete');
  return { id, slug: game.slug, title: game.title, deleted: true };
}

// Get All Games with filtering for admin
async function getAdminGamesList({ search = '', category = '', sort = 'plays' } = {}) {
  let query = 'SELECT * FROM games WHERE 1=1';
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (title ILIKE $${params.length} OR slug ILIKE $${params.length})`;
  }

  if (category && category !== 'all') {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }

  if (sort === 'title') {
    query += ' ORDER BY title ASC';
  } else if (sort === 'id') {
    query += ' ORDER BY id DESC';
  } else if (sort === 'rating') {
    query += ' ORDER BY rating DESC';
  } else {
    query += ' ORDER BY is_featured DESC, plays_count DESC, id DESC';
  }

  const res = await db.query(query, params);
  return res.rows;
}

module.exports = {
  getClientIp,
  trackActiveUser,
  recordLogin,
  getActiveSessionsList,
  getDashboardStats,
  getUsersList,
  toggleUserBan,
  getLoginLogs,
  addGame,
  updateGame,
  deleteGame,
  getAdminGamesList
};
