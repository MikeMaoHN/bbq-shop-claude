require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const db = require('./models');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/v1', require('./routes/api'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server
const start = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected.');

    // Sync database (dev only)
    if (config.env === 'development') {
      await db.sequelize.sync({ alter: true });
      console.log('Database synced.');

      // Run seeds
      const seed = require('../database/seeds/init');
      await seed();
    }

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.env}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
