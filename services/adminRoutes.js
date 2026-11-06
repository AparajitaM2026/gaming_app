const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('../db.js');
const adminService = require('./adminService.js');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_voltixz_gaming_jwt_key_2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@Voltixz2026';

// Admin Auth Middleware
function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.startsWith('Bearer ')) 
      ? authHeader.split(' ')[1] 
      : req.query.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Admin authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access only' });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
  }
}

// -------------------------------------------------------------
// 1. ADMIN AUTHENTICATION
// -------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    let isAuthorized = false;
    let adminPayload = { id: 0, username: 'admin', role: 'admin' };

    // 1. Check configured master credentials
    if (username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      isAuthorized = true;
    } else {
      // 2. Check DB for admin user
      const userRes = await db.query(
        'SELECT id, username, password_hash, is_admin FROM users WHERE (username = $1 OR phone_or_email = $1) AND is_admin = true',
        [username.trim()]
      );
      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];
        const match = await bcrypt.compare(password, u.password_hash);
        if (match) {
          isAuthorized = true;
          adminPayload = { id: u.id, username: u.username, role: 'admin' };
        }
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({ success: false, message: 'Invalid admin username or password' });
    }

    const token = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      admin: adminPayload,
      message: 'Admin authenticated successfully'
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during admin login' });
  }
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// -------------------------------------------------------------
// 2. MONITORING & ANALYTICS
// -------------------------------------------------------------
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json({ success: true, stats });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { search, filter, limit, offset } = req.query;
    const users = await adminService.getUsersList({
      search,
      filter,
      limit: Number(limit) || 100,
      offset: Number(offset) || 0
    });
    res.json({ success: true, users });
  } catch (err) {
    console.error('Error fetching users list:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch users list' });
  }
});

router.post('/users/:id/toggle-ban', requireAdmin, async (req, res) => {
  try {
    const result = await adminService.toggleUserBan(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error toggling ban:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to toggle ban' });
  }
});

router.get('/active-sessions', requireAdmin, (req, res) => {
  try {
    const sessions = adminService.getActiveSessionsList();
    res.json({ success: true, count: sessions.length, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch active sessions' });
  }
});

router.get('/login-history', requireAdmin, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const logs = await adminService.getLoginLogs(limit);
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    console.error('Error fetching login history:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch login history' });
  }
});

// -------------------------------------------------------------
// 3. GAME MANAGEMENT (ADD, EDIT, DELETE, LIST)
// -------------------------------------------------------------
router.get('/games', requireAdmin, async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const games = await adminService.getAdminGamesList({ search, category, sort });
    res.json({ success: true, count: games.length, games });
  } catch (err) {
    console.error('Error fetching games:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch games' });
  }
});

router.post('/games', requireAdmin, async (req, res) => {
  try {
    const game = await adminService.addGame(req.body);
    res.json({ success: true, message: 'Game added successfully', game });
  } catch (err) {
    console.error('Error adding game:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to add game' });
  }
});

router.put('/games/:id', requireAdmin, async (req, res) => {
  try {
    const game = await adminService.updateGame(req.params.id, req.body);
    res.json({ success: true, message: 'Game updated successfully', game });
  } catch (err) {
    console.error('Error updating game:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to update game' });
  }
});

router.delete('/games/:id', requireAdmin, async (req, res) => {
  try {
    const result = await adminService.deleteGame(req.params.id);
    res.json({ success: true, message: 'Game deleted successfully', ...result });
  } catch (err) {
    console.error('Error deleting game:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to delete game' });
  }
});

// Poster Image Upload (Base64 data or SVG/PNG)
router.post('/upload-poster', requireAdmin, async (req, res) => {
  try {
    const { filename, fileData } = req.body;
    if (!filename || !fileData) {
      return res.status(400).json({ success: false, message: 'Filename and base64 fileData required' });
    }

    const cleanName = filename.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const posterDir = path.join(__dirname, '..', 'public', 'assets', 'posters');
    if (!fs.existsSync(posterDir)) {
      fs.mkdirSync(posterDir, { recursive: true });
    }

    const targetPath = path.join(posterDir, cleanName);
    const base64Content = fileData.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(targetPath, Buffer.from(base64Content, 'base64'));

    res.json({
      success: true,
      url: `/assets/posters/${cleanName}`,
      message: 'Poster uploaded successfully'
    });
  } catch (err) {
    console.error('Error uploading poster:', err);
    res.status(500).json({ success: false, message: 'Failed to upload poster' });
  }
});

module.exports = router;
