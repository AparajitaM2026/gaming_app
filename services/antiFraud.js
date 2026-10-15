const db = require('../db');

const MAX_CONSECUTIVE_WINS_BEFORE_AUDIT = 5;
const WIN_RATE_ANOMALY_THRESHOLD = 0.85; // 85% win rate over 10 games
const MATCH_COOLDOWN_SECONDS = 5;
const PLATFORM_RAKE_PERCENTAGE = 20; // 20% house rake

// In-memory cooldown tracker: userId -> timestamp
const lastMatchPlayed = new Map();

/**
 * Validates whether user is allowed to join a multiplayer match
 */
async function canUserJoinMatch(userId, entryFee = 0) {
  // 1. Check cooldown (5 seconds)
  const lastTime = lastMatchPlayed.get(userId);
  const now = Date.now();
  if (lastTime && (now - lastTime) < (MATCH_COOLDOWN_SECONDS * 1000)) {
    const waitSec = Math.ceil((MATCH_COOLDOWN_SECONDS * 1000 - (now - lastTime)) / 1000);
    return { allowed: false, reason: `Please wait ${waitSec}s cooldown before entering another match.` };
  }

  // Allow guest players seamlessly without DB lookup
  if (typeof userId === 'string' && (userId.startsWith('guest_') || userId.startsWith('bot_'))) {
    return { allowed: true, user: { id: userId, username: 'Guest Player', isGuest: true } };
  }

  // 2. Fetch User from Neon DB
  const userRes = await db.query(
    `SELECT id, is_banned, win_streak, win_count, loss_count 
     FROM users 
     WHERE id = $1`,
    [userId]
  );

  if (userRes.rows.length === 0) {
    return { allowed: true, user: { id: userId, username: 'Player', isGuest: true } };
  }

  const user = userRes.rows[0];

  if (user.is_banned) {
    return { allowed: false, reason: 'Account flagged. Contact support.' };
  }

  // 100% Free to play - No coin balance block!
  return { allowed: true, user };
}

/**
 * Calculates prize distribution with platform rake
 */
function calculatePrizePool(entryFee, playerCount = 2) {
  const totalPool = entryFee * playerCount;
  const platformRake = Math.round((totalPool * PLATFORM_RAKE_PERCENTAGE) / 100);
  const winnerPrize = totalPool - platformRake;

  return {
    totalPool,
    platformRake,
    winnerPrize
  };
}

/**
 * Records match outcome, updates wallet, checks win streak anti-fraud
 */
async function recordMatchOutcome(matchId, winnerId, loserId, entryFee, gameSlug) {
  const poolCalc = calculatePrizePool(entryFee, 2);
  const now = new Date();

  // Update cooldown tracker
  lastMatchPlayed.set(winnerId, Date.now());
  if (loserId) lastMatchPlayed.set(loserId, Date.now());

  const isNumWinner = Number.isInteger(winnerId) || (!isNaN(winnerId) && !String(winnerId).startsWith('guest_') && !String(winnerId).startsWith('bot_'));
  const isNumLoser = Number.isInteger(loserId) || (!isNaN(loserId) && !String(loserId).startsWith('guest_') && !String(loserId).startsWith('bot_'));

  let streak = 0;
  if (isNumWinner) {
    try {
      // 1. Credit Winner Coins in Neon
      await db.query(
        `UPDATE wallets 
         SET coin_balance = coin_balance + $1, updated_at = NOW() 
         WHERE user_id = $2`,
        [poolCalc.winnerPrize, winnerId]
      );

      // 2. Log Winner Transaction
      await db.query(
        `INSERT INTO transactions (user_id, amount, type, reference_id, description)
         VALUES ($1, $2, 'WIN_PRIZE', $3, $4)`,
        [winnerId, poolCalc.winnerPrize, matchId, `Won 1v1 match in ${gameSlug} (+${poolCalc.winnerPrize} coins)`]
      );

      // 3. Update Winner Stats & Streak
      const winnerStats = await db.query(
        `UPDATE users 
         SET win_count = win_count + 1, win_streak = win_streak + 1 
         WHERE id = $1 
         RETURNING win_streak, win_count, loss_count`,
        [winnerId]
      );

      streak = winnerStats.rows[0]?.win_streak || 0;
      const totalGames = (winnerStats.rows[0]?.win_count || 0) + (winnerStats.rows[0]?.loss_count || 0);
      const winRate = totalGames > 0 ? (winnerStats.rows[0].win_count / totalGames) : 0;

      // 4. Anti-Fraud Audit Check
      if (streak >= MAX_CONSECUTIVE_WINS_BEFORE_AUDIT) {
        console.warn(`[ANTI-CHEAT ALERT] User ${winnerId} hit ${streak} consecutive wins.`);
        await db.query(
          `INSERT INTO anti_fraud_logs (user_id, flag_type, severity, details)
           VALUES ($1, 'WIN_STREAK_ALERT', 'MEDIUM', $2)`,
          [winnerId, JSON.stringify({ streak, gameSlug, matchId, winRate })]
        );
      }

      if (totalGames >= 10 && winRate > WIN_RATE_ANOMALY_THRESHOLD) {
        console.warn(`[ANTI-CHEAT ALERT] User ${winnerId} has abnormal win rate: ${(winRate * 100).toFixed(1)}%`);
        await db.query(
          `INSERT INTO anti_fraud_logs (user_id, flag_type, severity, details)
           VALUES ($1, 'SUSPICIOUS_WIN_RATE', 'HIGH', $2)`,
          [winnerId, JSON.stringify({ totalGames, winRate, matchId })]
        );
      }
    } catch (e) {
      console.warn('Winner stats update warning:', e.message);
    }
  }

  // 5. Update Loser Stats (if human)
  if (isNumLoser) {
    try {
      await db.query(
        `UPDATE users 
         SET loss_count = loss_count + 1, win_streak = 0 
         WHERE id = $1`,
        [loserId]
      );
    } catch(e) {}
  }

  // 6. Finalize match record in DB
  try {
    await db.query(
      `UPDATE game_matches 
       SET status = 'COMPLETED', winner_id = $1, ended_at = NOW() 
       WHERE id = $2`,
      [isNumWinner ? winnerId : null, matchId]
    );
  } catch(e) {}

  return {
    winnerPrize: poolCalc.winnerPrize,
    platformRake: poolCalc.platformRake,
    streak
  };
}

module.exports = {
  canUserJoinMatch,
  calculatePrizePool,
  recordMatchOutcome,
  PLATFORM_RAKE_PERCENTAGE
};
