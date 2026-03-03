/**
 * BI-дашборды и аналитика
 * Оперативный, финансовый, технический, качество
 */
const express = require('express');
const { readJSON } = require('../storage');

const router = express.Router();

// Оперативный дашборд
router.get('/operational', (req, res) => {
  const date = (req.query.date || '').trim() || new Date().toISOString().slice(0, 10);
  const weighings = readJSON('weighings.json', []);
  const batches = readJSON('rbu_batches.json', []);
  const inert = readJSON('warehouse_inert.json', {});
  const metalItems = readJSON('warehouse_metal.json', []);
  const ttn = readJSON('ttn.json', []);
  const returns = readJSON('concrete_returns.json', []);
  const queue = readJSON('dispatch_queue.json', []);
  const cementSilos = readJSON('cement_silos.json', { silo1: 80, silo2: 75 });
  const clients = readJSON('clients.json', []);
  const realizations = readJSON('realization.json', []);
  const ordersBeton = readJSON('orders_beton.json', []);
  const passports = readJSON('quality_passports.json', []);

  const dayWeighings = weighings.filter(w => (w.date || '').startsWith(date));
  const dayBatches = batches.filter(b => (b.date || '').startsWith(date));
  const volumeRbu = dayBatches.reduce((s, b) => s + (b.volume || 0), 0);
  const weightTotal = dayWeighings.filter(w => w.type === 'brutto').reduce((s, w) => s + (w.weight || 0), 0);
  const metalBalance = metalItems.reduce((s, i) => s + (i.weight || 0), 0);
  const discrepancy = weightTotal > 0 && volumeRbu > 0
    ? Math.abs((volumeRbu * 2.4 - weightTotal) / (volumeRbu * 2.4) * 100).toFixed(2)
    : 0;
  const discrepancyNum = parseFloat(discrepancy);
  const totalShipped = batches.reduce((s, b) => s + (b.volume || 0), 0);
  const returnsVolume = returns.reduce((s, r) => s + (r.volume || 0), 0);
  const returnsPercent = totalShipped > 0 ? (returnsVolume / totalShipped * 100).toFixed(2) : 0;

  const risks = [];
  if (discrepancyNum > 2) {
    risks.push({ type: 'discrepancy', label: `Расхождение >2%: ${discrepancy}%`, severity: 'critical' });
  }
  ordersBeton.filter(o => o.status !== 'cancelled' && o.scheduledDate === date).forEach(o => {
    const hasPassport = passports.some(p => p.batchId && dayBatches.some(b => b.orderId === o.id && b.id === p.batchId));
    if (!hasPassport && dayBatches.some(b => b.orderId === o.id)) risks.push({ type: 'no_passport', orderId: o.id, label: `Заказ ${o.id} без паспорта качества`, severity: 'warning' });
  });
  clients.forEach(c => {
    const debt = realizations.filter(r => r.clientId === c.id).reduce((s, r) => s + ((r.amount || 0) - (r.paidAmount || 0)), 0);
    if (debt > (c.creditLimit || 0) && c.creditLimit > 0) risks.push({ type: 'debt_over_limit', clientId: c.id, label: `ДЗ ${c.name} превышает лимит`, severity: 'warning' });
  });

  const blockedTtn = ttn.filter(t => t.status === 'blocked');

  res.json({
    date,
    shipments: { count: dayWeighings.filter(w => w.type === 'brutto').length, weight: weightTotal },
    rbuVolume: volumeRbu,
    discrepancy: discrepancyNum,
    discrepancyCritical: discrepancyNum > 2,
    warehouseInert: inert,
    metalBalance,
    returnsPercent: parseFloat(returnsPercent),
    risks,
    queueCount: queue.filter(q => q.status === 'waiting').length,
    queueAvgWait: 15,
    cementSilos,
    blockedTtnCount: blockedTtn.length,
  });
});

// Финансовый дашборд
router.get('/financial', (req, res) => {
  const realizations = readJSON('realization.json', []);
  const clients = readJSON('clients.json', []);

  const totalRevenue = realizations.reduce((s, r) => s + (r.amount || 0), 0);
  const totalPaid = realizations.reduce((s, r) => s + (r.paidAmount || 0), 0);
  const totalDebt = realizations.reduce((s, r) => s + ((r.amount || 0) - (r.paidAmount || 0)), 0);

  const byClient = {};
  realizations.forEach(r => {
    const id = r.clientId || r.clientName;
    if (!byClient[id]) byClient[id] = { id: r.clientId, name: r.clientName, amount: 0, paid: 0, debt: 0 };
    byClient[id].amount += r.amount || 0;
    byClient[id].paid += r.paidAmount || 0;
    byClient[id].debt += (r.amount || 0) - (r.paidAmount || 0);
  });

  res.json({
    totalRevenue,
    totalPaid,
    totalDebt,
    byClient: Object.values(byClient),
  });
});

// Технический дашборд
router.get('/technical', (req, res) => {
  const crusherLogs = readJSON('crusher_log.json', []);
  const maintenance = readJSON('maintenance.json', []);
  const metalMovements = readJSON('metal_movements.json', []);
  const armoCarcasses = readJSON('armo_carcasses.json', []);

  const totalOperatingHours = crusherLogs.reduce((s, l) => s + (l.operatingHours || 0), 0);
  const totalDowntime = crusherLogs.reduce((s, l) => s + (l.downtime || 0), 0);
  const maintenanceCount = maintenance.length;
  const metalUsed = metalMovements.filter(m => m.type === 'issue').reduce((s, m) => s + (m.weight || 0), 0);
  const armoOutput = armoCarcasses.reduce((s, a) => s + (a.weight || 0) * (a.quantity || 1), 0);
  const metalUtilization = metalUsed > 0 ? (armoOutput / metalUsed * 100).toFixed(2) : 0;

  res.json({
    crusher: { operatingHours: totalOperatingHours, downtime: totalDowntime },
    maintenanceCount,
    metalUsed,
    armoOutput,
    metalUtilization: parseFloat(metalUtilization),
  });
});

// Дашборд качества
router.get('/quality', (req, res) => {
  const passports = readJSON('quality_passports.json', []);
  const reclamations = readJSON('reclamations.json', []);
  const batches = readJSON('rbu_batches.json', []);

  const totalVolume = batches.reduce((s, b) => s + (b.volume || 0), 0);
  const reclamationsPer1000 = totalVolume > 0 ? (reclamations.length / (totalVolume / 1000)).toFixed(2) : 0;
  const avgStrength28 = passports.length
    ? (passports.reduce((s, p) => s + (p.cubeStrength28 || 0), 0) / passports.length).toFixed(2)
    : 0;

  res.json({
    passportsCount: passports.length,
    reclamationsCount: reclamations.length,
    reclamationsPer1000m3: parseFloat(reclamationsPer1000),
    avgStrength28: parseFloat(avgStrength28),
  });
});

// Сводка по загрузке
router.get('/capacity', (req, res) => {
  const ordersBeton = readJSON('orders_beton.json', []);
  const ordersZbi = readJSON('orders_zbi.json', []);
  const date = (req.query.date || '').trim() || new Date().toISOString().slice(0, 10);

  const dayBeton = ordersBeton.filter(o => o.scheduledDate === date && o.status !== 'cancelled');
  const dayZbi = ordersZbi.filter(o => o.scheduledDate === date && o.status !== 'cancelled');
  const volumeBeton = dayBeton.reduce((s, o) => s + (o.volume || 0), 0);

  res.json({
    date,
    betonOrders: dayBeton.length,
    betonVolume: volumeBeton,
    zbiOrders: dayZbi.length,
  });
});

module.exports = router;
