const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const dashboardRoutes = require('./routes/dashboard');
const transportersRoutes = require('./routes/transporters');
const ratingsRoutes = require('./routes/ratings');
const reportsRoutes = require('./routes/reports');
const alertsRoutes = require('./routes/alerts');
const adminRoutes = require('./routes/admin');
const invoicesRoutes = require('./routes/invoices');
const errorHandler = require('./middleware/errorHandler');
const { authenticateJWT } = require('./middleware/auth');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', authenticateJWT, adminRoutes);
app.use('/api/invoices', authenticateJWT, invoicesRoutes);
app.use('/api/dashboard', authenticateJWT, dashboardRoutes);
app.use('/api/transporters', authenticateJWT, transportersRoutes);
app.use('/api/ratings', authenticateJWT, ratingsRoutes);
app.use('/api/reports', authenticateJWT, reportsRoutes);
app.use('/api/alerts', authenticateJWT, alertsRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
