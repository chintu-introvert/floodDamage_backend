const Assessment = require('../models/assessment.model');
const { v4: uuidv4 } = require('uuid');
const { parse } = require('json2csv');

exports.createOrUpdate = async (req, res) => {
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
    created_at,
    timestamp,
    synced_at,
    syncedAt
  } = req.body;

  const finalTotalChickens = totalChickens !== undefined ? totalChickens : total_chickens;
  const finalCondition = cond || condition;

  if (latitude === undefined || longitude === undefined || !finalCondition || finalTotalChickens === undefined) {
    return res.status(400).json({ error: 'Missing required fields: latitude, longitude, condition/cond, totalChickens' });
  }

  // Determine ID.
  const finalId = id || siteId || uuidv4();
  const photosJson = photos ? (Array.isArray(photos) ? JSON.stringify(photos) : photos) : '[]';
  const now = new Date().toISOString();

  try {
    // Check if assessment already exists
    const existing = await Assessment.findByPk(finalId);

    const data = {
      id: finalId,
      latitude,
      longitude,
      address: address || null,
      cond: finalCondition,
      total_chickens: finalTotalChickens,
      photos: photosJson,
      notes: notes || null,
      userId: req.user.id, // Store unique logged-in user ID
      created_at: created_at || timestamp || now,
      synced_at: synced_at || syncedAt || now
    };

    if (existing) {
      await existing.update(data);
    } else {
      await Assessment.create(data);
    }

    res.status(201).json({ id: finalId, message: 'Assessment saved successfully' });
  } catch (error) {
    console.error('Database error on upsert:', error);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const assessmentsList = await Assessment.findAll({
      where: {
        userId: req.user.id // Scope to currently logged-in user's ID
      },
      order: [['created_at', 'DESC']]
    });

    let totalChickens = 0;
    const formattedAssessments = assessmentsList.map(a => {
      const plain = a.toJSON();
      
      try {
        plain.photos = JSON.parse(plain.photos);
      } catch (e) {
        plain.photos = [];
      }

      plain.condition = plain.cond;

      if (plain.total_chickens && !isNaN(plain.total_chickens)) {
        totalChickens += Number(plain.total_chickens);
      }

      return plain;
    });

    res.json({
      assessments: formattedAssessments,
      totalChickens
    });
  } catch (error) {
    console.error('Fetch assessments error:', error);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id // Enforce ownership check using userId
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const plain = assessment.toJSON();
    try {
      plain.photos = JSON.parse(plain.photos);
    } catch (e) {
      plain.photos = [];
    }
    plain.condition = plain.cond;

    res.json(plain);
  } catch (error) {
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
};

exports.exportCsv = async (req, res) => {
  try {
    const assessmentsList = await Assessment.findAll({
      where: {
        userId: req.user.id // Scope CSV export strictly to the logged-in user
      },
      order: [['created_at', 'DESC']]
    });

    if (assessmentsList.length === 0) {
      return res.status(404).json({ error: 'No assessments to export' });
    }

    const plainList = assessmentsList.map(a => a.toJSON());
    const csv = parse(plainList);

    res.header('Content-Type', 'text/csv');
    res.attachment('assessments_export.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
};
