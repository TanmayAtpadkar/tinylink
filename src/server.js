const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { pool, initDB } = require('./db/db');
const linksRouter = require('./routes/links');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database
initDB();

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    ok: true, 
    version: '1.0',
    uptime: process.uptime()
  });
});

// API routes
app.use('/api', linksRouter);

// Serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Stats page
app.get('/code/:code', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/stats.html'));
});

// Redirect handler - MUST be last
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Get link from database
    const result = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
    
    if (result.rows.length === 0) {
      return res.status(404).send('Link not found');
    }
    
    const link = result.rows[0];
    
    // Update click count and last clicked time
    await pool.query(
      'UPDATE links SET clicks = clicks + 1, last_clicked = CURRENT_TIMESTAMP WHERE code = $1',
      [code]
    );
    
    // Redirect to target URL
    res.redirect(302, link.target_url);
  } catch (error) {
    console.error('Error redirecting:', error);
    res.status(500).send('Internal server error');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});