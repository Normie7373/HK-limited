const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET || 'hkshipping_jwt_secret_key_12345';

// POST /api/auth/register - Register a new user
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if email is whitelisted/authorized
    const authorizedQuery = 'SELECT * FROM authorized_emails WHERE email = $1';
    const authorizedResult = await pool.query(authorizedQuery, [email]);
    if (authorizedResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your email address is not pre-authorized to register. Please contact your system administrator.' 
      });
    }

    const assignedRole = authorizedResult.rows[0].role;

    // Check if username/email already exists
    const checkUserQuery = 'SELECT id FROM users WHERE username = $1 OR email = $2';
    const checkResult = await pool.query(checkUserQuery, [username, email]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const insertQuery = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, created_at
    `;
    const { rows } = await pool.query(insertQuery, [username, email, passwordHash, assignedRole]);
    const newUser = rows[0];

    // Write audit log
    const { logAction } = require('../utils/logger');
    await logAction(newUser.id, newUser.username, 'USER_REGISTER', `New user registered with role ${assignedRole}`);

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login - User Login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // Fetch user
    const getUserQuery = 'SELECT * FROM users WHERE username = $1 OR email = $1';
    const { rows } = await pool.query(getUserQuery, [username]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Write audit log
    const { logAction } = require('../utils/logger');
    await logAction(user.id, user.username, 'USER_LOGIN', 'User logged in successfully');

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me - Get current user profile (optional helper)
router.get('/me', async (req, res, next) => {
  // Uses authenticateJWT middleware prior to execution
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const token = req.headers.authorization.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role
        }
      }
    });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid session' });
  }
});

module.exports = router;
