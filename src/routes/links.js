const express = require('express');
const router = express.Router();
const { pool } = require('../db/db');

// Helper function to generate random code
function generateCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper function to validate URL
function isValidURL(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Helper function to validate code format
function isValidCode(code) {
  return /^[A-Za-z0-9]{6,8}$/.test(code);
}

// POST /api/links - Create new link
router.post('/links', async (req, res) => {
  try {
    let { target_url, code } = req.body;

    // Validate target URL
    if (!target_url || !isValidURL(target_url)) {
      return res.status(400).json({ error: 'Invalid URL provided' });
    }

    // Generate code if not provided
    if (!code) {
      code = generateCode(6);
      
      // Check if generated code exists (unlikely but possible)
      let attempts = 0;
      while (attempts < 5) {
        const existing = await pool.query('SELECT code FROM links WHERE code = $1', [code]);
        if (existing.rows.length === 0) break;
        code = generateCode(6);
        attempts++;
      }
    } else {
      // Validate custom code format
      if (!isValidCode(code)) {
        return res.status(400).json({ error: 'Code must be 6-8 alphanumeric characters' });
      }

      // Check if code already exists
      const existing = await pool.query('SELECT code FROM links WHERE code = $1', [code]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Code already exists' });
      }
    }

    // Insert new link
    const result = await pool.query(
      'INSERT INTO links (code, target_url) VALUES ($1, $2) RETURNING *',
      [code, target_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/links - Get all links
router.get('/links', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM links ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/links/:code - Get single link stats
router.get('/links/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/links/:code - Delete link
router.delete('/links/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query('DELETE FROM links WHERE code = $1 RETURNING *', [code]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;