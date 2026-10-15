const { Client } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_u8e9bHatFTpY@ep-misty-recipe-b4mm6qtl-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function initDatabase() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to Neon DB. Setting up database schema...");

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        phone_or_email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(255) DEFAULT '/avatars/default.png',
        country_code VARCHAR(10) DEFAULT 'IN',
        is_banned BOOLEAN DEFAULT FALSE,
        win_count INT DEFAULT 0,
        loss_count INT DEFAULT 0,
        win_streak INT DEFAULT 0,
        last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log(" users table created.");

    // 2. Wallets Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        coin_balance BIGINT DEFAULT 100 CHECK (coin_balance >= 0),
        bonus_coins BIGINT DEFAULT 50 CHECK (bonus_coins >= 0),
        locked_coins BIGINT DEFAULT 0 CHECK (locked_coins >= 0),
        last_daily_claim TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log(" wallets table created.");

    // 3. Transactions Ledger
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        amount BIGINT NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'SIGNUP_BONUS', 'DAILY_CLAIM', 'ENTRY_FEE', 'WIN_PRIZE', 'RAKE_DEDUCTION', 'VOUCHER_REDEEM'
        status VARCHAR(20) DEFAULT 'COMPLETED', -- 'PENDING', 'COMPLETED', 'FAILED'
        reference_id VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log(" transactions table created.");

    // 4. Multiplayer Rooms / Matches
    await client.query(`
      CREATE TABLE IF NOT EXISTS game_matches (
        id VARCHAR(50) PRIMARY KEY,
        game_slug VARCHAR(50) NOT NULL,
        game_name VARCHAR(100) NOT NULL,
        game_type VARCHAR(20) DEFAULT '1v1', -- '1v1', '4P', 'TOURNAMENT'
        entry_fee INT DEFAULT 20,
        prize_pool INT DEFAULT 32, -- 20*2 = 40 minus 20% rake = 32
        platform_rake INT DEFAULT 8,
        status VARCHAR(30) DEFAULT 'WAITING', -- 'WAITING', 'ACTIVE', 'COMPLETED', 'CANCELLED'
        player1_id INT REFERENCES users(id),
        player2_id INT REFERENCES users(id),
        winner_id INT REFERENCES users(id),
        match_data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ended_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log(" game_matches table created.");

    // 5. Anti-Fraud & Player Rules Log
    await client.query(`
      CREATE TABLE IF NOT EXISTS anti_fraud_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        flag_type VARCHAR(50) NOT NULL, -- 'WIN_STREAK_ALERT', 'RAPID_PLAY_COOLDOWN', 'SUSPICIOUS_WIN_RATE', 'BOT_EXPLOIT'
        severity VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
        details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log(" anti_fraud_logs table created.");

    // 6. Games Catalog
    await client.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL, -- 'action', 'puzzle', 'sports', 'board', 'multiplayer'
        thumbnail VARCHAR(255) NOT NULL,
        game_url TEXT NOT NULL,
        is_multiplayer BOOLEAN DEFAULT FALSE,
        min_players INT DEFAULT 1,
        max_players INT DEFAULT 1,
        entry_fee_coins INT DEFAULT 0,
        orientation VARCHAR(20) DEFAULT 'portrait', -- 'portrait', 'landscape'
        rating NUMERIC(2,1) DEFAULT 4.8,
        plays_count INT DEFAULT 1200,
        is_featured BOOLEAN DEFAULT FALSE
      );
    `);
    console.log(" games catalog table created.");

    // 7. Seed Initial Games (Popular single player & multiplayer)
    const initialGames = [
      // Multiplayer Skill Games
      { slug: 'ludo-arena', title: 'Ludo Arena Live', category: 'multiplayer', thumbnail: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=500&auto=format&fit=crop&q=60', game_url: '/games/ludo', is_multiplayer: true, min_players: 2, max_players: 4, entry_fee_coins: 20, orientation: 'portrait', rating: 4.9, plays_count: 8540, is_featured: true },
      { slug: 'speed-trivia', title: 'Speed Trivia 1v1', category: 'multiplayer', thumbnail: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=500&auto=format&fit=crop&q=60', game_url: '/games/trivia', is_multiplayer: true, min_players: 2, max_players: 2, entry_fee_coins: 10, orientation: 'portrait', rating: 4.8, plays_count: 6320, is_featured: true },
      { slug: 'dice-duel', title: 'Cyber Dice Duel', category: 'multiplayer', thumbnail: 'https://images.unsplash.com/photo-1570303345338-e1f0eddf4946?w=500&auto=format&fit=crop&q=60', game_url: '/games/dice', is_multiplayer: true, min_players: 2, max_players: 2, entry_fee_coins: 15, orientation: 'portrait', rating: 4.7, plays_count: 5120, is_featured: true },
      { slug: 'carrom-clash', title: 'Carrom 3D Clash', category: 'multiplayer', thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=60', game_url: '/games/carrom', is_multiplayer: true, min_players: 2, max_players: 2, entry_fee_coins: 25, orientation: 'portrait', rating: 4.9, plays_count: 9400, is_featured: true },
      
      // Single Player Casual Games
      { slug: 'neon-runner', title: 'Cyber Runner 2099', category: 'action', thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=60', game_url: '/play/runner', is_multiplayer: false, min_players: 1, max_players: 1, entry_fee_coins: 0, orientation: 'portrait', rating: 4.8, plays_count: 14200, is_featured: true },
      { slug: 'space-blaster', title: 'Galaxy Star Fighter', category: 'action', thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60', game_url: '/play/space', is_multiplayer: false, min_players: 1, max_players: 1, entry_fee_coins: 0, orientation: 'portrait', rating: 4.6, plays_count: 9800, is_featured: false },
      { slug: 'cyber-2048', title: 'Neon 2048 Blast', category: 'puzzle', thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60', game_url: '/play/2048', is_multiplayer: false, min_players: 1, max_players: 1, entry_fee_coins: 0, orientation: 'portrait', rating: 4.9, plays_count: 22100, is_featured: true },
      { slug: 'knife-hit-pro', title: 'Cyber Blade Hit', category: 'arcade', thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=60', game_url: '/play/knife', is_multiplayer: false, min_players: 1, max_players: 1, entry_fee_coins: 0, orientation: 'portrait', rating: 4.7, plays_count: 16500, is_featured: false },
      { slug: 'bubble-shooter-neon', title: 'Orbital Bubble Pop', category: 'arcade', thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60', game_url: '/play/bubbles', is_multiplayer: false, min_players: 1, max_players: 1, entry_fee_coins: 0, orientation: 'portrait', rating: 4.8, plays_count: 19800, is_featured: false },
      { slug: 'penalty-shootout', title: 'Neon Strike Soccer', category: 'sports', thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=60', game_url: '/play/penalty', is_multiplayer: false, min_players: 1, max_players: 1, entry_fee_coins: 0, orientation: 'portrait', rating: 4.6, plays_count: 11200, is_featured: false },
      { slug: 'speed-racing', title: 'Drift Horizon Neon', category: 'sports', thumbnail: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&auto=format&fit=crop&q=60', game_url: '/play/racing', is_multiplayer: false, min_players: 1, max_players: 1, entry_fee_coins: 0, orientation: 'portrait', rating: 4.7, plays_count: 13400, is_featured: false },
      { slug: 'block-puzzle-jewel', title: 'Matrix Block Puzzle', category: 'puzzle', thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60', game_url: '/play/blocks', is_multiplayer: false, min_players: 1, max_players: 1, entry_fee_coins: 0, orientation: 'portrait', rating: 4.8, plays_count: 17300, is_featured: false }
    ];

    for (const g of initialGames) {
      await client.query(`
        INSERT INTO games (slug, title, category, thumbnail, game_url, is_multiplayer, min_players, max_players, entry_fee_coins, orientation, rating, plays_count, is_featured)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          thumbnail = EXCLUDED.thumbnail,
          game_url = EXCLUDED.game_url,
          is_multiplayer = EXCLUDED.is_multiplayer,
          entry_fee_coins = EXCLUDED.entry_fee_coins,
          is_featured = EXCLUDED.is_featured;
      `, [g.slug, g.title, g.category, g.thumbnail, g.game_url, g.is_multiplayer, g.min_players, g.max_players, g.entry_fee_coins, g.orientation, g.rating, g.plays_count, g.is_featured]);
    }
    console.log(" Initial games seeded successfully.");

    await client.end();
    console.log("All Neon database schemas and seed data ready!");
  } catch (err) {
    console.error("Database schema init error:", err);
    process.exit(1);
  }
}

initDatabase();
