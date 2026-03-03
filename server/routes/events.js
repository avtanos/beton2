const express = require('express');
const { readJSON } = require('../storage');

const router = express.Router();

router.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const events = [];

  const batches = readJSON('rbu_batches.json', []);
  const weighings = readJSON('weighings.json', []);
  const ttn = readJSON('ttn.json', []);
  const passports = readJSON('quality_passports.json', []);
  const audit = readJSON('audit_log.json', []);

  batches.forEach(b => events.push({
    id: `batch-${b.id}`,
    type: 'batch',
    time: `${b.date || ''} ${b.time || ''}`,
    label: `Замес ${b.mark} ${b.volume} м³`,
    entityId: b.id,
    details: b,
  }));

  weighings.forEach(w => events.push({
    id: `weigh-${w.id}`,
    type: 'weighing',
    time: `${w.date || ''} ${w.time || ''}`,
    label: `${w.type}: ${w.vehicleNumber || ''} ${w.weight || ''} кг`,
    entityId: w.id,
  }));

  ttn.forEach(t => events.push({
    id: `ttn-${t.id}`,
    type: 'ttn',
    time: t.date,
    label: t.status === 'blocked' ? `ТТН ${t.number} заблокирована` : `ТТН ${t.number}`,
    entityId: t.id,
  }));

  audit.filter(a => ['block_ttn', 'unblock_ttn', 'payment_check'].includes(a.action)).forEach(a => events.push({
    id: `audit-${a.id}`,
    type: 'audit',
    time: a.createdAt,
    label: `${a.action}: ${a.entityId}`,
    details: a,
  }));

  passports.forEach(p => events.push({
    id: `passport-${p.id}`,
    type: 'passport',
    time: p.date,
    label: `Паспорт качества ${p.mark}`,
    entityId: p.id,
  }));

  events.sort((a, b) => new Date(b.time) - new Date(a.time));
  res.json(events.slice(0, limit));
});

module.exports = router;
