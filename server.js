const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const bcrypt = require('bcryptjs');

let cachedPatchedPong = '';
let cachedPatchedTrex = '';
let cachedPatchedBubble = '';
try {
  cachedPatchedPong = fs.readFileSync(path.join(__dirname, 'public', 'games', 'patches', 'pong_game.js'), 'utf8');
  cachedPatchedTrex = fs.readFileSync(path.join(__dirname, 'public', 'games', 'patches', 'trex_game.js'), 'utf8');
  cachedPatchedBubble = fs.readFileSync(path.join(__dirname, 'public', 'games', 'patches', 'bubble_shooter_game.js'), 'utf8');
} catch (e) {
  console.error('Error preloading game patches:', e);
}

const db = require('./db');
const { generateToken, authMiddleware, verifyToken } = require('./middleware/auth');
const { setupMultiplayer } = require('./services/multiplayer');

function getUserFromReq(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.query.token;
  if (!token) return null;
  return verifyToken(token);
}

function isGuestUser(user) {
  if (!user) return true;
  if (user.is_guest) return true;
  if (user.phone_or_email && user.phone_or_email.startsWith('+9199999')) return true;
  if (user.username && user.username.startsWith('Gamer_')) return true;
  return false;
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

process.on('uncaughtException', (err) => {
  console.error('Server Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Server Unhandled Rejection:', reason);
});

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// 1. AUTHENTICATION API ROUTES (JWT BASED)
// -------------------------------------------------------------

// Guest Login (Instant 1-Click for effortless onboarding & testing)
app.post('/api/auth/guest', async (req, res) => {
  try {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const username = `Gamer_${randomSuffix}`;
    const dummyPhone = `+9199999${randomSuffix}`;
    const dummyPass = await bcrypt.hash('guest123', 10);
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

    const userRes = await db.query(
      `INSERT INTO users (username, phone_or_email, password_hash, avatar_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, phone_or_email, avatar_url, country_code, win_count, win_streak`,
      [username, dummyPhone, dummyPass, avatar]
    );
    const user = { ...userRes.rows[0], is_guest: true };

    // Initialize Wallet with 0 Coins for Guests (Guests get NO coins)
    await db.query(
      `INSERT INTO wallets (user_id, coin_balance, bonus_coins)
       VALUES ($1, 0, 0)
       ON CONFLICT (user_id) DO UPDATE SET coin_balance = 0, bonus_coins = 0`,
      [user.id]
    );

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        ...user,
        coin_balance: 0,
        bonus_coins: 0,
        is_guest: true
      }
    });
  } catch (err) {
    console.error('Guest login error:', err);
    res.status(500).json({ success: false, message: 'Failed to create guest session' });
  }
});

// Standard Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, phone_or_email, password } = req.body;
    if (!username || !phone_or_email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const check = await db.query(
      `SELECT id FROM users WHERE username = $1 OR phone_or_email = $2`,
      [username, phone_or_email]
    );
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username or Phone/Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

    const userRes = await db.query(
      `INSERT INTO users (username, phone_or_email, password_hash, avatar_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, phone_or_email, avatar_url, country_code, win_count, win_streak`,
      [username, phone_or_email, password_hash, avatar]
    );
    const user = userRes.rows[0];

    // Starter Wallet
    await db.query(
      `INSERT INTO wallets (user_id, coin_balance, bonus_coins) VALUES ($1, 100, 50)`,
      [user.id]
    );
    await db.query(
      `INSERT INTO transactions (user_id, amount, type, description)
       VALUES ($1, 150, 'SIGNUP_BONUS', 'Starter pack gift')`,
      [user.id]
    );

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: { ...user, coin_balance: 100, bonus_coins: 50 }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Standard Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // username or phone/email
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Credentials missing' });
    }

    const userRes = await db.query(
      `SELECT u.*, w.coin_balance, w.bonus_coins 
       FROM users u 
       LEFT JOIN wallets w ON u.id = w.user_id 
       WHERE u.username = $1 OR u.phone_or_email = $1`,
      [identifier]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Account not found' });
    }

    const user = userRes.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    delete user.password_hash;
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Current User Profile (with JWT)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const userRes = await db.query(
      `SELECT u.id, u.username, u.phone_or_email, u.avatar_url, u.country_code, 
              u.win_count, u.loss_count, u.win_streak, u.is_subscribed, u.subscription_expires_at,
              w.coin_balance, w.bonus_coins, w.last_daily_claim
       FROM users u 
       JOIN wallets w ON u.id = w.user_id 
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: userRes.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// -------------------------------------------------------------
// 2. WALLET, REWARDS & PROMO COUPONS API ROUTES
// -------------------------------------------------------------

const PROMO_COUPONS = {
  'WELCOME100': { type: 'COINS', amount: 100, label: 'Welcome Starter Bonus' },
  'BONUS500': { type: 'COINS', amount: 500, label: 'Mega 500 Coin Booster' },
  'MEGA2026': { type: 'COINS', amount: 1000, label: '2026 Grand Jackpot (1,000 Coins)' },
  'PROGAMER': { type: 'COINS', amount: 250, label: 'Pro Gamer Pack (250 Coins)' },
  'OTTVIP': { type: 'VIP', days: 30, label: '30-Day VIP Pass All-Access' },
  'VOLTIXVIP': { type: 'VIP', days: 30, label: '30-Day VIP Pass All-Access' }
};

// Current Wallet Info & Balance
app.get('/api/wallet/info', async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || isGuestUser(user)) {
      return res.json({
        success: true,
        authenticated: !!user && !isGuestUser(user),
        isGuest: !!user && isGuestUser(user),
        coin_balance: 0,
        bonus_coins: 0,
        canClaimDaily: false,
        nextClaimHours: 0,
        canSpinWheel: false,
        nextSpinHours: 0,
        transactions: []
      });
    }

    const walletRes = await db.query(
      `SELECT w.coin_balance, w.bonus_coins, w.last_daily_claim, u.is_subscribed, u.subscription_expires_at
       FROM wallets w
       JOIN users u ON u.id = w.user_id
       WHERE w.user_id = $1`,
      [user.id]
    );

    if (walletRes.rows.length === 0) {
      // Auto-create wallet if missing
      await db.query(`INSERT INTO wallets (user_id, coin_balance, bonus_coins) VALUES ($1, 0, 0) ON CONFLICT DO NOTHING`, [user.id]);
      return res.json({
        success: true,
        authenticated: true,
        coin_balance: 0,
        bonus_coins: 0,
        canClaimDaily: true,
        nextClaimHours: 0,
        canSpinWheel: true,
        nextSpinHours: 0,
        transactions: []
      });
    }

    const row = walletRes.rows[0];
    const now = new Date();
    let canClaimDaily = true;
    let nextClaimHours = 0;

    if (row.last_daily_claim) {
      const diffHours = (now - new Date(row.last_daily_claim)) / (1000 * 60 * 60);
      if (diffHours < 24) {
        canClaimDaily = false;
        nextClaimHours = Math.ceil(24 - diffHours);
      }
    }

    const txRes = await db.query(
      `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 15`,
      [user.id]
    );

    // Check if user already spun in the last 24 hours
    const lastSpinTx = await db.query(
      `SELECT created_at FROM transactions 
       WHERE user_id = $1 AND type LIKE 'SPIN_WHEEL%' 
       ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    );
    let canSpinWheel = true;
    let nextSpinHours = 0;
    if (lastSpinTx.rows.length > 0) {
      const diffHours = (now - new Date(lastSpinTx.rows[0].created_at)) / (1000 * 60 * 60);
      if (diffHours < 24) {
        canSpinWheel = false;
        nextSpinHours = Math.ceil(24 - diffHours);
      }
    }

    res.json({
      success: true,
      authenticated: true,
      coin_balance: Number(row.coin_balance),
      bonus_coins: Number(row.bonus_coins),
      is_subscribed: !!(row.is_subscribed && (!row.subscription_expires_at || new Date(row.subscription_expires_at) > now)),
      canClaimDaily,
      nextClaimHours,
      canSpinWheel,
      nextSpinHours,
      transactions: txRes.rows
    });
  } catch (err) {
    console.error('Wallet info error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch wallet info' });
  }
});

// Daily Bonus Claim
app.post('/api/wallet/claim-daily', async (req, res) => {
  try {
    const user = getUserFromReq(req);
    const DAILY_BONUS = 50;

    if (!user || isGuestUser(user)) {
      return res.status(401).json({
        success: false,
        requireLogin: true,
        message: '🔒 Guests cannot claim daily coins. Please sign in or create an account!'
      });
    }

    const walletRes = await db.query(
      `SELECT w.last_daily_claim, w.coin_balance, u.is_subscribed, u.subscription_expires_at 
       FROM wallets w
       JOIN users u ON u.id = w.user_id 
       WHERE w.user_id = $1`,
      [user.id]
    );
    const wallet = walletRes.rows[0];

    const now = new Date();
    if (wallet && wallet.last_daily_claim) {
      const diffHours = (now - new Date(wallet.last_daily_claim)) / (1000 * 60 * 60);
      if (diffHours < 24) {
        const remaining = Math.ceil(24 - diffHours);
        return res.status(400).json({ success: false, message: `Already claimed! Next lucky reward in ${remaining} hours.` });
      }
    }

    const isVip = wallet && wallet.is_subscribed && (!wallet.subscription_expires_at || new Date(wallet.subscription_expires_at) > now);
    const claimAmount = isVip ? 100 : DAILY_BONUS; // 2x coins for VIP pass holders!

    await db.query(
      `UPDATE wallets 
       SET coin_balance = coin_balance + $1, last_daily_claim = NOW(), updated_at = NOW() 
       WHERE user_id = $2`,
      [claimAmount, user.id]
    );

    await db.query(
      `INSERT INTO transactions (user_id, amount, type, description)
       VALUES ($1, $2, 'DAILY_CLAIM', $3)`,
      [user.id, claimAmount, isVip ? '👑 VIP 2X Daily Bonus (+100 Coins)' : '🎁 Daily Login Bonus (+50 Coins)']
    );

    const newBalance = Number(wallet.coin_balance) + claimAmount;
    res.json({
      success: true,
      reward: claimAmount,
      message: isVip ? `👑 2X VIP Daily Bonus! Won ${claimAmount} Coins!` : `🎉 Won ${claimAmount} Free Daily Coins!`,
      newBalance
    });
  } catch (err) {
    console.error('Claim error:', err);
    res.status(500).json({ success: false, message: 'Claim failed' });
  }
});

