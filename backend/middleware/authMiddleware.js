const jwt = require('jsonwebtoken');
const db = require('../db');

// JWT Middleware
const expiredTokenCache = new Set();

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send({ message: 'No token provided. Please log in.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      try {
        const expiredDecoded = jwt.decode(token);
        if (expiredDecoded?.user_code) {
          // Only log once per token
          if (!expiredTokenCache.has(expiredDecoded.user_code)) {
            expiredTokenCache.add(expiredDecoded.user_code);

            db.query(
              'UPDATE users SET isActive = 0 WHERE user_code = ?',
              [expiredDecoded.user_code],
              (err) => { if (err) console.error('Failed to update user isActive:', err); }
            );

            db.query(
              'INSERT INTO audit_log (user_code, user_role, action, actor_type, timestamp) VALUES (?, ?, ?, "user", NOW())',
              [expiredDecoded.user_code, expiredDecoded.role, 'Session Ended - Token Expired'],
              (auditErr) => { if (auditErr) console.error('Failed to log audit:', auditErr); }
            );
          }
        }
      } catch (e) {
        console.error('Failed to decode expired token:', e);
      }

      return res.status(403).json({ message: 'Token is invalid or expired.' });
    }

    req.user = decoded;
    next();
  });
}


module.exports = verifyToken;
