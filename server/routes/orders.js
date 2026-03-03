const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON, getById } = require('../storage');

const router = express.Router();
const ORDERS_BETON_FILE = 'orders_beton.json';
const ORDERS_ZBI_FILE = 'orders_zbi.json';
const SHIFT_PLANS_FILE = 'shift_plans.json';

// === Заказы на бетон (A1) ===
router.get('/beton', (req, res) => {
  const orders = readJSON(ORDERS_BETON_FILE, []);
  res.json(orders);
});

router.post('/beton', (req, res) => {
  const orders = readJSON(ORDERS_BETON_FILE, []);
  const order = {
    id: uuidv4(),
    clientId: req.body.clientId,
    clientName: req.body.clientName,
    mark: req.body.mark || 'М100',
    volume: req.body.volume,
    price: req.body.price,
    address: req.body.address,
    recipe: req.body.recipe,
    status: req.body.status || 'new',
    paymentChecked: req.body.paymentChecked ?? false,
    createdAt: new Date().toISOString(),
    scheduledDate: req.body.scheduledDate,
    notes: req.body.notes || '',
  };
  orders.push(order);
  writeJSON(ORDERS_BETON_FILE, orders);
  res.status(201).json(order);
});

router.put('/beton/:id', (req, res) => {
  const orders = readJSON(ORDERS_BETON_FILE, []);
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Заказ не найден' });
  orders[idx] = { ...orders[idx], ...req.body, id: req.params.id };
  writeJSON(ORDERS_BETON_FILE, orders);
  res.json(orders[idx]);
});

// === Заказы на ЖБИ (A2) ===
router.get('/zbi', (req, res) => {
  const orders = readJSON(ORDERS_ZBI_FILE, []);
  res.json(orders);
});

router.post('/zbi', (req, res) => {
  const orders = readJSON(ORDERS_ZBI_FILE, []);
  const order = {
    id: uuidv4(),
    clientId: req.body.clientId,
    clientName: req.body.clientName,
    productType: req.body.productType,
    productSize: req.body.productSize,
    quantity: req.body.quantity,
    price: req.body.price,
    source: req.body.source || 'production', // склад | production
    status: req.body.status || 'new',
    paymentChecked: req.body.paymentChecked ?? false,
    createdAt: new Date().toISOString(),
    scheduledDate: req.body.scheduledDate,
    notes: req.body.notes || '',
  };
  orders.push(order);
  writeJSON(ORDERS_ZBI_FILE, orders);
  res.status(201).json(order);
});

router.put('/zbi/:id', (req, res) => {
  const orders = readJSON(ORDERS_ZBI_FILE, []);
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Заказ не найден' });
  orders[idx] = { ...orders[idx], ...req.body, id: req.params.id };
  writeJSON(ORDERS_ZBI_FILE, orders);
  res.json(orders[idx]);
});

// === Проверка оплаты/лимита (A3) ===
router.post('/payment-check/:orderId', (req, res) => {
  const type = req.query.type || 'beton';
  const file = type === 'zbi' ? ORDERS_ZBI_FILE : ORDERS_BETON_FILE;
  const orders = readJSON(file, []);
  const idx = orders.findIndex(o => o.id === req.params.orderId);
  if (idx < 0) return res.status(404).json({ error: 'Заказ не найден' });
  orders[idx].paymentChecked = true;
  orders[idx].paymentCheckDate = new Date().toISOString();
  orders[idx].approvedBy = req.body.approvedBy || 'Бухгалтер';
  writeJSON(file, orders);
  res.json(orders[idx]);
});

// === Планы смен (A4, A5, A6) ===
router.get('/shift-plans', (req, res) => {
  const plans = readJSON(SHIFT_PLANS_FILE, []);
  res.json(plans);
});

router.post('/shift-plans', (req, res) => {
  const plans = readJSON(SHIFT_PLANS_FILE, []);
  const plan = {
    id: uuidv4(),
    date: req.body.date,
    shift: req.body.shift, // 1 | 2
    type: req.body.type, // rbu | zbi | armature
    orders: req.body.orders || [],
    assignments: req.body.assignments || {},
    status: req.body.status || 'draft',
    createdAt: new Date().toISOString(),
  };
  plans.push(plan);
  writeJSON(SHIFT_PLANS_FILE, plans);
  res.status(201).json(plan);
});

router.put('/shift-plans/:id', (req, res) => {
  const plans = readJSON(SHIFT_PLANS_FILE, []);
  const idx = plans.findIndex(p => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'План не найден' });
  plans[idx] = { ...plans[idx], ...req.body, id: req.params.id };
  writeJSON(SHIFT_PLANS_FILE, plans);
  res.json(plans[idx]);
});

module.exports = router;
