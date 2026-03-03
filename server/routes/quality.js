/**
 * Контроль качества (Б9, Б10) и рекламации (A7)
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../storage');

const router = express.Router();
const QUALITY_PASSPORTS_FILE = 'quality_passports.json';
const RECLAMATIONS_FILE = 'reclamations.json';

// Паспорта качества бетона (Б9)
router.get('/passports', (req, res) => {
  let list = readJSON(QUALITY_PASSPORTS_FILE, []);
  const { dateFrom, dateTo, mark } = req.query;
  if (dateFrom) list = list.filter(p => p.date >= dateFrom);
  if (dateTo) list = list.filter(p => p.date <= dateTo);
  if (mark) list = list.filter(p => p.mark === mark);
  res.json(list);
});

router.post('/passports', (req, res) => {
  const list = readJSON(QUALITY_PASSPORTS_FILE, []);
  const passport = {
    id: uuidv4(),
    batchId: req.body.batchId,
    mark: req.body.mark,
    slumpTest: req.body.slumpTest,
    cubeStrength7: req.body.cubeStrength7,
    cubeStrength28: req.body.cubeStrength28,
    date: req.body.date || new Date().toISOString().slice(0, 10),
    labAssistant: req.body.labAssistant,
    status: req.body.status || 'draft',
    createdAt: new Date().toISOString(),
  };
  list.push(passport);
  writeJSON(QUALITY_PASSPORTS_FILE, list);
  res.status(201).json(passport);
});

router.put('/passports/:id', (req, res) => {
  const list = readJSON(QUALITY_PASSPORTS_FILE, []);
  const idx = list.findIndex(p => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Паспорт не найден' });
  list[idx] = { ...list[idx], ...req.body, id: req.params.id };
  writeJSON(QUALITY_PASSPORTS_FILE, list);
  res.json(list[idx]);
});

// Рекламации (A7)
router.get('/reclamations', (req, res) => {
  const list = readJSON(RECLAMATIONS_FILE, []);
  res.json(list);
});

router.post('/reclamations', (req, res) => {
  const list = readJSON(RECLAMATIONS_FILE, []);
  const item = {
    id: uuidv4(),
    clientId: req.body.clientId,
    clientName: req.body.clientName,
    orderId: req.body.orderId,
    description: req.body.description,
    date: req.body.date || new Date().toISOString(),
    resolution: req.body.resolution, // replacement | recalculation | rejection
    status: req.body.status || 'open',
    resolvedBy: req.body.resolvedBy,
    resolvedAt: req.body.resolvedAt,
    createdAt: new Date().toISOString(),
  };
  list.push(item);
  writeJSON(RECLAMATIONS_FILE, list);
  res.status(201).json(item);
});

router.put('/reclamations/:id', (req, res) => {
  const list = readJSON(RECLAMATIONS_FILE, []);
  const idx = list.findIndex(r => r.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Рекламация не найдена' });
  list[idx] = { ...list[idx], ...req.body, id: req.params.id };
  writeJSON(RECLAMATIONS_FILE, list);
  res.json(list[idx]);
});

module.exports = router;
