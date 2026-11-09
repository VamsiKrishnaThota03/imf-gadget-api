const jwt = require('jsonwebtoken');
const { requireEnv } = require('../config/env');

const auth = (req, res, next) => {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Please authenticate' });
  }

  try {
    req.user = jwt.verify(token, requireEnv('JWT_SECRET'), { algorithms: ['HS256'] });
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Please authenticate' });
  }
};

module.exports = auth;
