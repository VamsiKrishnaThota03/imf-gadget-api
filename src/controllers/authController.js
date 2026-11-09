const jwt = require('jsonwebtoken');
const { UniqueConstraintError } = require('sequelize');
const { User } = require('../models');
const { requireEnv } = require('../config/env');

const USERNAME_RE = /^[A-Za-z0-9_.-]{3,50}$/;
const MIN_PASSWORD_LENGTH = 8;

const signToken = (user) =>
  jwt.sign({ id: user.id }, requireEnv('JWT_SECRET'), {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

const register = async (req, res, next) => {
  const { username, password } = req.body || {};

  if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
    return res.status(400).json({
      message: 'username must be 3-50 characters: letters, numbers, ".", "_" or "-"',
    });
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      message: `password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  }

  try {
    // Only whitelisted fields are passed to the model (no mass assignment).
    const user = await User.create({ username, password });
    return res.status(201).json({ user, token: signToken(user) });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({ message: 'Username is already taken' });
    }
    return next(error);
  }
};

const login = async (req, res, next) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'username and password are required' });
  }

  try {
    const user = await User.findOne({ where: { username } });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    return res.json({ user, token: signToken(user) });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
};
