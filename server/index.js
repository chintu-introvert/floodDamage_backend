require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const assessmentRoutes = require('./routes/assessment.routes');
const syncHistoryRoutes = require('./routes/syncHistory.routes');

const app = express();
const port = process.env.PORT || 3001;

// CORS setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    const Assessment = require('./models/assessment.model');
    const count = await Assessment.count();
    res.json({ status: 'ok', count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/sync-history', syncHistoryRoutes);

// Database Authentication and Server Start
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully via Sequelize.');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Database schema synchronized and altered successfully.');
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
