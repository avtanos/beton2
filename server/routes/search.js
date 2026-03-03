const express = require('express');
const { readJSON } = require('../storage');

const router = express.Router();

router.get('/', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q || q.length < 2) return res.json({ orders: [], weighings: [], ttn: [], clients: [], passports: [] });

  const ordersBeton = readJSON('orders_beton.json', []);
  const ordersZbi = readJSON('orders_zbi.json', []);
  const weighings = readJSON('weighings.json', []);
  const ttn = readJSON('ttn.json', []);
  const clients = readJSON('clients.json', []);
  const passports = readJSON('quality_passports.json', []);

  const match = (obj, fields) => fields.some(f => {
    const v = obj[f];
    return v != null && String(v).toLowerCase().includes(q);
  });

  const orders = [
    ...ordersBeton.filter(o => match(o, ['id', 'clientName', 'mark'])).map(o => ({ ...o, type: 'beton' })),
    ...ordersZbi.filter(o => match(o, ['id', 'clientName', 'productType', 'productSize'])).map(o => ({ ...o, type: 'zbi' })),
  ];

  const weighingsFiltered = weighings.filter(w => match(w, ['id', 'vehicleNumber', 'driver', 'orderId']));
  const ttnFiltered = ttn.filter(t => match(t, ['number', 'clientName', 'vehicleNumber', 'orderId']));
  const clientsFiltered = clients.filter(c => match(c, ['name', 'inn', 'contactPerson']));
  const passportsFiltered = passports.filter(p => match(p, ['id', 'batchId', 'mark']));

  res.json({ orders, weighings: weighingsFiltered, ttn: ttnFiltered, clients: clientsFiltered, passports: passportsFiltered });
});

module.exports = router;
