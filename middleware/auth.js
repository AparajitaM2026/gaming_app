const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ott_super_secret_gaming_jwt_key_2026_@#!';

function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      phone_or_email: user.phone_or_email,
      country_code: user.country_code
    }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.query.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }

  req.user = decoded;
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  JWT_SECRET
};
