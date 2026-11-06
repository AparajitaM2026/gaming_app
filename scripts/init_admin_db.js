const db = require('../db.js');

async function initAdminSchema() {
  try {
    console.log('Setting up admin tables in Neon DB...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id SERIAL PRIMARY KEY,
        user_id INT,
        username VARCHAR(100) NOT NULL,
        ip_address VARCHAR(100),
        user_agent TEXT,
        login_type VARCHAR(50) DEFAULT 'STANDARD',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Add is_admin column to users table if not exists
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'is_admin'
        ) THEN
          ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);

    // Ensure last_login_at column exists in users
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'last_login_at'
        ) THEN
          ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
      END $$;
    `);

    console.log('✅ Admin schema initialized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Admin schema init error:', err);
    process.exit(1);
  }
}

initAdminSchema();