// Reward coins for playing games or winning against AI
app.post('/api/wallet/reward', async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user || isGuestUser(user)) {
      return res.status(401).json({
        success: false,
        requireLogin: true,
        error_code: 'AUTH_REQUIRED',
        reward: 0,
        message: 'Guest profile cannot earn coins. Please sign up or log in to earn coins!',
        isGuest: true
      });
    }

    const { reason, isPremium, gameSlug = '', gameTitle = '' } = req.body;

    // Game play reward rule: ONLY 1 coin, and strictly for PREMIUM games only
    if (reason === 'GAME_PLAY') {
      let isGamePremium = Boolean(isPremium);
      if (!isGamePremium && gameSlug) {
        const gameRes = await db.query(
          `SELECT is_premium FROM games WHERE slug = $1`,
          [gameSlug]
        );
        if (gameRes.rows.length > 0) {
          isGamePremium = Boolean(gameRes.rows[0].is_premium);
        }
      }
      if (!isGamePremium) {
        return res.json({
          success: false,
          reward: 0,
          message: 'Free games do not award coins. Play premium games to earn coins!'
        });
      }
    }

    // Strictly 1 coin for game play, 2 coins for AI win
    const safeAmount = (reason === 'AI_WIN') ? 2 : 1;

    const desc = reason === 'AI_WIN' 
      ? `🏆 Victory against AI in ${gameTitle || gameSlug || 'Game'} (+${safeAmount} Coins)`
      : `🎮 Played Premium Game ${gameTitle || gameSlug || 'Game'} (+${safeAmount} Coin)`;

    const updated = await db.query(
      `UPDATE wallets 
       SET coin_balance = coin_balance + $1, updated_at = NOW() 
       WHERE user_id = $2 
       RETURNING coin_balance`,
      [safeAmount, user.id]
    );

    await db.query(
      `INSERT INTO transactions (user_id, amount, type, description)
       VALUES ($1, $2, $3, $4)`,
      [user.id, safeAmount, reason === 'AI_WIN' ? 'AI_VICTORY_REWARD' : 'GAME_PLAY_REWARD', desc]
    );

    res.json({
      success: true,
      reward: safeAmount,
      message: `+${safeAmount} Coin earned!`,
      newBalance: Number(updated.rows[0].coin_balance)
    });
  } catch (err) {
    console.error('Reward error:', err);
    res.status(500).json({ success: false, message: 'Reward failed' });
  }
});

// Coupon & Voucher Code Redemption
app.post('/api/wallet/redeem-coupon', async (req, res) => {
  try {
    const user = getUserFromReq(req);
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = PROMO_COUPONS[normalizedCode];

    if (!coupon) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired coupon! Try WELCOME100, BONUS500, or VOLTIXVIP' 
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        requireLogin: true,
        message: '🔒 Please sign in or create an account to redeem promo coupons!'
      });
    }

    // Prevent duplicate coupon redemption per user
    const existingTx = await db.query(
      `SELECT id FROM transactions 
       WHERE user_id = $1 AND (reference_id = $2 OR description ILIKE $3)`,
      [user.id, normalizedCode, `%${normalizedCode}%`]
    );
    if (existingTx.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `⚠️ Coupon "${normalizedCode}" has already been redeemed on this account!`
      });
    }

    if (coupon.type === 'VIP') {
      if (user) {
        await db.query(
          `UPDATE users 
           SET is_subscribed = true, subscription_expires_at = NOW() + INTERVAL '30 days' 
           WHERE id = $1`,
          [user.id]
        );
        await db.query(
          `INSERT INTO transactions (user_id, amount, type, reference_id, description)
           VALUES ($1, 0, 'COUPON_VIP', $2, 'Redeemed ' || $2 || ' for 30-Day Free VIP Pass')`,
          [user.id, normalizedCode]
        );
      }
      return res.json({
        success: true,
        type: 'VIP',
        message: '👑 VIP Pass Activated! All 15 Exclusive Games unlocked for 30 days!'
      });
    }

    // Coin coupon
    if (user) {
      const updated = await db.query(
        `UPDATE wallets 
         SET coin_balance = coin_balance + $1, updated_at = NOW() 
         WHERE user_id = $2 
         RETURNING coin_balance`,
        [coupon.amount, user.id]
      );
      await db.query(
        `INSERT INTO transactions (user_id, amount, type, reference_id, description)
         VALUES ($1, $2, 'COUPON_REDEEM', $3, $4)`,
        [user.id, coupon.amount, normalizedCode, `Coupon Redeemed: ${normalizedCode} (+${coupon.amount} Coins)`]
      );
      return res.json({
        success: true,
        type: 'COINS',
        reward: coupon.amount,
        message: `🎉 Success! +${coupon.amount} Coins credited to your wallet!`,
        newBalance: Number(updated.rows[0].coin_balance)
      });
    }

    // Guest response
    return res.json({
      success: true,
      type: 'COINS',
      reward: coupon.amount,
      message: `🎉 Success! +${coupon.amount} Coins credited!`,
      isGuest: true
    });
  } catch (err) {
    console.error('Coupon redemption error:', err);
    res.status(500).json({ success: false, message: 'Server error during redemption' });
  }
});

// Redeem Coin Store Item (VIP pass or demo gift vouchers)
app.post('/api/wallet/redeem-store-item', async (req, res) => {
  try {
    const user = getUserFromReq(req);
    const { itemId, itemTitle, cost } = req.body;
    const itemCost = Number(cost) || 0;

    if (!itemId || itemCost <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid reward item.' });
    }

    const randomVoucherCode = `${itemId.toUpperCase().slice(0, 4)}-VLTX-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!user) {
      return res.status(401).json({
        success: false,
        requireLogin: true,
        message: '🔒 Please sign in or create an account to redeem coin store items!'
      });
    }

    // Verify balance
    const walletRes = await db.query(`SELECT coin_balance FROM wallets WHERE user_id = $1`, [user.id]);
    if (walletRes.rows.length === 0 || Number(walletRes.rows[0].coin_balance) < itemCost) {
      return res.status(400).json({ success: false, message: 'Insufficient coins in wallet! Play more games to earn coins.' });
    }

    // Deduct coins
    const updated = await db.query(
      `UPDATE wallets SET coin_balance = coin_balance - $1, updated_at = NOW() WHERE user_id = $2 RETURNING coin_balance`,
      [itemCost, user.id]
    );

    // Apply VIP Pass if applicable
    if (itemId === 'vip_7_days') {
      await db.query(`UPDATE users SET is_subscribed = true, subscription_expires_at = NOW() + INTERVAL '7 days' WHERE id = $1`, [user.id]);
    } else if (itemId === 'vip_30_days') {
      await db.query(`UPDATE users SET is_subscribed = true, subscription_expires_at = NOW() + INTERVAL '30 days' WHERE id = $1`, [user.id]);
    }

    await db.query(
      `INSERT INTO transactions (user_id, amount, type, reference_id, description)
       VALUES ($1, $2, 'STORE_REDEEM', $3, $4)`,
      [user.id, -itemCost, itemId, `Redeemed ${itemTitle} (${randomVoucherCode})`]
    );

    res.json({
      success: true,
      message: `🎉 Successfully redeemed ${itemTitle}!`,
      voucherCode: randomVoucherCode,
      newBalance: Number(updated.rows[0].coin_balance)
    });
  } catch (err) {
    console.error('Store redemption error:', err);
    res.status(500).json({ success: false, message: 'Redemption failed' });
  }
});

// Spin Wheel Reward Claim
app.post('/api/wallet/spin-wheel', async (req, res) => {
  try {
    const user = getUserFromReq(req);
    const { prizeType, prizeAmount, prizeLabel } = req.body;
    // Cap spin wheel coins at maximum 8 coins: 2, 3, 4, 5, 6, 8 (or 0)
    const amount = Math.min(Math.max(Number(prizeAmount) || 0, 0), 8);

    if (!user || isGuestUser(user)) {
      return res.status(401).json({
        success: false,
        requireLogin: true,
        message: '🔒 Guests cannot spin the wheel. Please sign in or create an account to spin the Lucky Wheel!'
      });
    }

    // Verify 24-hour cooldown for authenticated users
    const lastSpinTx = await db.query(
      `SELECT created_at FROM transactions 
       WHERE user_id = $1 AND type LIKE 'SPIN_WHEEL%' AND created_at > NOW() - INTERVAL '24 hours' 
       ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    );
    if (lastSpinTx.rows.length > 0) {
      const diffHours = (new Date() - new Date(lastSpinTx.rows[0].created_at)) / (1000 * 60 * 60);
      const remaining = Math.max(1, Math.ceil(24 - diffHours));
      return res.status(400).json({
        success: false,
        message: `⏳ You have already used your Daily Spin! Next spin available in ${remaining} hours.`
      });
    }

    let newBalance = 0;
    if (prizeType === 'COINS' && amount > 0) {
      const updated = await db.query(
        `UPDATE wallets SET coin_balance = coin_balance + $1, updated_at = NOW() WHERE user_id = $2 RETURNING coin_balance`,
        [amount, user.id]
      );
      newBalance = Number(updated.rows[0].coin_balance);

      await db.query(
        `INSERT INTO transactions (user_id, amount, type, description)
         VALUES ($1, $2, 'SPIN_WHEEL_WIN', $3)`,
        [user.id, amount, `🎡 Spin Wheel Win: +${amount} Coins`]
      );
    } else if (prizeType === 'VIP') {
      await db.query(`UPDATE users SET is_subscribed = true, subscription_expires_at = NOW() + INTERVAL '1 day' WHERE id = $1`, [user.id]);
      await db.query(
        `INSERT INTO transactions (user_id, amount, type, description)
         VALUES ($1, 0, 'SPIN_WHEEL_VIP', '🎡 Spin Wheel Win: 1-Day VIP Pass')`,
        [user.id]
      );
    }

    res.json({
      success: true,
      message: `🎉 You won ${prizeLabel || amount + ' Coins'}!`,
      newBalance
    });
  } catch (err) {
    console.error('Spin wheel error:', err);
    res.status(500).json({ success: false, message: 'Failed to record spin' });
  }
});

