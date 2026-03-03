/**
 * ТОиР и персонал (В1, В2, В3)
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../storage');

const router = express.Router();
const MAINTENANCE_FILE = 'maintenance.json';
const TIMESHEET_FILE = 'timesheet.json';

// ТОиР (В1)
router.get('/', (req, res) => {
  const items = readJSON(MAINTENANCE_FILE, []);
  res.json(items);
});

router.post('/', (req, res) => {
  const items = readJSON(MAINTENANCE_FILE, []);
  const item = {
    id: uuidv4(),
    equipment: req.body.equipment, // crusher | rbu | mixer | armature | etc
    type: req.body.type, // planned | emergency
    description: req.body.description,
    date: req.body.date || new Date().toISOString().slice(0, 10),
    duration: req.body.duration,
    downtime: req.body.downtime || 0,
    performedBy: req.body.performedBy,
    sparesUsed: req.body.sparesUsed || [],
    status: req.body.status || 'planned',
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  writeJSON(MAINTENANCE_FILE, items);
  res.status(201).json(item);
});

router.put('/:id', (req, res) => {
  const items = readJSON(MAINTENANCE_FILE, []);
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Не найдено' });
  items[idx] = { ...items[idx], ...req.body, id: req.params.id };
  writeJSON(MAINTENANCE_FILE, items);
  res.json(items[idx]);
});

// Табель (В3)
router.get('/timesheet', (req, res) => {
  const items = readJSON(TIMESHEET_FILE, []);
  res.json(items);
});

router.post('/timesheet', (req, res) => {
  const items = readJSON(TIMESHEET_FILE, []);
  const item = {
    id: uuidv4(),
    employeeName: req.body.employeeName,
    department: req.body.department,
    date: req.body.date || new Date().toISOString().slice(0, 10),
    shift: req.body.shift,
    hours: req.body.hours,
    status: req.body.status || 'present',
    output: req.body.output,
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  writeJSON(TIMESHEET_FILE, items);
  res.status(201).json(item);
});

module.exports = router;
