const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');

// import jwt from 'jsonwebtoken';
// import asyncHandler from '../middleware/async.js';

const protect = asyncHandler(async (req, res, next) => {
  // Get Token from header
  const token = req.header('token');

  // Check if No Token

  if (!token) {
    return res.status(401).json({ msg: 'You are not authorized' });
  }

  // Verify Token

  try {
    const decoded = jwt.verify(token, 'mysecrettoken');

    req.user = decoded.user;

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
});

module.exports = protect;
