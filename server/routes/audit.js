const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../storage');

const router = express.Router();
const AUDIT_FILE = 'audit_log.json';

router.get('/', (req, res) => {
  let logs = readJSON(AUDIT_FILE, []);
  const { entity, entityId, action, userId, limit = 100 } = req.query;
  if (entity) logs = logs.filter(l => l.entity === entity);
  if (entityId) logs = logs.filter(l => l.entityId === entityId);
  if (action) logs = logs.filter(l => l.action === action);
  if (userId) logs = logs.filter(l => l.userId === userId);
  logs = logs.slice(-Number(limit));
  res.json(logs.reverse());
});

router.post('/', (req, res) => {
  const logs = readJSON(AUDIT_FILE, []);
  const entry = {
    id: uuidv4(),
    entity: req.body.entity,
    entityId: req.body.entityId,
    action: req.body.action,
    details: req.body.details || {},
    userId: req.body.userId || 'system',
    userName: req.body.userName || 'Система',
    createdAt: new Date().toISOString(),
  };
  logs.push(entry);
  writeJSON(AUDIT_FILE, logs);
  res.status(201).json(entry);
});

module.exports = router;
