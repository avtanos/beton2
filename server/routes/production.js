/**
 * Производственные процессы (Группа Б)
 * Б4-Б13: производство щебня, хранение, армокаркасы, РБУ, ЖБИ
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON, getById } = require('../storage');

const router = express.Router();
const RBU_BATCHES_FILE = 'rbu_batches.json';
const ARMO_CARCASSES_FILE = 'armo_carcasses.json';
const ZBI_PRODUCTION_FILE = 'zbi_production.json';
const CRUSHER_LOG_FILE = 'crusher_log.json';
const TRANSFER_BETON_FILE = 'transfer_beton.json'; // Б12

// === Замесы РБУ (Б8) ===
router.get('/rbu-batches', (req, res) => {
  let batches = readJSON(RBU_BATCHES_FILE, []);
  const { date, mark } = req.query;
  if (date) batches = batches.filter(b => (b.date || '').startsWith(date));
  if (mark) batches = batches.filter(b => b.mark === mark);
  res.json(batches);
});

router.post('/rbu-batches', (req, res) => {
  const batches = readJSON(RBU_BATCHES_FILE, []);
  const batch = {
    id: uuidv4(),
    mark: req.body.mark,
    volume: req.body.volume,
    recipe: req.body.recipe || {},
    date: req.body.date || new Date().toISOString().slice(0, 10),
    time: req.body.time || new Date().toTimeString().slice(0, 8),
    orderId: req.body.orderId,
    destination: req.body.destination || 'external', // external | zbi
    operatorId: req.body.operatorId,
    createdAt: new Date().toISOString(),
  };
  batches.push(batch);
  writeJSON(RBU_BATCHES_FILE, batches);
  res.status(201).json(batch);
});

// === Армокаркасы (Б7) ===
router.get('/armo-carcasses', (req, res) => {
  const items = readJSON(ARMO_CARCASSES_FILE, []);
  res.json(items);
});

router.post('/armo-carcasses', (req, res) => {
  const items = readJSON(ARMO_CARCASSES_FILE, []);
  const item = {
    id: uuidv4(),
    type: req.body.type,
    size: req.body.size,
    quantity: req.body.quantity,
    weight: req.body.weight,
    date: req.body.date || new Date().toISOString().slice(0, 10),
    shift: req.body.shift,
    createdBy: req.body.createdBy,
    zbiOrderId: req.body.zbiOrderId,
    status: req.body.status || 'ready',
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  writeJSON(ARMO_CARCASSES_FILE, items);
  res.status(201).json(item);
});

// === Производство ЖБИ (Б11) ===
router.get('/zbi-production', (req, res) => {
  const items = readJSON(ZBI_PRODUCTION_FILE, []);
  res.json(items);
});

router.post('/zbi-production', (req, res) => {
  const items = readJSON(ZBI_PRODUCTION_FILE, []);
  const item = {
    id: uuidv4(),
    productType: req.body.productType,
    productSize: req.body.productSize,
    quantity: req.body.quantity,
    armoCarcassIds: req.body.armoCarcassIds || [],
    concreteBatchIds: req.body.concreteBatchIds || [],
    date: req.body.date || new Date().toISOString().slice(0, 10),
    shift: req.body.shift,
    formId: req.body.formId,
    status: req.body.status || 'produced',
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  writeJSON(ZBI_PRODUCTION_FILE, items);
  res.status(201).json(item);
});

// === Передача бетона в ЖБ цех (Б12) ===
router.get('/transfer-beton', (req, res) => {
  const transfers = readJSON(TRANSFER_BETON_FILE, []);
  res.json(transfers);
});

router.post('/transfer-beton', (req, res) => {
  const transfers = readJSON(TRANSFER_BETON_FILE, []);
  const transfer = {
    id: uuidv4(),
    batchIds: req.body.batchIds || [],
    volume: req.body.volume,
    mark: req.body.mark,
    date: req.body.date || new Date().toISOString().slice(0, 10),
    time: req.body.time,
    zbiOrderId: req.body.zbiOrderId,
    createdAt: new Date().toISOString(),
  };
  transfers.push(transfer);
  writeJSON(TRANSFER_BETON_FILE, transfers);
  res.status(201).json(transfer);
});

// === Журнал дробилки (Б4) ===
router.get('/crusher-log', (req, res) => {
  const logs = readJSON(CRUSHER_LOG_FILE, []);
  res.json(logs);
});

router.post('/crusher-log', (req, res) => {
  const logs = readJSON(CRUSHER_LOG_FILE, []);
  const log = {
    id: uuidv4(),
    date: req.body.date || new Date().toISOString().slice(0, 10),
    shift: req.body.shift,
    operatingHours: req.body.operatingHours,
    output510: req.body.output510 || 0,
    output2040: req.body.output2040 || 0,
    outputScreening: req.body.outputScreening || 0,
    downtime: req.body.downtime || 0,
    notes: req.body.notes || '',
    createdAt: new Date().toISOString(),
  };
  logs.push(log);
  writeJSON(CRUSHER_LOG_FILE, logs);
  res.status(201).json(log);
});

module.exports = router;
