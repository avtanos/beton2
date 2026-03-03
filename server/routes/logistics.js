/**
 * Логистика и отгрузки (Группа Г)
 * Г2-Г8: подача под загрузку, отгрузка, возврат, ТТН, отгрузка ЖБИ, реализация
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../storage');

const router = express.Router();
const TTN_FILE = 'ttn.json';
const CONCRETE_RETURNS_FILE = 'concrete_returns.json';
const REALIZATION_FILE = 'realization.json';
const DISPATCH_QUEUE_FILE = 'dispatch_queue.json';

// Очередь диспетчера (Г2)
router.get('/dispatch-queue', (req, res) => {
  const queue = readJSON(DISPATCH_QUEUE_FILE, []);
  res.json(queue);
});

router.post('/dispatch-queue', (req, res) => {
  const queue = readJSON(DISPATCH_QUEUE_FILE, []);
  const item = {
    id: uuidv4(),
    vehicleNumber: req.body.vehicleNumber,
    orderId: req.body.orderId,
    position: req.body.position || queue.length + 1,
    status: req.body.status || 'waiting',
    arrivedAt: req.body.arrivedAt || new Date().toISOString(),
    loadedAt: req.body.loadedAt,
  };
  queue.push(item);
  writeJSON(DISPATCH_QUEUE_FILE, queue);
  res.status(201).json(item);
});

// ТТН (Г6)
router.get('/ttn', (req, res) => {
  let list = readJSON(TTN_FILE, []);
  const { dateFrom, dateTo, clientId } = req.query;
  if (dateFrom) list = list.filter(t => t.date >= dateFrom);
  if (dateTo) list = list.filter(t => t.date <= dateTo);
  if (clientId) list = list.filter(t => t.clientId === clientId);
  res.json(list);
});

router.post('/ttn', (req, res) => {
  const list = readJSON(TTN_FILE, []);
  const ttn = {
    id: uuidv4(),
    number: req.body.number || `ТТН-${Date.now()}`,
    orderId: req.body.orderId,
    clientId: req.body.clientId,
    clientName: req.body.clientName,
    productType: req.body.productType, // beton | zbi
    mark: req.body.mark,
    volume: req.body.volume,
    weight: req.body.weight,
    vehicleNumber: req.body.vehicleNumber,
    driver: req.body.driver,
    date: req.body.date || new Date().toISOString().slice(0, 10),
    weighInId: req.body.weighInId,
    weighOutId: req.body.weighOutId,
    batchIds: req.body.batchIds || [],
    status: req.body.status || 'draft',
    createdAt: new Date().toISOString(),
  };
  list.push(ttn);
  writeJSON(TTN_FILE, list);
  res.status(201).json(ttn);
});

router.put('/ttn/:id', (req, res) => {
  const list = readJSON(TTN_FILE, []);
  const idx = list.findIndex(t => t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'ТТН не найдена' });
  list[idx] = { ...list[idx], ...req.body, id: req.params.id };
  writeJSON(TTN_FILE, list);
  res.json(list[idx]);
});

router.post('/ttn/:id/unblock', (req, res) => {
  const list = readJSON(TTN_FILE, []);
  const idx = list.findIndex(t => t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'ТТН не найдена' });
  list[idx].status = 'confirmed';
  list[idx].unblockReason = req.body.reason;
  list[idx].unblockedBy = req.body.unblockedBy || 'Диспетчер';
  list[idx].unblockedAt = new Date().toISOString();
  writeJSON(TTN_FILE, list);
  res.json(list[idx]);
});

// Возврат бетона (Г5)
router.get('/concrete-returns', (req, res) => {
  const returns = readJSON(CONCRETE_RETURNS_FILE, []);
  res.json(returns);
});

router.post('/concrete-returns', (req, res) => {
  const returns = readJSON(CONCRETE_RETURNS_FILE, []);
  const item = {
    id: uuidv4(),
    vehicleNumber: req.body.vehicleNumber,
    volume: req.body.volume,
    mark: req.body.mark,
    disposition: req.body.disposition, // drain | zbi | disposal
    date: req.body.date || new Date().toISOString(),
    decisionBy: req.body.decisionBy,
    notes: req.body.notes || '',
    createdAt: new Date().toISOString(),
  };
  returns.push(item);
  writeJSON(CONCRETE_RETURNS_FILE, returns);
  res.status(201).json(item);
});

// Реализация (Г8)
router.get('/realization', (req, res) => {
  let list = readJSON(REALIZATION_FILE, []);
  const { dateFrom, dateTo, clientId } = req.query;
  if (dateFrom) list = list.filter(r => r.date >= dateFrom);
  if (dateTo) list = list.filter(r => r.date <= dateTo);
  if (clientId) list = list.filter(r => r.clientId === clientId);
  res.json(list);
});

router.post('/realization', (req, res) => {
  const list = readJSON(REALIZATION_FILE, []);
  const item = {
    id: uuidv4(),
    ttnId: req.body.ttnId,
    clientId: req.body.clientId,
    clientName: req.body.clientName,
    amount: req.body.amount,
    paidAmount: req.body.paidAmount || 0,
    debt: (req.body.amount || 0) - (req.body.paidAmount || 0),
    date: req.body.date || new Date().toISOString().slice(0, 10),
    status: req.body.status || 'pending',
    createdAt: new Date().toISOString(),
  };
  list.push(item);
  writeJSON(REALIZATION_FILE, list);
  res.status(201).json(item);
});

module.exports = router;
