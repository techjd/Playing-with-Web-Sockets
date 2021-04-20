const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getCurrentLoggedIn,
} = require('../controllers/userControllers');

const protect = require('../middleware/auth');

router.route('/registerUser').post(registerUser);
router.route('/login').post(loginUser);
router.route('/me').get(protect, getCurrentLoggedIn);

module.exports = router;
