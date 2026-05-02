const jwt = require('jsonwebtoken');
const tokenBlacklist = require('../config/tokenBlacklist');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
  }

  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ message: 'Session expirée. Veuillez vous reconnecter.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token invalide ou expiré.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès interdit. Rôle insuffisant.' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
