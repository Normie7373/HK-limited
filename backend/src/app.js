const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
};
app.use(cors(corsOptions));
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

// Serve frontend static files in production (Render unified deployment)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  // SPA fallback - serve index.html for any non-API route
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
      res.status(404).json({ success: false, message: 'API Route Not Found' });
    }
  });
} else {
  // 404 Route handler (local dev or when frontend is not built)
  app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'API Route Not Found' });
  });
}

// Error handling middleware
app.use(errorHandler);

module.exports = app;
