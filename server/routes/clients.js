const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON, getById, upsert, remove } = require('../storage');

const router = express.Router();
const CLIENTS_FILE = 'clients.json';

// Список клиентов
router.get('/', (req, res) => {
  const clients = readJSON(CLIENTS_FILE, []);
  res.json(clients);
});

// Один клиент
router.get('/:id', (req, res) => {
  const clients = readJSON(CLIENTS_FILE, []);
  const client = getById(clients, req.params.id);
  if (!client) return res.status(404).json({ error: 'Клиент не найден' });
  res.json(client);
});

// Создать клиента
router.post('/', (req, res) => {
  const clients = readJSON(CLIENTS_FILE, []);
  const client = {
    id: uuidv4(),
    name: req.body.name || '',
    inn: req.body.inn || '',
    address: req.body.address || '',
    contactPerson: req.body.contactPerson || '',
    phone: req.body.phone || '',
    creditLimit: req.body.creditLimit || 0,
    prepaymentRequired: req.body.prepaymentRequired ?? true,
    createdAt: new Date().toISOString(),
    ...req.body,
  };
  delete client.id;
  client.id = uuidv4();
  clients.push(client);
  writeJSON(CLIENTS_FILE, clients);
  res.status(201).json(client);
});

// Обновить клиента
router.put('/:id', (req, res) => {
  const clients = readJSON(CLIENTS_FILE, []);
  const idx = clients.findIndex(c => c.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Клиент не найден' });
  clients[idx] = { ...clients[idx], ...req.body, id: req.params.id };
  writeJSON(CLIENTS_FILE, clients);
  res.json(clients[idx]);
});

// Удалить клиента
router.delete('/:id', (req, res) => {
  const clients = readJSON(CLIENTS_FILE, []);
  const filtered = remove(clients, req.params.id);
  if (filtered.length === clients.length) return res.status(404).json({ error: 'Клиент не найден' });
  writeJSON(CLIENTS_FILE, filtered);
  res.json({ success: true });
});

module.exports = router;
