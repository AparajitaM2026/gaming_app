const db = require('../db');

async function migrate() {
  try {
    console.log('Creating game_configs table in Neon DB...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS game_configs (
        slug VARCHAR(64) PRIMARY KEY,
        title VARCHAR(128) NOT NULL,
        min_players SMALLINT NOT NULL DEFAULT 2,
        max_players SMALLINT NOT NULL DEFAULT 2,
        turn_duration_sec SMALLINT NOT NULL DEFAULT 30,
        entry_fee_default BIGINT NOT NULL DEFAULT 20,
        rules_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('game_configs table created.');

    const configs = [
      { slug: 'chess-master-ai', title: 'Chess Master', min_players: 2, max_players: 2, turn_duration_sec: 60, entry_fee: 20 },
      { slug: 'carrom-clash-ai', title: 'Carrom Clash', min_players: 2, max_players: 2, turn_duration_sec: 25, entry_fee: 20 },
      { slug: 'checkers-classic-ai', title: 'Checkers Classic', min_players: 2, max_players: 2, turn_duration_sec: 30, entry_fee: 15 },
      { slug: 'connect4-arena-ai', title: 'Connect 4 Arena', min_players: 2, max_players: 2, turn_duration_sec: 20, entry_fee: 10 },
      { slug: 'tictactoe-neon-ai', title: 'Tic Tac Toe Neon', min_players: 2, max_players: 2, turn_duration_sec: 15, entry_fee: 10 },
      { slug: 'ludo-hero-ai', title: 'Ludo Hero Live', min_players: 2, max_players: 4, turn_duration_sec: 25, entry_fee: 20 },
      { slug: 'dice-duel', title: 'Dice Duel Cyber Race', min_players: 2, max_players: 4, turn_duration_sec: 20, entry_fee: 15 }
    ];

    for (const c of configs) {
      await db.query(`
        INSERT INTO game_configs (slug, title, min_players, max_players, turn_duration_sec, entry_fee_default)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          min_players = EXCLUDED.min_players,
          max_players = EXCLUDED.max_players,
          turn_duration_sec = EXCLUDED.turn_duration_sec,
          entry_fee_default = EXCLUDED.entry_fee_default;
      `, [c.slug, c.title, c.min_players, c.max_players, c.turn_duration_sec, c.entry_fee]);
    }
    console.log('Seeded dynamic game configs successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
