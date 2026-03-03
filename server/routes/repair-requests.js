const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../storage');

const router = express.Router();
const REPAIRS_FILE = 'repair_requests.json';

router.get('/', (req, res) => {
  const items = readJSON(REPAIRS_FILE, []);
  res.json(items);
});

router.post('/', (req, res) => {
  const items = readJSON(REPAIRS_FILE, []);
  const item = {
    id: uuidv4(),
    equipment: req.body.equipment,
    priority: req.body.priority || 'normal',
    reason: req.body.reason,
    status: req.body.status || 'open',
    downtime: req.body.downtime || 0,
    assignedTo: req.body.assignedTo,
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  writeJSON(REPAIRS_FILE, items);
  res.status(201).json(item);
});

router.put('/:id', (req, res) => {
  const items = readJSON(REPAIRS_FILE, []);
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Не найдено' });
  items[idx] = { ...items[idx], ...req.body, id: req.params.id };
  writeJSON(REPAIRS_FILE, items);
  res.json(items[idx]);
});

module.exports = router;