// Transaction History
app.get('/api/wallet/transactions', async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user) {
      return res.json({ success: true, transactions: [] });
    }
    const txRes = await db.query(
      `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25`,
      [user.id]
    );
    res.json({ success: true, transactions: txRes.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

// Global Leaderboard (Top 15 Players by Coins & Wins)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const user = getUserFromReq(req);
    const dbRes = await db.query(`
      SELECT u.id, u.username, u.avatar_url, u.country_code, u.win_count, u.win_streak, u.is_subscribed,
             COALESCE(w.coin_balance, 100) AS coin_balance
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      ORDER BY w.coin_balance DESC NULLS LAST, u.win_count DESC
      LIMIT 15
    `);

    let leaders = dbRes.rows;
    const defaultLegends = [
      { id: 901, username: 'Aarav_Pro', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aarav', country_code: 'IN', win_count: 87, win_streak: 14, is_subscribed: true, coin_balance: 4850 },
      { id: 902, username: 'CyberQueen', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberQueen', country_code: 'IN', win_count: 72, win_streak: 9, is_subscribed: true, coin_balance: 3920 },
      { id: 903, username: 'ShadowStriker', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Shadow', country_code: 'US', win_count: 65, win_streak: 8, is_subscribed: false, coin_balance: 2840 },
      { id: 904, username: 'Rohit_Gamer', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rohit', country_code: 'IN', win_count: 53, win_streak: 6, is_subscribed: true, coin_balance: 2410 },
      { id: 905, username: 'NeonMaster', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonMaster', country_code: 'UK', win_count: 48, win_streak: 5, is_subscribed: false, coin_balance: 1980 },
      { id: 906, username: 'PixelKnight', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=PixelKnight', country_code: 'IN', win_count: 41, win_streak: 4, is_subscribed: true, coin_balance: 1650 },
      { id: 907, username: 'SpeedyViper', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SpeedyViper', country_code: 'CA', win_count: 36, win_streak: 3, is_subscribed: false, coin_balance: 1420 }
    ];

    if (leaders.length < 5) {
      leaders = [...leaders, ...defaultLegends.slice(leaders.length)];
    }

    let myRank = null;
    if (user) {
      const idx = leaders.findIndex(l => l.id === user.id);
      if (idx !== -1) myRank = idx + 1;
    }

    res.json({ success: true, leaders, myRank });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
});

// Dynamic Game Configurations Engine (2-Player, 4-Player configurations)
app.get('/api/game-configs', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM game_configs WHERE is_active = TRUE ORDER BY min_players, title');
    res.json({ success: true, configs: result.rows });
  } catch (err) {
    console.error('Game configs error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch game configs' });
  }
});

// Claim Daily Quest Reward
app.post('/api/wallet/claim-quest', async (req, res) => {
  try {
    const user = getUserFromReq(req);
    const { questId, questTitle, rewardAmount } = req.body;
    const amount = Number(rewardAmount) || 0;

    if (!questId || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid quest claim' });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        requireLogin: true,
        message: '🔒 Please sign in or create an account to claim quest rewards!'
      });
    }

    // Check if quest was already claimed today
    const existingTx = await db.query(
      `SELECT id FROM transactions 
       WHERE user_id = $1 AND type = 'QUEST_REWARD' AND reference_id = $2 AND created_at > NOW() - INTERVAL '24 hours'`,
      [user.id, questId]
    );

    if (existingTx.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Quest reward already claimed today!' });
    }

    const updated = await db.query(
      `UPDATE wallets SET coin_balance = coin_balance + $1, updated_at = NOW() WHERE user_id = $2 RETURNING coin_balance`,
      [amount, user.id]
    );

    await db.query(
      `INSERT INTO transactions (user_id, amount, type, reference_id, description)
       VALUES ($1, $2, 'QUEST_REWARD', $3, $4)`,
      [user.id, amount, questId, `🎯 Quest Completed: ${questTitle} (+${amount} Coins)`]
    );

    res.json({
      success: true,
      message: `🎉 Quest Completed: "${questTitle}" (+${amount} Coins)!`,
      newBalance: Number(updated.rows[0].coin_balance)
    });
  } catch (err) {
    console.error('Quest claim error:', err);
    res.status(500).json({ success: false, message: 'Failed to claim quest' });
  }
});

// -------------------------------------------------------------
// 3. SUBSCRIPTION & VIP ACCESS ROUTES
// -------------------------------------------------------------
app.post('/api/subscription/subscribe', async (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        requireLogin: true,
        message: '🔒 Please sign in or create an account to activate VIP Pass!'
      });
    }

    await db.query(
      `UPDATE users 
       SET is_subscribed = true, subscription_expires_at = NOW() + INTERVAL '30 days' 
       WHERE id = $1`,
      [user.id]
    );

    res.json({
      success: true,
      message: 'VIP Subscription Activated! Enjoy unlimited access to all 15 exclusive Voltixz games.',
      is_subscribed: true,
      expires_in_days: 30
    });
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ success: false, message: 'Subscription activation failed' });
  }
});

app.get('/api/subscription/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ success: true, is_subscribed: false });
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const userRes = await db.query(
      `SELECT is_subscribed, subscription_expires_at FROM users WHERE id = $1`,
      [decoded.id]
    );
    if (userRes.rows.length === 0) return res.json({ success: true, is_subscribed: false });
    const user = userRes.rows[0];
    const isSubscribed = user.is_subscribed && (!user.subscription_expires_at || new Date(user.subscription_expires_at) > new Date());
    res.json({ success: true, is_subscribed: isSubscribed, expires_at: user.subscription_expires_at });
  } catch (err) {
    res.json({ success: true, is_subscribed: false });
  }
});

// -------------------------------------------------------------
// 4. GAMES CATALOG & LEADERBOARD
// -------------------------------------------------------------

