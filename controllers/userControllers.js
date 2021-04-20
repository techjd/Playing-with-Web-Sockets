const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../middleware/async');
const Users = require('../models/users');

// @desc Get Details of Current LoggedInUser
// @route GET /api/user/me
// @access PRIVATE
const getCurrentLoggedIn = asyncHandler(async (req, res, next) => {
  try {
    const user = await Users.findById(req.user.id).select('-password');
    console.log(user.id);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @desc Register A New User
// @route POST /api/user/register
// @access Public
const registerUser = asyncHandler(async (req, res, next) => {
  const { email, name, password } = req.body;
  console.log(req.body.name);
  try {
    let user = await Users.findOne({ email });

    if (user) {
      return res.status(400).json({ errors: 'User Already Existed' });
    }

    user = new Users({
      email,
      name,
      password,
    });

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    console.log('Getting JWT');

    jwt.sign(payload, 'mysecrettoken', { expiresIn: 3600000 }, (err, token) => {
      if (err) {
        throw err;
      }
      res.json({ token, user });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error.. Please Try Again Later' });
  }
});

// @desc Login A User
// @route POST /api/user/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log(email);
  try {
    let user = await Users.findOne({ email });

    if (!user) {
      return res.status(400).json({ errors: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ errors: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    console.log('Getting JWT');

    jwt.sign(payload, 'mysecrettoken', { expiresIn: 3600000 }, (err, token) => {
      if (err) {
        throw err;
      }
      res.status(200).json({ token, user });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error.. Please Try Again Later' });
  }
});

module.exports = { registerUser, loginUser, getCurrentLoggedIn };
