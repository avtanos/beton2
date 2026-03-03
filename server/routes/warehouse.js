/**
 * Складской учёт (Б5, Б6, Б13, В2, В4, В6)
 * Склад инертных, склад металла, склад ЖБИ, запчасти, отходы
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../storage');

const router = express.Router();
const INERT_BALANCE_FILE = 'warehouse_inert.json';
const METAL_BALANCE_FILE = 'warehouse_metal.json';
const ZBI_BALANCE_FILE = 'warehouse_zbi.json';
const SPARES_BALANCE_FILE = 'warehouse_spares.json';
const METAL_MOVEMENTS_FILE = 'metal_movements.json';
const SCRAP_METAL_FILE = 'scrap_metal.json';
const INVENTORY_FILE = 'inventory.json';

// Остатки инертных (Б5)
router.get('/inert', (req, res) => {
  const balance = readJSON(INERT_BALANCE_FILE, { sand: 0, screening: 0, fraction510: 0, fraction2040: 0, movements: [] });
  res.json(balance);
});

router.post('/inert/movement', (req, res) => {
  const data = readJSON(INERT_BALANCE_FILE, { sand: 0, screening: 0, fraction510: 0, fraction2040: 0, movements: [] });
  const mov = {
    id: uuidv4(),
    type: req.body.type, // receipt | issue
    material: req.body.material,
    quantity: req.body.quantity,
    date: req.body.date || new Date().toISOString(),
    documentRef: req.body.documentRef,
  };
  data.movements = data.movements || [];
  data.movements.push(mov);
  const key = mov.material in data ? mov.material : 'sand';
  if (mov.type === 'receipt') data[key] = (data[key] || 0) + mov.quantity;
  else data[key] = Math.max(0, (data[key] || 0) - mov.quantity);
  writeJSON(INERT_BALANCE_FILE, data);
  res.status(201).json(data);
});

// Остатки металла (Б6)
router.get('/metal', (req, res) => {
  const items = readJSON(METAL_BALANCE_FILE, []);
  res.json(items);
});

router.post('/metal/receipt', (req, res) => {
  const items = readJSON(METAL_BALANCE_FILE, []);
  const receipt = {
    id: uuidv4(),
    type: req.body.type, // A400 | A500 | Vr1 | angle | channel | sheet
    diameter: req.body.diameter,
    weight: req.body.weight,
    meters: req.body.meters,
    certificate: req.body.certificate,
    date: req.body.date || new Date().toISOString(),
    documentRef: req.body.documentRef,
    createdAt: new Date().toISOString(),
  };
  items.push(receipt);
  writeJSON(METAL_BALANCE_FILE, items);
  res.status(201).json(receipt);
});

// Списание металла в производство (Г9)
router.post('/metal/issue', (req, res) => {
  const movements = readJSON(METAL_MOVEMENTS_FILE, []);
  const issue = {
    id: uuidv4(),
    type: 'issue',
    materialType: req.body.materialType,
    weight: req.body.weight,
    armoOrderId: req.body.armoOrderId,
    date: req.body.date || new Date().toISOString(),
    documentRef: req.body.documentRef,
    createdAt: new Date().toISOString(),
  };
  movements.push(issue);
  writeJSON(METAL_MOVEMENTS_FILE, movements);
  res.status(201).json(issue);
});

// Склад ЖБИ (Б13)
router.get('/zbi', (req, res) => {
  const items = readJSON(ZBI_BALANCE_FILE, []);
  res.json(items);
});

router.post('/zbi', (req, res) => {
  const items = readJSON(ZBI_BALANCE_FILE, []);
  const item = {
    id: uuidv4(),
    productType: req.body.productType,
    productSize: req.body.productSize,
    quantity: req.body.quantity,
    productionId: req.body.productionId,
    mark: req.body.mark,
    date: req.body.date || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  writeJSON(ZBI_BALANCE_FILE, items);
  res.status(201).json(item);
});

router.put('/zbi/:id', (req, res) => {
  const items = readJSON(ZBI_BALANCE_FILE, []);
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Не найдено' });
  items[idx] = { ...items[idx], ...req.body };
  writeJSON(ZBI_BALANCE_FILE, items);
  res.json(items[idx]);
});

// Отходы металла (В4)
router.get('/scrap-metal', (req, res) => {
  const items = readJSON(SCRAP_METAL_FILE, []);
  res.json(items);
});

router.post('/scrap-metal', (req, res) => {
  const items = readJSON(SCRAP_METAL_FILE, []);
  const item = {
    id: uuidv4(),
    weight: req.body.weight,
    date: req.body.date || new Date().toISOString(),
    disposition: req.body.disposition, // sale | disposal
    revenue: req.body.revenue || 0,
    documentRef: req.body.documentRef,
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  writeJSON(SCRAP_METAL_FILE, items);
  res.status(201).json(item);
});

// Инвентаризация (В6)
router.get('/inventory', (req, res) => {
  const inventories = readJSON(INVENTORY_FILE, []);
  res.json(inventories);
});

router.post('/inventory', (req, res) => {
  const inventories = readJSON(INVENTORY_FILE, []);
  const inv = {
    id: uuidv4(),
    warehouse: req.body.warehouse, // inert | metal | zbi | spares
    date: req.body.date || new Date().toISOString(),
    items: req.body.items || [],
    discrepancies: req.body.discrepancies || [],
    status: req.body.status || 'draft',
    createdAt: new Date().toISOString(),
  };
  inventories.push(inv);
  writeJSON(INVENTORY_FILE, inventories);
  res.status(201).json(inv);
});

// Склад запчастей (В2)
router.get('/spares', (req, res) => {
  const items = readJSON(SPARES_BALANCE_FILE, []);
  res.json(items);
});

router.post('/spares', (req, res) => {
  const items = readJSON(SPARES_BALANCE_FILE, []);
  const item = {
    id: uuidv4(),
    name: req.body.name,
    article: req.body.article,
    quantity: req.body.quantity,
    unit: req.body.unit || 'шт',
    type: req.body.type, // receipt | issue
    date: req.body.date || new Date().toISOString(),
    documentRef: req.body.documentRef,
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  writeJSON(SPARES_BALANCE_FILE, items);
  res.status(201).json(item);
});

module.exports = router;