app.get('/api/games', async (req, res) => {
  try {
    const { category, filter } = req.query;
    let query = `SELECT * FROM games ORDER BY is_featured DESC, plays_count DESC`;
    let params = [];

    if (category === 'premium' || filter === 'premium') {
      query = `SELECT * FROM games WHERE is_premium = true ORDER BY is_featured DESC, plays_count DESC`;
    } else if (category && category !== 'all') {
      query = `SELECT * FROM games WHERE category = $1 ORDER BY is_featured DESC, plays_count DESC`;
      params = [category];
    }

    const gamesRes = await db.query(query, params);
    res.json({ success: true, games: gamesRes.rows });
  } catch (err) {
    console.error('Failed to load games from DB, falling back to local catalog:', err.message);
    try {
      const localGames = require('./parsed_games_57.json');
      const { category, filter } = req.query;
      let filtered = localGames;
      if (category === 'premium' || filter === 'premium') {
        filtered = localGames.filter(g => g.is_premium === true);
      } else if (category && category !== 'all') {
        filtered = localGames.filter(g => g.category === category);
      }
      res.json({ success: true, games: filtered });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to load games', error: err.message });
    }
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const lbRes = await db.query(
      `SELECT u.username, u.avatar_url, u.win_count, u.win_streak, w.coin_balance 
       FROM users u 
       JOIN wallets w ON u.id = w.user_id 
       ORDER BY u.win_count DESC, w.coin_balance DESC 
       LIMIT 10`
    );
    res.json({ success: true, leaderboard: lbRes.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load leaderboard' });
  }
});

// Clean Game Embed Streamer (Eliminates blur, ads, banners, redirects & UI overlapping)
app.get('/api/game-frame', async (req, res) => {
  let targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing url');

  // If games.ottsol.cloud, redirect directly (it is 100% ad-free and needs native same-origin assets)
  if (targetUrl.includes('games.ottsol.cloud')) {
    return res.redirect(targetUrl);
  }

  // Fast redirect alias for color-sort to magic-sort
  if (targetUrl.includes('color-sort')) {
    targetUrl = targetUrl.replace('color-sort', 'magic-sort');
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow'
    });

    let html = await response.text();
    let finalUrl = response.url || targetUrl;

    // Automatically follow client-side redirect stubs on the server
    if (html.length < 3000 && (html.includes('location.replace') || html.includes('http-equiv="refresh"') || html.includes('is now'))) {
      const match = html.match(/https:\/\/gamezipper\.com\/([a-z0-9-]+)\/?/i);
      if (match && match[1]) {
        const realTargetUrl = `https://gamezipper.com/${match[1]}/?utm_source=embed`;
        try {
          const secondResponse = await fetch(realTargetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            redirect: 'follow'
          });
          html = await secondResponse.text();
          finalUrl = secondResponse.url || realTargetUrl;
        } catch(e) {}
      }
    }

    // Automatically follow Famobi portal redirect stubs on the server to direct CDN game engines
    if (html.includes('games.cdn.famobi.com/html5games/') || finalUrl.includes('play.famobi.com') || targetUrl.includes('play.famobi.com')) {
      const matchCdn = html.match(/https:\/\/games\.cdn\.famobi\.com\/html5games\/[^"'\s<>]+/i);
      if (matchCdn) {
        const cdnUrl = matchCdn[0].replace(/&amp;/g, '&');
        try {
          const secondResponse = await fetch(cdnUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          html = await secondResponse.text();
          finalUrl = secondResponse.url || cdnUrl;
        } catch(e) {}
      }
    }

    const baseUrl = new URL(finalUrl).href;

    const cleanInjection = `
      <base href="${baseUrl}">
      <script>
        (function() {
          // Block external popup/tab hijacking
          window.open = function() { 
            return { closed: true, focus: function(){}, close: function(){} }; 
          };

          // Universal Ad Network URL Filter
          const AD_FILTER = /(googleads|doubleclick|googlesyndication|adservice|monetag|adsterra|imasdk|ima3|gamedistribution|gamemonetize|cpmstar|adnxs|adnuntius|popads|propeller|applovin|unityads|crazygames|poki.*sdk|play\\.famobi\\.com.*(ad|banner|v1\\.js)|gameapi\\/v1|patch\\/js\\/g[dm]-sdk|ad-delivery|outbrain|taboola|analytics|gtag)/i;
          function isAdUrl(u) {
            if (!u || typeof u !== 'string') return false;
            return AD_FILTER.test(u);
          }

          // Dynamic Script & Iframe Interception (prevents games from injecting ad tags)
          const _origCreateElement = document.createElement.bind(document);
          document.createElement = function(tag, options) {
            const el = _origCreateElement(tag, options);
            const lowerTag = (tag || '').toLowerCase();
            if (lowerTag === 'script' || lowerTag === 'iframe') {
              const _origSetAttr = el.setAttribute.bind(el);
              el.setAttribute = function(name, val) {
                if ((name || '').toLowerCase() === 'src' && isAdUrl(val)) {
                  setTimeout(function() {
                    try { if (typeof el.onload === 'function') el.onload(); } catch(e) {}
                  }, 10);
                  return;
                }
                return _origSetAttr(name, val);
              };
              let _src = '';
              Object.defineProperty(el, 'src', {
                get: function() { return _src; },
                set: function(val) {
                  if (isAdUrl(val)) {
                    _src = 'about:blank';
                    setTimeout(function() {
                      try { if (typeof el.onload === 'function') el.onload(); } catch(e) {}
                    }, 10);
                    return;
                  }
                  _src = val;
                  el.setAttribute('src', val);
                },
                configurable: true
              });
            }
            return el;
          };

          // Network-level Ad Blocker (blocks fetch & XHR to ad networks)
          const _origFetch = window.fetch;
          if (typeof _origFetch === 'function') {
            window.fetch = function(input, init) {
              const u = typeof input === 'string' ? input : (input && input.url ? input.url : '');
              if (isAdUrl(u)) {
                return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
              }
              return _origFetch.apply(this, arguments);
            };
          }
          const _origXhrOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url) {
            if (isAdUrl(url)) {
              arguments[1] = 'data:application/json,{}';
            }
            return _origXhrOpen.apply(this, arguments);
          };

          // Stub Google AdSense & Ad Networks
          const _adsArray = [];
          _adsArray.push = function() { return 1; };
          _adsArray.loaded = true;
          window.adsbygoogle = _adsArray;
          window.monetag = { push: function() {} };
          window.adsterra = { push: function() {} };

          // Stub Google IMA Video Ads SDK (neutralizes video prerolls in Moto X3M and WebGL games)
          window.google = window.google || {};
          window.google.ima = {
            AdsLoader: function() {
              return {
                addEventListener: function(event, cb) {
                  if (event === 'adsManagerLoaded') {
                    setTimeout(function() {
                      try {
                        cb({
                          getAdsManager: function() {
                            return {
                              init: function() {},
                              start: function() {},
                              stop: function() {},
                              destroy: function() {},
                              addEventListener: function(e, c) {
                                if (e === 'allAdsCompleted' || e === 'complete' || e === 'loaded' || e === 'contentResume') {
                                  setTimeout(c, 5);
                                }
                              }
                            };
                          }
                        });
                      } catch(e) {}
                    }, 5);
                  }
                },
                requestAds: function() {},
                contentComplete: function() {}
              };
            },
            AdsManagerLoadedEvent: { Type: { ADS_MANAGER_LOADED: 'adsManagerLoaded' } },
            AdErrorEvent: { Type: { AD_ERROR: 'adError' } },
            AdEvent: { Type: { ALL_ADS_COMPLETED: 'allAdsCompleted', COMPLETE: 'complete', CONTENT_PAUSE_REQUESTED: 'contentPause', CONTENT_RESUME_REQUESTED: 'contentResume' } },
            AdsRequest: function() {},
            ViewMode: { NORMAL: 'NORMAL', FULLSCREEN: 'FULLSCREEN' }
          };

          // Stub GameDistribution & GameMonetize SDK
          const mockGdSdk = {
            showAd: function() { return Promise.resolve(); },
            preloadAd: function() { return Promise.resolve(); },
            play: function() { return Promise.resolve(); },
            init: function() { return Promise.resolve(); }
          };
          window.gdsdk = mockGdSdk;
          window.sdk = mockGdSdk;
          window.gamedistribution = mockGdSdk;
          window.gamemonetize = {
            showAd: function() { return Promise.resolve(); },
            init: function() { return Promise.resolve(); }
          };

          // Auto-trigger GD_OPTIONS onEvent so games waiting for ad finish start immediately
          let _gdOptions = { onEvent: function() {} };
          Object.defineProperty(window, 'GD_OPTIONS', {
            get: function() { return _gdOptions; },
            set: function(val) {
              _gdOptions = val;
              if (val && typeof val.onEvent === 'function') {
                setTimeout(function() {
                  try { val.onEvent({ name: 'SDK_GAME_START' }); } catch(e) {}
                }, 20);
              }
            },
            configurable: true
          });

          // Stub Poki & CrazyGames SDK
          window.PokiSDK = {
            init: function() { return Promise.resolve(); },
            gameLoadingFinished: function() {},
            gameLoadingProgress: function() {},
            gameplayStart: function() {},
            gameplayStop: function() {},
            commercialBreak: function() { return Promise.resolve(); },
            rewardedBreak: function() { return Promise.resolve(true); },
            displayAd: function(container) { if (container) container.style.display = 'none'; },
            destroyAd: function() {}
          };
          window.CrazyGames = {
            SDK: {
              init: function() { return Promise.resolve(); },
              ad: {
                requestAd: function() { return Promise.resolve(); },
                hasAdblock: function() { return Promise.resolve(false); }
              },
              game: {
                gameplayStart: function() {},
                gameplayStop: function() {},
                loadingStart: function() {},
                loadingStop: function() {}
              }
            }
          };

          // Real-time MutationObserver to eradicate ad banners from DOM
          try {
            const adObserver = new MutationObserver(function(mutations) {
              for (let i = 0; i < mutations.length; i++) {
                const added = mutations[i].addedNodes;
                for (let j = 0; j < added.length; j++) {
                  const node = added[j];
                  if (node.nodeType === 1) {
                    const id = (node.id || '').toLowerCase();
                    const cls = (node.className || '').toString().toLowerCase();
                    const aria = (node.getAttribute('aria-label') || '').toLowerCase();
                    const src = (node.getAttribute('src') || '').toLowerCase();
                    if (
                      id.includes('gz-ad-') || id.includes('google_ads') || id.includes('aswift') ||
                      cls.includes('gz-injected') || cls.includes('ad-container') || cls.includes('advertisement') ||
                      aria.includes('advertisement') || aria.includes('sponsored') ||
                      isAdUrl(src)
                    ) {
                      node.remove();
                    }
                  }
                }
              }
            });
            if (document.documentElement) {
              adObserver.observe(document.documentElement, { childList: true, subtree: true });
            } else {
              document.addEventListener('DOMContentLoaded', function() {
                adObserver.observe(document.documentElement, { childList: true, subtree: true });
              });
            }
          } catch(e) {}

          // Safe onbeforeunload clear
          try {
            if (window.top && window.top !== window.self) {
              window.top.onbeforeunload = null;
            }
          } catch(e) {}

          // Intercept ALL <a> link clicks so games cannot navigate away to third-party portals or related games
          document.addEventListener('click', function(e) {
            const a = e.target.closest('a');
            if (a) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }, true);

          // Pre-set howto flag so overlay tutorials don't block start screens
          try {
            localStorage.setItem('wm_howto', '1');
          } catch(e) {}

          // Continuously scrub injected toolbars, fixed banners, and footer elements so canvas receives all clicks
          const scrubInterval = setInterval(function() {
            var el = document.getElementById('game-footer');
            if (el) el.remove();
            var tap = document.getElementById('gz-tap-start');
            if (tap) tap.remove();
            var rel = document.querySelector('.gz-related-games');
            if (rel) rel.remove();
            var spl = document.getElementById('splash-screen');
            if (spl) spl.remove();
            var fixtop = document.querySelector('.fix-top') || document.querySelector('a[href*="gamezipper.com"]');
            if (fixtop) fixtop.remove();
            var nav = document.querySelector('.nav') || document.querySelector('#gz-topnav');
            if (nav) nav.remove();
            var faqs = document.querySelectorAll('.faq-section, section.faq-section, .gz-seo-section, section.gz-seo-section, section, [class*="faq"], #share-btn-overlay, [id*="share-btn"], [itemtype*="FAQPage"]');
            faqs.forEach(function(f) {
              try { f.remove(); } catch(e) {}
            });
          }, 100);
          setTimeout(function() { clearInterval(scrubInterval); }, 15000);

          // Keep window focused for keyboard controls
          window.focus();
          document.addEventListener('pointerdown', function() { window.focus(); }, true);
          document.addEventListener('mousedown', function() { window.focus(); }, true);
          document.addEventListener('touchstart', function() { window.focus(); }, true);
          window.addEventListener('click', function() { window.focus(); });

          // Universal Keyboard Event Bridge (forwards arrow keys and spacebar directly to game window)
          window.addEventListener('message', function(ev) {
            if (ev.data && ev.data.type === 'KEY_EVENT') {
              try {
                const kEvent = new KeyboardEvent(ev.data.action, {
                  key: ev.data.key,
                  code: ev.data.code,
                  bubbles: true,
                  cancelable: true
                });
                Object.defineProperty(kEvent, 'keyCode', { get: function() { return ev.data.keyCode; } });
                Object.defineProperty(kEvent, 'which', { get: function() { return ev.data.which || ev.data.keyCode; } });
                window.dispatchEvent(kEvent);
                document.dispatchEvent(kEvent);
                const canvases = document.querySelectorAll('canvas');
                canvases.forEach(function(c) { c.dispatchEvent(kEvent); });
              } catch(err) {}
            }
          });

          // Construct 2 data.json 404 fix for Windows (resolves black screen in Penalty Shooters 2)
          try {
            const origXhrOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url) {
              if (typeof url === 'string' && url.includes('data.json')) {
                arguments[1] = url.replace('data.json', 'data.js');
              }
              return origXhrOpen.apply(this, arguments);
            };
          } catch(e) {}

          // Suppress disruptive alert popups from WebGL/WASM engines
          window.LocalizationData = window.LocalizationData || "{}";
          window.alert = function(msg) {
            console.warn('Game alert intercepted:', msg);
          };

          // Defensive getElementById so missing UI buttons never crash game engines
          const origGetElementById = document.getElementById.bind(document);
          document.getElementById = function(id) {
            const el = origGetElementById(id);
            if (el) return el;
            if (id === 'sound-toggle' || id === 'soundToggle' || id === 'start-btn' || id === 'mute-btn') {
              const dummy = document.createElement('div');
              dummy.id = id;
              dummy.style.display = 'none';
              document.body.appendChild(dummy);
              return dummy;
            }
            return null;
          };

          // Famobi Autonomous Emulator (bypasses anti-embed redirects and loads game assets directly)
          const _famobiStore = {};
          const mockStorage = {
            getItem: function(k) {
              try {
                const v = window.localStorage.getItem(k);
                if (v !== null && v !== undefined) return v;
              } catch(e) {}
              return _famobiStore[k] !== undefined ? _famobiStore[k] : null;
            },
            setItem: function(k, v) {
              try { window.localStorage.setItem(k, String(v)); } catch(e) {}
              _famobiStore[k] = String(v);
            },
            removeItem: function(k) {
              try { window.localStorage.removeItem(k); } catch(e) {}
              delete _famobiStore[k];
            },
            clear: function() {
              try { window.localStorage.clear(); } catch(e) {}
              Object.keys(_famobiStore).forEach(k => delete _famobiStore[k]);
            },
            key: function(i) {
              try { return window.localStorage.key(i); } catch(e) {}
              return Object.keys(_famobiStore)[i] || null;
            },
            hasItem: function(k) {
              return this.getItem(k) !== null;
            },
            get length() {
              try { return window.localStorage.length; } catch(e) {}
              return Object.keys(_famobiStore).length;
            }
          };

          const famobiBase = {
            storage: mockStorage,
            localStorage: mockStorage,
            sessionStorage: mockStorage,
            getStorage: function() { return mockStorage; },
            config: {
              aid: "A1000-1",
              features: {
                lockPointer: false,
                highscores: 0,
                ads: false
              },
              gameParams: {}
            },
            hasFeature: function(f) { 
              if (f === 'external_start' || f === 'external_pause' || f === 'external_mute') return false;
              if (f === 'ads' || f === 'rewarded_ads' || f === 'highscores' || f === 'leaderboard' || f === 'branding') return false;
              return true;
            },
            getOffsets: function() { return { top: 0, bottom: 0, left: 0, right: 0 }; },
            onOffsetChange: function(cb) {},
            onRequest: function(type, cb) { 
              if (!window._famobiRequests) window._famobiRequests = {};
              window._famobiRequests[type] = cb;
              if (type === 'startGame' || type === 'start') {
                setTimeout(function() {
                  try { cb(); } catch(e) {}
                }, 50);
              }
            },
            showInterstitialAd: function(cb) { if(typeof cb === 'function') setTimeout(cb, 10); },
            showInterstitial: function(cb) { if(typeof cb === 'function') setTimeout(cb, 10); },
            hasRewardedAd: function() { return false; },
            rewardedAd: function(cb) { if(typeof cb === 'function') setTimeout(cb, 10); },
            forceAd: function(cb) { if(typeof cb === 'function') setTimeout(cb, 10); },
            showAd: function(cb) { if(typeof cb === 'function') setTimeout(cb, 10); },
            getVolume: function() { return 1; },
            setVolume: function() {},
            onVolumeChange: function() {},
            playerReady: function() {},
            setPreloadProgress: function() {},
            gameReady: function() {
              if (window._famobiRequests && window._famobiRequests['startGame']) {
                try { window._famobiRequests['startGame'](); } catch(e) {}
              }
              if (typeof window.visibleResume === 'function') {
                try { window.visibleResume(); } catch(e) {}
              }
            },
            moreGamesLink: function() { return 'javascript:void(0)'; },
            getMoreGamesURL: function() { return 'javascript:void(0)'; },
            getMoreGamesButtonImage: function() {
              return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            },
            getBrandingButtonImage: function() {
              return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            },
            getBrandingButtonTarget: function() { return ''; },
            getBrandingImage: function() {
              return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            },
            submitHighscore: function() {},
            log: function() {},
            getFeatureProperties: function() { return {}; },
            _: function(k) { return k || ''; },
            __: function(k) {
              const dict = {
                'TEXT_PLAY': 'PLAY',
                'TEXT_LOSE': 'YOU LOSE',
                'TEXT_WIN': 'YOU WIN',
                'TEXT_SCORE': 'SCORE',
                'TEXT_RESTART': 'RESTART',
                'TEXT_EXIT': 'EXIT',
                'TEXT_GAMEOVER': 'GAME OVER',
                'TEXT_COMBO': 'COMBO',
                'TEXT_HELP': 'SLICE THE FRUIT! AVOID BOMBS!',
                'TEXT_HELP_MOBILE': 'SWIPE TO SLICE FRUITS! AVOID BOMBS!'
              };
              return dict[k] || (typeof k === 'string' ? k.replace(/^TEXT_/i, '') : '') || '';
            },
            __t: function(k) { return k || ''; },
            getCurrentLanguage: function() { return 'en'; },
            getLanguage: function() { return 'en'; },
            getOrientation: function() {
              return (window.innerWidth < window.innerHeight) ? 'portrait' : 'landscape';
            },
            adapters: {
              run: function() {},
              add: function() {}
            }
          };

          window.externalResumeGameplay = function() {};
          window.externalPauseGameplay = function() {};
          window.faZepto = {
            getScript: function(url, cb, errCb) {
              if (typeof cb === 'function') setTimeout(cb, 10);
            }
          };
          window.fenster = {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            subscribeToOffsetUpdates: function() {},
            init: function() {},
            update: function() {}
          };

          window.famobi = new Proxy(famobiBase, {
            get: function(target, prop) {
              if (prop in target) return target[prop];
              if (prop === 'storage' || prop === 'localStorage' || prop === 'sessionStorage') return mockStorage;
              if (prop === 'config') return target.config;
              if (prop === 'then') return undefined;
              if (typeof prop === 'string' && prop.startsWith('get') && prop.includes('Image')) {
                return function() { return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; };
              }
              if (typeof prop === 'string' && prop.startsWith('get') && (prop.includes('URL') || prop.includes('Url') || prop.includes('Target'))) {
                return function() { return ''; };
              }
              return function() { return Promise.resolve(true); };
            }
          });
          window.fg_api = function() {};
          const mockAnalytics = {
            trackScreen: function() { return Promise.resolve(true); },
            trackEvent: function() { return Promise.resolve(true); },
            EVENT_LEVELSTART: "EVENT_LEVELSTART",
            EVENT_LEVELFAIL: "EVENT_LEVELFAIL",
            EVENT_LEVELSUCCESS: "EVENT_LEVELSUCCESS"
          };
          window.famobi_analytics = new Proxy(mockAnalytics, {
            get: function(t, p) {
              if (p in t) return t[p];
              return function() { return Promise.resolve(true); };
            }
          });
          
          const mockGameInterfaceBase = {
            init: function(files) {
              if (Array.isArray(files)) {
                files.forEach(function(f) {
                  const src = typeof f === 'string' ? f : (f && (f.file || f.src));
                  if (src) {
                    const s = document.createElement('script');
                    s.src = src;
                    s.async = false;
                    document.head.appendChild(s);
                  } else if (typeof f === 'function') {
                    try { f(); } catch(e) {}
                  }
                });
              }
              return Promise.resolve(true);
            },
            storage: mockStorage,
            localStorage: mockStorage,
            sessionStorage: mockStorage,
            getStorage: function() { return mockStorage; },
            hasFeature: function(f) { 
              if (f === 'external_start' || f === 'external_pause' || f === 'external_mute') return false;
              if (f === 'ads' || f === 'rewarded_ads' || f === 'highscores' || f === 'leaderboard' || f === 'branding') return false;
              return true;
            },
            getFeatureProperties: function() { return {}; },
            sendPreloadProgress: function(p) {},
            gameReady: function() {},
            track: function() {},
            getOrientation: function() {
              return (window.innerWidth < window.innerHeight) ? 'portrait' : 'landscape';
            },
            onMuteStateChange: function() {},
            onPauseStateChange: function() {},
            onOffsetChange: function() {},
            hasRewardedAd: function() { return Promise.resolve(false); },
            hasInterstitialAd: function() { return Promise.resolve(false); },
            hasAd: function() { return Promise.resolve(false); },
            showInterstitialAd: function(cb) { if (typeof cb === 'function') cb(); return Promise.resolve(true); },
            showRewardedAd: function() { return Promise.resolve({ isRewardGranted: true }); }
          };
          const mockGameInterface = new Proxy(mockGameInterfaceBase, {
            get: function(target, prop) {
              if (prop in target) return target[prop];
              if (prop === 'storage' || prop === 'localStorage' || prop === 'sessionStorage') return mockStorage;
              if (prop === 'then') return undefined;
              if (typeof prop === 'string' && prop.startsWith('get') && prop.includes('Image')) {
                return function() { return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; };
              }
              return function() { return Promise.resolve(true); };
            }
          });
          window.GameInterface = mockGameInterface;
          window.gameInterface = mockGameInterface;

          let isFamobiScriptLoading = false;
          function runFamobiQueue() {
            if (isFamobiScriptLoading) return;
            if (!window.famobi_gameJS || !Array.isArray(window.famobi_gameJS) || window.famobi_gameJS.length === 0) return;
            const item = window.famobi_gameJS[0];
            if (typeof item === 'string' || (item && typeof item === 'object' && (item.file || item.src))) {
              const scriptSrc = typeof item === 'string' ? item : (item.file || item.src);
              isFamobiScriptLoading = true;
              window.famobi_gameJS.shift();
              const s = document.createElement('script');
              s.src = scriptSrc;
              s.async = false;
              s.onload = function() {
                isFamobiScriptLoading = false;
                runFamobiQueue();
              };
              s.onerror = function(err) {
                console.warn('Script failed to load: ' + scriptSrc, err);
                isFamobiScriptLoading = false;
                runFamobiQueue();
              };
              (document.head || document.documentElement).appendChild(s);
            } else if (typeof item === 'function') {
              window.famobi_gameJS.shift();
              try {
                item();
              } catch(e) {
                console.warn('Famobi starter callback caught:', e);
                setTimeout(function() {
                  try { item(); } catch(e2) {
                    if (typeof window.extGameLoad === 'function') window.extGameLoad();
                  }
                }, 200);
              }
              runFamobiQueue();
            } else {
              window.famobi_gameJS.shift();
              runFamobiQueue();
            }
          }
          const famobiPoll = setInterval(runFamobiQueue, 100);
          setTimeout(function() { clearInterval(famobiPoll); }, 25000);
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runFamobiQueue);
          } else {
            setTimeout(runFamobiQueue, 10);
          }

          // Safe startup event dispatch specifically for Unity / Construct2 canvas engines
          setTimeout(function() {
            try {
              const c2 = document.getElementById('c2canvas') || document.getElementById('unity-canvas');
              if (c2) {
                c2.dispatchEvent(new Event('start_game'));
                window.dispatchEvent(new Event('start_game'));
              }
            } catch(e) {}
          }, 1500);

          // Auto-clear white cover overlay (#x_ovl) for WebGL games
          setTimeout(function() {
            try {
              if (typeof window.onGameStarted === 'function') window.onGameStarted();
            } catch(e) {}
            var ovl = document.getElementById('x_ovl');
            if (ovl) {
              ovl.style.opacity = '0';
              ovl.style.pointerEvents = 'none';
              setTimeout(function() { if (ovl) ovl.style.display = 'none'; }, 400);
            }
          }, 3500);

          // Monitor Unity finish state to ensure loading containers disappear smoothly
          const unityWatcher = setInterval(function() {
            const lc = document.getElementById('unity-loading-container');
            if (lc && lc.classList.contains('finished')) {
              lc.style.opacity = '0';
              lc.style.pointerEvents = 'none';
              setTimeout(function() { if (lc) lc.style.display = 'none'; }, 600);
              clearInterval(unityWatcher);
            }
          }, 300);
          setTimeout(function() {
            const lc = document.getElementById('unity-loading-container');
            if (lc) {
              lc.classList.add('finished');
              lc.style.opacity = '0';
              lc.style.pointerEvents = 'none';
              setTimeout(function() { if (lc) lc.style.display = 'none'; }, 600);
            }
            clearInterval(unityWatcher);
          }, 25000);
        })();
      </script>
      <style>
        #gz-tap-start,
        div#gz-tap-start,
        [id*="gz-tap-start"],
        #splash-screen,
        .splash-screen,
        [id*="splash-screen"],
        #game-footer,
        div#game-footer,
        .game-footer,
        [id*="game-footer"],
        .gz-toolbar,
        #gz-toolbar,
        .gz-toolbar,
        #gz-toolbar,
        .gz-related-bar,
        [class*="gz-related"],
        #gz-r703-playbtn-css,
        #gz-topnav,
        nav#gz-topnav,
        .gz-topnav,
        .nav,
        div.nav,
        #soundToggle,
        .fix-top,
        a.fix-top,
        [id*="gz-ad"], 
        [class*="gz-injected"], 
        [id*="banner"], 
        [class*="banner"], 
        [id*="ad-"], 
        .gz-banner, 
        .gz-overlay,
        .gz-seo-section,
        .gz-seo-content,
        article,
        footer,
        .gz-footer,
        .gz-related-games,
        section.gz-related-games,
        section[aria-label="Related games"],
        .gz-related-grid,
        .gz-blog-links,
        a[href*="/blog"],
        a[href*="blog.html"],
        p:has(> a[href*="blog"]),
        div:has(> a[href*="blog"]),
        #game-info,
        section#game-info,
        [id*="game-info"],
        a[href*="gamezipper.com"],
        a[href*="/blog/"],
        a[title="Home"],
        .gz-home-btn,
        .nav a,
        div.nav a,
        #gz-ad-above-game,
        #gz-ad-below-canvas,
        #gz-ad-below-game,
        .faq-section,
        section.faq-section,
        [class*="faq"],
        .gz-seo-section,
        section.gz-seo-section,
        section,
        #share-btn-overlay,
        [id*="share-btn"],
        .gz-sr-only,
        h1.gz-sr-only,
        h3,
        div[style*="max-width:800px"],
        div[style*="max-width: 800px"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          height: 0 !important;
          max-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          position: absolute !important;
          top: -99999px !important;
          left: -99999px !important;
          z-index: -9999 !important;
        }
        * {
          filter: none !important;
          backdrop-filter: none !important;
        }
        /* Natural responsive centering with pure seamless dark canvas */
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          background: #000000 !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
        }
        /* Compact game headers so board gets maximum screen height */
        .ms-header {
          margin: 0 !important;
          padding: 6px 12px 2px !important;
        }
        .ms-title {
          font-size: 18px !important;
          margin-bottom: 0 !important;
        }
        .ms-subtitle {
          display: none !important;
        }
        /* Keep game canvas prominent, centered, and never squeezed */
        #content,
        .ms-canvas-wrap,
        .canvas-wrap,
        #game-container,
        #game {
          width: 100% !important;
          height: 100% !important;
          flex-shrink: 0 !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          margin: 0 auto !important;
          padding: 0 !important;
          background: #000000 !important;
        }
        /* Responsive arcade and puzzle wrap centering */
        #wrap {
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          margin: auto !important;
          width: 100% !important;
          max-width: min(500px, calc(100vh - 120px)) !important;
          height: 100% !important;
          max-height: 100vh !important;
          padding: 4px 6px !important;
          box-sizing: border-box !important;
          background: transparent !important;
        }
        /* Landscape 3:2 games like Pong get wider horizontal bounds */
        #wrap:has(#hud) {
          max-width: min(680px, calc((100vh - 110px) * 1.5)) !important;
        }
        #wrap #header {
          width: 100% !important;
          max-width: 480px !important;
          margin: 0 auto 6px auto !important;
          flex-shrink: 0 !important;
        }
        #wrap #hud,
        #hud {
          width: 100% !important;
          max-width: 600px !important;
          margin: 0 auto 6px auto !important;
          flex-shrink: 0 !important;
        }
        #canvas-wrap {
          position: relative !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 auto !important;
          background: transparent !important;
        }
        #wrap:has(#hud) #canvas-wrap {
          max-width: min(680px, calc((100vh - 120px) * 1.5)) !important;
        }
        #controls {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 12px !important;
          margin-top: 8px !important;
          flex-shrink: 0 !important;
        }
        #controls a,
        a[href*="gamezipper.com"] {
          display: none !important;
        }
        #ms-canvas {
          height: auto !important;
          max-height: calc(100vh - 140px) !important;
          width: auto !important;
          max-width: calc(100vw - 16px) !important;
          aspect-ratio: 1 / 1 !important;
          margin: 0 auto !important;
        }
        /* Clean modern slim scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        canvas {
          display: block !important;
          margin: auto !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          object-fit: contain !important;
        }
        #wrap canvas,
        #canvas-wrap canvas,
        canvas#c {
          display: block !important;
          margin: auto !important;
          max-width: 100% !important;
          max-height: calc(100vh - 110px) !important;
          object-fit: contain !important;
        }
        #unity-container {
          width: 100% !important;
          height: 100% !important;
          background: #000000 !important;
        }
        #unity-canvas {
          background-color: #000000 !important;
        }
        #orientation {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          opacity: 0 !important;
        }
        /* Bubble Shooter overlay click-through fix */
        #gameScreen.screen.active {
          pointer-events: none !important;
        }
        #gameScreen #gameUI, #gameScreen button, #gameScreen .btn {
          pointer-events: auto !important;
        }
        #hintBox {
          pointer-events: none !important;
        }
        #gameCanvas {
          pointer-events: auto !important;
          cursor: crosshair;
        }
        /* Universal Responsive Overlay & Glass Cards (Slice Master / Fruit Slash & Arcade Overlays) */
        .glass {
          max-width: min(94vw, 440px) !important;
          padding: clamp(0.8rem, 3vw, 1.5rem) clamp(0.6rem, 2.5vw, 1.2rem) !important;
          width: 94% !important;
          box-sizing: border-box !important;
        }
        .lv-grid {
          display: grid !important;
          grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          gap: clamp(4px, 1.5vw, 8px) !important;
          max-width: 100% !important;
          width: 100% !important;
          box-sizing: border-box !important;
          margin: 0.8rem auto !important;
        }
        .lv-btn {
          width: 100% !important;
          max-width: 50px !important;
          height: auto !important;
          aspect-ratio: 1 / 1 !important;
          min-width: 0 !important;
          min-height: 0 !important;
          font-size: clamp(0.75rem, 2.5vw, 1.05rem) !important;
          padding: 2px !important;
          box-sizing: border-box !important;
          margin: 0 auto !important;
        }
        .lv-btn .st {
          font-size: clamp(0.45rem, 1.5vw, 0.6rem) !important;
        }
        .ch-grid {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 8px !important;
          justify-content: center !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .ch-card {
          width: calc(50% - 8px) !important;
          max-width: 130px !important;
          padding: 0.8rem 0.5rem !important;
          box-sizing: border-box !important;
        }
        .btn {
          min-width: unset !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
      </style>
    `;

    // Strip external ad script tags safely
    html = html.replace(/<script[^>]*src=["'][^"']*(game-footer|gz-ux|gz-analytics|adsterra|monetag|ima3|imasdk|gamemonetize|gamedistribution|gd-sdk|gm-sdk|adsbygoogle|googlesyndication|gtag|google-analytics)[^"']*["'][^>]*>\s*<\/script>/gi, '');

    // Strip inline scripts that contain ad trackers without crossing script boundaries (preserves game engines)
    html = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match, body) => {
      if (body.length > 2500) return match; // Never delete game code!
      if (/(monetag|adsterra|adsbygoogle|googlesyndication|gz-analytics|gz-ux|ima3|imasdk|gamemonetize-preload|gamedistribution-jssdk|google-analytics|googletagmanager)/i.test(body)) {
        return '';
      }
      return match;
    });

    // Strip ad comments safely (single comment only)
    html = html.replace(/<!--([\s\S]*?)-->/gi, (match, commentBody) => {
      if (/(monetag|adsterra|banner|advertisement|QA Round 1|Extra SEO|More Games)/i.test(commentBody)) {
        return '';
      }
      return match;
    });

    // Strip ad placeholders and markup
    html = html.replace(/<ins[^>]*class=["'][^"']*adsbygoogle[^"']*["'][\s\S]*?<\/ins>/gi, '');
    html = html.replace(/<ins[\s\S]*?<\/ins>/gi, '');
    html = html.replace(/<link[^>]*(pagead2|googlesyndication|doubleclick|monetag|adsterra)[^>]*>/gi, '');
    html = html.replace(/<meta[^>]*http-equiv=["']?refresh["']?[^>]*>/gi, '');
    html = html.replace(/<div[^>]*id=["']gz-ad-[^"']*["'][^>]*><\/div>/gi, '');
    html = html.replace(/<div[^>]*class=["']gz-injected-banner[^"']*["'][^>]*><\/div>/gi, '');

    // Strip Famobi official anti-embed API caller & tracker so autonomous emulator runs
    html = html.replace(/<script[^>]*src=["'][^"']*gameapi\/v1\.js[^"']*["'][^>]*><\/script>/gi, '');
    html = html.replace(/<script[^>]*src=["'][^"']*famobi-game-interface\.js[^"']*["'][^>]*><\/script>/gi, '');

    // Completely remove GameZipper topnav, SEO sections, related games sections and toolbars from DOM safely
    html = html.replace(/#gz-tap-start[^{]*\{[^}]*\}/gi, '');
    html = html.replace(/<nav[^>]*id=["']gz-topnav["'][\s\S]*?<\/nav>/gi, '');
    html = html.replace(/<div[^>]*id=["']game-footer["'][\s\S]*?<\/div>/gi, '');
    html = html.replace(/<section[^>]*id=["']game-info["'][\s\S]*?<\/section>/gi, '');
    html = html.replace(/<div[^>]*class=["']gz-blog-links["'][\s\S]*?<\/div>/gi, '');
    html = html.replace(/<section[^>]*class=["'][^"']*gz-related-games[^"']*["'][\s\S]*?<\/section>/gi, '');
    html = html.replace(/<div[^>]*class=["']gz-related-games["'][\s\S]*?<\/div>/gi, '');
    html = html.replace(/<div[^>]*class=["']gz-seo-section["'][\s\S]*?<\/div>/gi, '');
    html = html.replace(/<section\b[\s\S]*?<\/section>/gi, '');
    html = html.replace(/<div[^>]*id=["']share-btn-overlay["'][\s\S]*?<\/div>/gi, '');
    html = html.replace(/<a[^>]*class=["']fix-top["'][\s\S]*?<\/a>/gi, '');
    html = html.replace(/<p[^>]*>\s*<a[^>]*href=["'][^"']*blog[^"']*["'][\s\S]*?<\/a>\s*<\/p>/gi, '');
    html = html.replace(/<a[^>]*href=["'][^"']*\/blog\.html["'][\s\S]*?<\/a>/gi, '');

    // Fix Magic Sort / Color Sort win modal overlapping bug (card too narrow & button positions displaced)
    html = html.replace(/const cardW = Math\.min\(300, W \* 0\.85\);/g, 'const cardW = Math.min(420, W * 0.95);');
    html = html.replace(/const cardH = 320;/g, 'const cardH = 360;');
    html = html.replace(
      /const btnW = 90, btnH = 40, btnGap = 8;/g,
      'const btnGap = 6; const btnW = Math.min(84, Math.floor((cardW - 32 - (totalBtns - 1) * btnGap) / totalBtns)); const btnH = 38;'
    );
    html = html.replace(/const by = cardY \+ \(streakCount >= 2 \|\| milestone \? 223 : 206\);/g, 'const by = cardY + cardH - 54;');
    html = html.replace(
      /const wBtnW = 90, wBtnH = 40, wBtnGap = 8;/g,
      'const wBtnGap = 6; const wBtnW = Math.min(84, Math.floor((cardW - 32 - (totalBtns - 1) * wBtnGap) / totalBtns)); const wBtnH = 38;'
    );
    html = html.replace(/const wBy = cardY \+ \(streakCount >= 2 \|\| milestone \? 210 : 193\);/g, 'const wBy = cardY + cardH - 54;');

    // Fix Neon Dash / Neon Run impossible obstacle spacing (obstacles crammed 100px apart)
    if (html.includes('First Steps')) {
      html = html.replace(
        /name:\s*["']First Steps["'][\s\S]*?obstacles:\s*\[[\s\S]*?\]\s*\},/i,
        `name: "First Steps",
    color: '#00ffff',
    speed: 3.5,
    obstacles: [
      {type:'block', x:480, y:340, w:30, h:30},
      {type:'spike', x:820, y:345, w:25, h:25},
      {type:'block', x:1160, y:340, w:30, h:30},
      {type:'spike', x:1500, y:345, w:25, h:25},
      {type:'block', x:1840, y:340, w:50, h:30},
      {type:'spike', x:2180, y:345, w:25, h:25},
      {type:'block', x:2520, y:340, w:30, h:30},
      {type:'spike', x:2860, y:345, w:25, h:25}
    ]
  },`
      );
    }
    if (html.includes('Neon Streets')) {
      html = html.replace(
        /name:\s*["']Neon Streets["'][\s\S]*?obstacles:\s*\[[\s\S]*?\]\s*\},/i,
        `name: "Neon Streets",
    color: '#ff00ff',
    speed: 3.6,
    obstacles: [
      {type:'spike', x:460, y:345, w:25, h:25},
      {type:'block', x:800, y:340, w:30, h:30},
      {type:'spike', x:1140, y:345, w:25, h:25},
      {type:'block', x:1480, y:340, w:40, h:40},
      {type:'spike', x:1820, y:345, w:25, h:25},
      {type:'block', x:2160, y:340, w:30, h:30},
      {type:'spike', x:2500, y:345, w:25, h:25}
    ]
  },`
      );
    }

    // Fix Drive Fury sluggish acceleration and add hydraulic jump mechanic
    if (html.includes('DRIVE FURY') || finalUrl.includes('drive-fury') || targetUrl.includes('drive-fury')) {
      // 1. Boost vehicle speeds and engine power
      html = html.replace(
        "{ id:'dusty_truck', name:'Dusty Truck', mass:1.0, power:1.0, grip:1.0, stability:0.8,\n    color:'#ff8800', accent:'#cc6600', w:70, h:34, wheelR:10, wheelBase:54,\n    cogH:20, maxSpeed:420,",
        "{ id:'dusty_truck', name:'Dusty Truck', mass:1.0, power:1.4, grip:1.2, stability:0.9,\n    color:'#ff8800', accent:'#cc6600', w:70, h:34, wheelR:10, wheelBase:54,\n    cogH:20, maxSpeed:650,"
      );
      html = html.replace(
        "{ id:'sand_buggy', name:'Sand Buggy', mass:0.7, power:1.3, grip:0.7, stability:0.5,\n    color:'#ffcc00', accent:'#aa8800', w:62, h:28, wheelR:9, wheelBase:46,\n    cogH:17, maxSpeed:520,",
        "{ id:'sand_buggy', name:'Sand Buggy', mass:0.7, power:1.7, grip:0.9, stability:0.6,\n    color:'#ffcc00', accent:'#aa8800', w:62, h:28, wheelR:9, wheelBase:46,\n    cogH:17, maxSpeed:780,"
      );
      html = html.replace(
        "{ id:'monster_truck', name:'Monster Truck', mass:1.8, power:0.8, grip:1.2, stability:1.2,\n    color:'#ee2222', accent:'#aa0000', w:80, h:42, wheelR:14, wheelBase:60,\n    cogH:24, maxSpeed:340,",
        "{ id:'monster_truck', name:'Monster Truck', mass:1.8, power:1.3, grip:1.4, stability:1.3,\n    color:'#ee2222', accent:'#aa0000', w:80, h:42, wheelR:14, wheelBase:60,\n    cogH:24, maxSpeed:550,"
      );

      // 2. Touch and keyboard jump input
      html = html.replace(
        'let touchAccel = false, touchBrake = false;',
        'let touchAccel = false, touchBrake = false, touchJump = false;'
      );

      html = html.replace(
        "function getInput() {\n  const accel = keys['ArrowRight'] || keys['KeyD'] || keys['ArrowUp'] || keys['KeyW'] || touchAccel;\n  const brake = keys['ArrowLeft'] || keys['KeyA'] || keys['ArrowDown'] || keys['KeyS'] || touchBrake;\n  return { accel, brake };\n}",
        `function getInput() {
  const accel = keys['ArrowRight'] || keys['KeyD'] || touchAccel;
  const brake = keys['ArrowLeft'] || keys['KeyA'] || touchBrake;
  const jump = keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || touchJump;
  return { accel, brake, jump };
}`
      );

      html = html.replace(
        "if (gameState === 'playing' || gameState === 'endless') {\n    if (isMobile) {\n      if (x < W * 0.5) touchBrake = true; else touchAccel = true;\n    }\n  }",
        `if (gameState === 'playing' || gameState === 'endless') {
    if (y < H * 0.45) {
      touchJump = true;
    } else if (x < W * 0.5) {
      touchBrake = true;
    } else {
      touchAccel = true;
    }
  }`
      );

      html = html.replace(
        "function handlePointerUp() { touchAccel = false; touchBrake = false; }",
        "function handlePointerUp() { touchAccel = false; touchBrake = false; touchJump = false; }"
      );

      // 3. Update updateGame signature and callers
      html = html.replace(
        "function updateGame(g, dt, accel, brake) {",
        "function updateGame(g, dt, accel, brake, jump) {"
      );

      html = html.replace(
        "const result = updatePhysics(g, dt, accel, brake);",
        "const result = updatePhysics(g, dt, accel, brake, jump);"
      );

      html = html.replace(
        "updateGame(game, dt, inp.accel, inp.brake);",
        "updateGame(game, dt, inp.accel, inp.brake, inp.jump);"
      );

      html = html.replace(
        "if (game.endless) updateGame(game, dt, inp.accel, inp.brake);",
        "// endless single update"
      );

      // 4. Boost acceleration power, add hydraulic jump and mid-air rotation
      html = html.replace(
        `    // Drive force
    if (contact) {
      const ta = getTerrainAngle(pts, v.x);
      const dir = accel ? 1 : (brake ? -0.6 : 0);
      if (dir !== 0) {
        const force = dir * def.power * 650 * def.grip;
        v.vx += (Math.cos(ta) * force * sdt) / def.mass;
        v.vy += (Math.sin(ta) * force * sdt) / def.mass;
      }
      // Ground friction
      v.vx *= (1 - GROUND_FRIC * sdt * 0.1);
      // Speed limit
      const spd = Math.abs(v.vx);
      if (spd > def.maxSpeed) v.vx *= def.maxSpeed / spd;
    }`,
        `    // Drive force & Jump
    if (contact) {
      const ta = getTerrainAngle(pts, v.x);
      const dir = accel ? 1 : (brake ? -0.6 : 0);
      if (dir !== 0) {
        const force = dir * def.power * 1350 * def.grip;
        v.vx += (Math.cos(ta) * force * sdt) / def.mass;
        v.vy += (Math.sin(ta) * force * sdt) / def.mass;
      }
      // Hydraulic Spring Jump
      if (jump && (!v.jumpCooldown || v.jumpCooldown <= 0)) {
        v.vy = -620;
        v.vx += 120;
        v.jumpCooldown = 0.35;
        try { playSound('checkpoint'); } catch(e) {}
      }
      // Ground friction
      v.vx *= (1 - GROUND_FRIC * sdt * 0.1);
      // Speed limit
      const spd = Math.abs(v.vx);
      if (spd > def.maxSpeed) v.vx *= def.maxSpeed / spd;
    } else {
      // In-air aerial tilt control
      if (accel) {
        v.av += 6.0 * sdt;
      } else if (brake) {
        v.av -= 6.0 * sdt;
      }
    }`
      );

      // 5. Jump cooldown countdown
      html = html.replace(
        "v.wheelAngle += v.speed * sdt * 0.1;",
        "v.wheelAngle += v.speed * sdt * 0.1;\n    if (v.jumpCooldown > 0) v.jumpCooldown -= sdt;"
      );

      // 6. UI controls hint
      html = html.replace(
        "ctx.fillText(isMobile ? 'Tap left/right to control' : 'Arrow keys or WASD to drive', cx, H - 30);",
        "ctx.fillText(isMobile ? 'Tap Bottom: Drive/Brake | Tap Top: JUMP' : '[→]/[D] Gas | [←]/[A] Brake | [SPACE]/[↑]/[W] JUMP!', cx, H - 30);"
      );

      html = html.replace(
        `  // Left zone (brake)`,
        `  // Top zone (jump)
  ctx.fillStyle = 'rgba(0,200,255,0.15)';
  ctx.fillRect(W * 0.2, 0, W * 0.6, H * 0.35);
  ctx.strokeStyle = 'rgba(0,200,255,0.4)'; ctx.lineWidth = 2;
  ctx.strokeRect(W * 0.2, 0, W * 0.6, H * 0.35);
  ctx.fillStyle = 'rgba(0,255,255,0.8)'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('⬆ TAP TO JUMP ⬆', W * 0.5, H * 0.2);

  // Left zone (brake)`
      );
    }

    // Fix Kitchen Rush / Burger Joint tutorial deadlock and missing initial customer
    if (html.includes('Burger Joint') || finalUrl.includes('kitchen-rush') || targetUrl.includes('kitchen-rush')) {
      // 1. Remove click-blocking tutorial deadlock so all taps register
      html = html.replace(
        /if\s*\(\s*tutActive\s*&&\s*tutStep\s*<\s*3\s*\)\s*\{[\s\S]*?return;\s*\}/g,
        'if(tutActive){ tutStep++; if(tutStep>=3){tutActive=false;save.tutorialDone=true;writeSave();} return; }'
      );
      // 2. Set tutorialDone to true by default to bypass deadlocks
      html = html.replace(/tutorialDone:\s*false/g, 'tutorialDone:true');
      html = html.replace(/tutActive\s*=\s*!save\.tutorialDone\s*&&\s*idx\s*===\s*0;/g, 'tutActive=false;save.tutorialDone=true;spawnCustomer();');
      // 3. Ensure customers start immediately at level launch
      html = html.replace(
        "customers=[];custIdx=0;custSpawnT=0;activeSlot=-1;",
        "customers=[];custIdx=0;custSpawnT=0;activeSlot=-1;setTimeout(function(){ if(customers.length===0) spawnCustomer(); }, 50);"
      );
    }

    // Inlined patched script for Pong (smoothens paddle speed and enables mouse tracking)
    if ((finalUrl.includes('/pong/') || targetUrl.includes('/pong')) && cachedPatchedPong) {
      html = html.replace(/<script[^>]*src=["'][^"']*game\.js[^"']*["'][^>]*><\/script>/i, `<script>${cachedPatchedPong}</script>`);
    }

    // Inlined patched script for T-Rex Dino Runner (fixes dino.y jump calculation and instant jump response)
    if ((finalUrl.includes('/t-rex/') || targetUrl.includes('/t-rex')) && cachedPatchedTrex) {
      html = html.replace(/<script[^>]*src=["'][^"']*game\.js[^"']*["'][^>]*><\/script>/i, `<script>${cachedPatchedTrex}</script>`);
    }

    // Inlined patched script for Bubble Shooter (fixes collision detection, grid snapping, and aim pointer)
    if ((finalUrl.includes('bubble-shooter') || targetUrl.includes('bubble-shooter')) && cachedPatchedBubble) {
      html = html.replace(/<script>[\s\S]*?const canvas\s*=\s*document\.getElementById\('gameCanvas'\);[\s\S]*?<\/script>/i, `<script>${cachedPatchedBubble}</script>`);
    }

    // Auto-start Brick Breaker level 1 and clean canvas loop
    if (finalUrl.includes('brick-breaker') || targetUrl.includes('brick-breaker')) {
      html = html.replace(
        "var score=0,lives=3,currentLevel=1,gameState='menu',paused=false;",
        "var score=0,lives=3,currentLevel=1,gameState='waiting',paused=false; setTimeout(function(){ if(typeof startGame==='function') startGame(1); }, 150);"
      );
    }

    html = html.replace(/<head[^>]*>/i, `$&${cleanInjection}`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Failed to proxy game:', err);
    res.redirect(targetUrl);
  }
});

// Fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -------------------------------------------------------------
// 4. ATTACH MULTIPLAYER WEBSOCKET ENGINE
// -------------------------------------------------------------
setupMultiplayer(wss);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🎮 VOLTIXZ GAMING ARENA IS LIVE`);
  console.log(`🚀 Server listening on: http://localhost:${PORT}`);
  console.log(`⚡ Neon PostgreSQL & Realtime WebSockets Connected`);
  console.log(`====================================================`);
});
