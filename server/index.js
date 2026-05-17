require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { parse } = require('json2csv');
const pool = require('./db');

const app = express();
const port = process.env.PORT || 3001;

// CORS setup: allow localhost:5173 in development
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

// Setup body parsing for JSON and URL-encoded. Using large limits for base64 photos
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Setup multer as requested (though primarily needed for multipart/form-data)
const upload = multer();

// GET /health — return { status: 'ok', count: N }
app.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM assessments');
    const count = rows[0].count;
    res.json({ status: 'ok', count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assessments — insert or update (upsert by id), return 201
app.post('/api/assessments', upload.none(), async (req, res) => {
  const {
    id,
    siteId,
    latitude,
    longitude,
    address,
    condition,
    cond,
    totalChickens,
    total_chickens,
    photos,
    notes,
    assessor_name,
    assessorName,
    created_at,
    timestamp,
    synced_at,
    syncedAt
  } = req.body;

  // Support both camelCase and snake_case for total chickens from request
  const finalTotalChickens = totalChickens !== undefined ? totalChickens : total_chickens;
  const finalCondition = cond || condition;

  // 400 for missing required fields (latitude, longitude, condition, totalChickens)
  if (latitude === undefined || longitude === undefined || !finalCondition || finalTotalChickens === undefined) {
    return res.status(400).json({ error: 'Missing required fields: latitude, longitude, condition/cond, totalChickens' });
  }

  // Determine id. If frontend sends UUID, it might fail against an INT column. We pass it anyway.
  const finalId = id || siteId || uuidv4();
  const photosJson = photos ? (Array.isArray(photos) ? JSON.stringify(photos) : photos) : '[]';
  const now = new Date().toISOString();

  try {
    const query = `
      INSERT INTO assessments (
        id, latitude, longitude, address, cond, total_chickens,
        photos, notes, assessor_name, created_at, synced_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON DUPLICATE KEY UPDATE
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        address = VALUES(address),
        cond = VALUES(cond),
        total_chickens = VALUES(total_chickens),
        photos = VALUES(photos),
        notes = VALUES(notes),
        assessor_name = VALUES(assessor_name),
        created_at = VALUES(created_at),
        synced_at = VALUES(synced_at)
    `;

    const values = [
      finalId,
      latitude,
      longitude,
      address || null,
      finalCondition,
      finalTotalChickens,
      photosJson,
      notes || null,
      assessor_name || assessorName || null,
      created_at || timestamp || now,
      synced_at || syncedAt || now
    ];

    await pool.query(query, values);

    res.status(201).json({ id: finalId, message: 'Assessment saved successfully' });
  } catch (error) {
    console.error('Database error on insert:', error);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

// GET /api/assessments — return all assessments as JSON
app.get('/api/assessments', async (req, res) => {
  try {
    const [assessments] = await pool.query('SELECT * FROM assessments ORDER BY created_at DESC');

    let totalChickens = 0;

    // Parse photos JSON strings back to arrays
    assessments.forEach(a => {
      try {
        a.photos = JSON.parse(a.photos);
      } catch (e) {
        a.photos = [];
      }

      // Also alias cond back to condition for the frontend if needed
      a.condition = a.cond;

      // Add to total count
      if (a.total_chickens && !isNaN(a.total_chickens)) {
        totalChickens += Number(a.total_chickens);
      }
    });

    // Returning an object containing both the array and the total
    res.json({
      assessments,
      totalChickens
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

// GET /api/assessments/:id — return single assessment
app.get('/api/assessments/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM assessments WHERE id = ?', [req.params.id]);
    const assessment = rows[0];

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    try {
      assessment.photos = JSON.parse(assessment.photos);
    } catch (e) {
      assessment.photos = [];
    }
    assessment.condition = assessment.cond;

    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

// GET /api/export/csv — return all as CSV (use json2csv)
app.get('/api/export/csv', async (req, res) => {
  try {
    const [assessments] = await pool.query('SELECT * FROM assessments ORDER BY created_at DESC');

    if (assessments.length === 0) {
      return res.status(404).json({ error: 'No assessments to export' });
    }

    const csv = parse(assessments);

    res.header('Content-Type', 'text/csv');
    res.attachment('assessments_export.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
