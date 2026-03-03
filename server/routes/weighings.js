/**
 * Маршруты взвешиваний (1С Весы)
 * Г1 - въезд (тара), Г4 - выезд (брутто)
 * Б1-Б3 - приём материалов
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON, getById } = require('../storage');

const router = express.Router();
const WEIGHINGS_FILE = 'weighings.json';

router.get('/', (req, res) => {
  let weighings = readJSON(WEIGHINGS_FILE, []);
  const { type, dateFrom, dateTo, vehicleNumber } = req.query;
  if (type) weighings = weighings.filter(w => w.type === type);
  if (dateFrom) weighings = weighings.filter(w => w.date >= dateFrom);
  if (dateTo) weighings = weighings.filter(w => w.date <= dateTo);
  if (vehicleNumber) weighings = weighings.filter(w => 
    (w.vehicleNumber || '').toLowerCase().includes(vehicleNumber.toLowerCase())
  );
  res.json(weighings);
});

router.get('/:id', (req, res) => {
  const weighings = readJSON(WEIGHINGS_FILE, []);
  const w = getById(weighings, req.params.id);
  if (!w) return res.status(404).json({ error: 'Взвешивание не найдено' });
  res.json(w);
});

router.post('/', (req, res) => {
  const weighings = readJSON(WEIGHINGS_FILE, []);
  const weighing = {
    id: uuidv4(),
    type: req.body.type, // tare | brutto | receipt_inert | receipt_cement | receipt_metal
    vehicleNumber: req.body.vehicleNumber,
    driver: req.body.driver,
    clientId: req.body.clientId,
    weight: req.body.weight,
    date: req.body.date || new Date().toISOString().slice(0, 10),
    time: req.body.time || new Date().toTimeString().slice(0, 8),
    orderId: req.body.orderId,
    material: req.body.material,
    notes: req.body.notes || '',
    createdAt: new Date().toISOString(),
  };
  weighings.push(weighing);
  writeJSON(WEIGHINGS_FILE, weighings);
  res.status(201).json(weighing);
});

router.put('/:id', (req, res) => {
  const weighings = readJSON(WEIGHINGS_FILE, []);
  const idx = weighings.findIndex(w => w.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Взвешивание не найдено' });
  weighings[idx] = { ...weighings[idx], ...req.body, id: req.params.id };
  writeJSON(WEIGHINGS_FILE, weighings);
  res.json(weighings[idx]);
});

module.exports = router;
