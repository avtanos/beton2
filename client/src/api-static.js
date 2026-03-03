/**
 * Статический API для GitHub Pages — загрузка данных из JSON без бэкенда
 */
const BASE = process.env.PUBLIC_URL || '';

async function load(filename, defaultVal = []) {
  const res = await fetch(`${BASE}/data/${filename}`);
  if (!res.ok) return defaultVal;
  try {
    const data = await res.json();
    return data;
  } catch {
    return defaultVal;
  }
}

function noop() {
  return Promise.reject(new Error('Запись отключена в демо-режиме (GitHub Pages)'));
}

async function computeOperational(date) {
  const d = date || new Date().toISOString().slice(0, 10);
  const [weighings, batches, ttn, queue, cementSilos, clients, realizations, ordersBeton, passports] = await Promise.all([
    load('weighings.json').then(d => Array.isArray(d) ? d : []),
    load('rbu_batches.json').then(d => Array.isArray(d) ? d : []),
    load('ttn.json'),
    load('dispatch_queue.json').then(d => Array.isArray(d) ? d : []),
    load('cement_silos.json', {}),
    load('clients.json').then(d => Array.isArray(d) ? d : []),
    load('realization.json').then(d => Array.isArray(d) ? d : []),
    load('orders_beton.json').then(d => Array.isArray(d) ? d : []),
    load('quality_passports.json').then(d => Array.isArray(d) ? d : []),
  ]);
  const dayWeighings = weighings.filter(w => (w.date || '').startsWith(d));
  const dayBatches = batches.filter(b => (b.date || '').startsWith(d));
  const volumeRbu = dayBatches.reduce((s, b) => s + (b.volume || 0), 0);
  const weightTotal = dayWeighings.filter(w => w.type === 'brutto').reduce((s, w) => s + (w.weight || 0), 0);
  const discrepancy = weightTotal > 0 && volumeRbu > 0
    ? Math.abs((volumeRbu * 2.4 - weightTotal) / (volumeRbu * 2.4) * 100).toFixed(2)
    : 0;
  const discNum = parseFloat(discrepancy);
  const blockedTtn = ttn.filter(t => t.status === 'blocked');
  const risks = [];
  if (discNum > 2) risks.push({ type: 'discrepancy', label: `Расхождение >2%: ${discrepancy}%`, severity: 'critical' });
  const dayOrders = ordersBeton.filter(o => o.status !== 'cancelled' && o.scheduledDate === d);
  dayOrders.forEach(o => {
    const hasPassport = passports.some(p => p.batchId && dayBatches.some(b => b.orderId === o.id && b.id === p.batchId));
    if (!hasPassport && dayBatches.some(b => b.orderId === o.id)) risks.push({ type: 'no_passport', orderId: o.id, label: `Заказ ${o.id} без паспорта`, severity: 'warning' });
  });
  clients.forEach(c => {
    const debt = realizations.filter(r => r.clientId === c.id).reduce((s, r) => s + ((r.amount || 0) - (r.paidAmount || 0)), 0);
    if (debt > (c.creditLimit || 0) && c.creditLimit > 0) risks.push({ type: 'debt_over_limit', clientId: c.id, label: `ДЗ ${c.name} превышает лимит`, severity: 'warning' });
  });
  const silos = cementSilos && typeof cementSilos === 'object' ? cementSilos : { silo1: { level: 80, daysToMin: 5 }, silo2: { level: 75, daysToMin: 4 } };
  return {
    date: d,
    shipments: { count: dayWeighings.filter(w => w.type === 'brutto').length, weight: weightTotal },
    rbuVolume: volumeRbu,
    discrepancy: discNum,
    discrepancyCritical: discNum > 2,
    risks,
    queueCount: (Array.isArray(queue) ? queue : []).filter(q => q.status === 'waiting').length,
    queueAvgWait: 15,
    cementSilos: silos,
    blockedTtnCount: blockedTtn.length,
  };
}

async function computeFinancial() {
  const [r, c] = await Promise.all([load('realization.json'), load('clients.json')]);
  const realizations = Array.isArray(r) ? r : [];
  const clients = Array.isArray(c) ? c : [];
  const totalRevenue = realizations.reduce((s, r) => s + (r.amount || 0), 0);
  const totalPaid = realizations.reduce((s, r) => s + (r.paidAmount || 0), 0);
  const totalDebt = totalRevenue - totalPaid;
  const byClient = {};
  realizations.forEach(r => {
    const id = r.clientId || r.clientName;
    if (!byClient[id]) byClient[id] = { id: r.clientId, name: r.clientName, amount: 0, paid: 0, debt: 0 };
    byClient[id].amount += r.amount || 0;
    byClient[id].paid += r.paidAmount || 0;
    byClient[id].debt = (byClient[id].amount || 0) - (byClient[id].paid || 0);
  });
  return { totalRevenue, totalPaid, totalDebt, byClient: Object.values(byClient) };
}

async function computeTechnical() {
  const [cl, m, mm, ac] = await Promise.all([
    load('crusher_log.json'),
    load('maintenance.json'),
    load('metal_movements.json'),
    load('armo_carcasses.json'),
  ]);
  const crusherLogs = Array.isArray(cl) ? cl : [];
  const maintenance = Array.isArray(m) ? m : [];
  const metalMovements = Array.isArray(mm) ? mm : [];
  const armoCarcasses = Array.isArray(ac) ? ac : [];
  const totalOperatingHours = crusherLogs.reduce((s, l) => s + (l.operatingHours || 0), 0);
  const totalDowntime = crusherLogs.reduce((s, l) => s + (l.downtime || 0), 0);
  const metalUsed = metalMovements.filter(m => m.type === 'issue').reduce((s, m) => s + (m.weight || 0), 0);
  const armoOutput = armoCarcasses.reduce((s, a) => s + (a.weight || 0) * (a.quantity || 1), 0);
  const metalUtilization = metalUsed > 0 ? (armoOutput / metalUsed * 100).toFixed(2) : 0;
  return {
    crusher: { operatingHours: totalOperatingHours, downtime: totalDowntime },
    maintenanceCount: maintenance.length,
    metalUsed,
    armoOutput,
    metalUtilization: parseFloat(metalUtilization),
  };
}

async function computeQuality() {
  const [p, r, b] = await Promise.all([
    load('quality_passports.json'),
    load('reclamations.json'),
    load('rbu_batches.json'),
  ]);
  const passports = Array.isArray(p) ? p : [];
  const reclamations = Array.isArray(r) ? r : [];
  const batches = Array.isArray(b) ? b : [];
  const totalVolume = batches.reduce((s, b) => s + (b.volume || 0), 0);
  const reclamationsPer1000 = totalVolume > 0 ? (reclamations.length / (totalVolume / 1000)).toFixed(2) : 0;
  const avgStrength28 = passports.length
    ? (passports.reduce((s, p) => s + (p.cubeStrength28 || 0), 0) / passports.length).toFixed(2)
    : 0;
  return { passportsCount: passports.length, reclamationsCount: reclamations.length, reclamationsPer1000m3: parseFloat(reclamationsPer1000), avgStrength28: parseFloat(avgStrength28) };
}

async function computeCapacity(date) {
  const d = date || new Date().toISOString().slice(0, 10);
  const [ob, oz] = await Promise.all([load('orders_beton.json'), load('orders_zbi.json')]);
  const ordersBeton = Array.isArray(ob) ? ob : [];
  const ordersZbi = Array.isArray(oz) ? oz : [];
  const dayBeton = ordersBeton.filter(o => o.scheduledDate === d && o.status !== 'cancelled');
  const dayZbi = ordersZbi.filter(o => o.scheduledDate === d && o.status !== 'cancelled');
  const volumeBeton = dayBeton.reduce((s, o) => s + (o.volume || 0), 0);
  return { date: d, betonOrders: dayBeton.length, betonVolume: volumeBeton, zbiOrders: dayZbi.length };
}

async function computeEvents(limit = 20) {
  const [b, w, t, p, a] = await Promise.all([
    load('rbu_batches.json'),
    load('weighings.json'),
    load('ttn.json'),
    load('quality_passports.json'),
    load('audit_log.json'),
  ]);
  const batches = Array.isArray(b) ? b : [];
  const weighings = Array.isArray(w) ? w : [];
  const ttn = Array.isArray(t) ? t : [];
  const passports = Array.isArray(p) ? p : [];
  const audit = Array.isArray(a) ? a : [];
  const events = [];
  batches.forEach(b => events.push({ id: `batch-${b.id}`, type: 'batch', time: `${b.date || ''} ${b.time || ''}`, label: `Замес ${b.mark} ${b.volume} м³`, orderId: b.orderId, batchId: b.id, status: 'ok' }));
  weighings.forEach(w => events.push({ id: `weigh-${w.id}`, type: 'weighing', time: `${w.date || ''} ${w.time || ''}`, label: `${w.type}: ${w.vehicleNumber || ''}`, orderId: w.orderId, status: 'ok' }));
  ttn.forEach(t => events.push({ id: `ttn-${t.id}`, type: 'ttn', time: t.date, label: `ТТН ${t.number}`, orderId: t.orderId, status: t.status === 'blocked' ? 'block' : 'ok' }));
  audit.filter(a => ['block_ttn', 'unblock_ttn', 'payment_check'].includes(a.action)).forEach(a => events.push({ id: `audit-${a.id}`, type: 'audit', time: a.createdAt, label: a.action, orderId: a.entityId, status: 'ok' }));
  passports.forEach(p => events.push({ id: `passport-${p.id}`, type: 'passport', time: p.date, label: `Паспорт ${p.mark}`, batchId: p.batchId, status: 'ok' }));
  events.sort((a, b) => new Date(b.time) - new Date(a.time));
  return events.slice(0, Math.min(limit || 20, 50));
}

async function search(q) {
  if (!q || String(q).trim().length < 2) return { orders: [], weighings: [], ttn: [], clients: [] };
  const lower = String(q).trim().toLowerCase();
  const [ob, oz, w, t, c] = await Promise.all([
    load('orders_beton.json'),
    load('orders_zbi.json'),
    load('weighings.json'),
    load('ttn.json'),
    load('clients.json'),
  ]);
  const ordersBeton = Array.isArray(ob) ? ob : [];
  const ordersZbi = Array.isArray(oz) ? oz : [];
  const weighings = Array.isArray(w) ? w : [];
  const ttn = Array.isArray(t) ? t : [];
  const clients = Array.isArray(c) ? c : [];
  const match = (obj, fields) => fields.some(f => (obj[f] != null && String(obj[f]).toLowerCase().includes(lower)));
  const orders = [
    ...ordersBeton.filter(o => match(o, ['id', 'clientName', 'mark'])).map(o => ({ ...o, type: 'beton' })),
    ...ordersZbi.filter(o => match(o, ['id', 'clientName', 'productType', 'productSize'])).map(o => ({ ...o, type: 'zbi' })),
  ];
  return {
    orders,
    weighings: weighings.filter(w => match(w, ['id', 'vehicleNumber', 'driver', 'orderId'])),
    ttn: ttn.filter(t => match(t, ['number', 'clientName', 'vehicleNumber', 'orderId'])),
    clients: clients.filter(c => match(c, ['name', 'inn', 'contactPerson'])),
  };
}

function jsonFile(name) {
  const file = name.replace(/\//g, '_').replace(/\?.*/, '');
  const map = {
    clients: 'clients.json',
    orders_beton: 'orders_beton.json',
    orders_zbi: 'orders_zbi.json',
    weighings: 'weighings.json',
    'production_rbu-batches': 'rbu_batches.json',
    'production_armo-carcasses': 'armo_carcasses.json',
    'production_zbi-production': 'zbi_production.json',
    'production_transfer-beton': 'transfer_beton.json',
    'production_crusher-log': 'crusher_log.json',
    'warehouse_inert': 'warehouse_inert.json',
    'warehouse_metal': 'warehouse_metal.json',
    'warehouse_zbi': 'warehouse_zbi.json',
    'warehouse_scrap-metal': 'scrap_metal.json',
    'warehouse_inventory': 'inventory.json',
    'warehouse_spares': 'warehouse_spares.json',
    'logistics_ttn': 'ttn.json',
    'logistics_concrete-returns': 'concrete_returns.json',
    'logistics_realization': 'realization.json',
    'logistics_dispatch-queue': 'dispatch_queue.json',
    maintenance: 'maintenance.json',
    'quality_passports': 'quality_passports.json',
    'quality_reclamations': 'reclamations.json',
    recipes: 'recipes.json',
    'repair-requests': 'repair_requests.json',
    audit: 'audit_log.json',
  };
  return map[file] || `${file}.json`;
}

async function staticRequest(path) {
  const clean = path.replace(/^\/+/, '').split('?')[0];
  if (clean.startsWith('analytics/operational')) {
    const date = new URLSearchParams(path.split('?')[1] || '').get('date') || '';
    return computeOperational(date);
  }
  if (clean === 'analytics/financial') return computeFinancial();
  if (clean === 'analytics/technical') return computeTechnical();
  if (clean === 'analytics/quality') return computeQuality();
  if (clean.startsWith('analytics/capacity')) {
    const date = new URLSearchParams(path.split('?')[1] || '').get('date') || '';
    return computeCapacity(date);
  }
  if (clean === 'events') {
    const limit = new URLSearchParams(path.split('?')[1] || '').get('limit') || 20;
    return computeEvents(Number(limit));
  }
  if (clean === 'search') {
    const q = new URLSearchParams(path.split('?')[1] || '').get('q') || '';
    return search(q);
  }
  const parts = clean.split('/').filter(Boolean);
  let file = parts.join('_') + '.json';
  if (parts[0] === 'orders') file = parts[1] === 'beton' ? 'orders_beton.json' : (parts[1] === 'shift-plans' ? 'shift_plans.json' : 'orders_zbi.json');
  else if (parts[0] === 'production') file = { 'rbu-batches': 'rbu_batches.json', 'armo-carcasses': 'armo_carcasses.json', 'zbi-production': 'zbi_production.json', 'transfer-beton': 'transfer_beton.json', 'crusher-log': 'crusher_log.json' }[parts[1]] || 'rbu_batches.json';
  else if (parts[0] === 'warehouse') file = { inert: 'warehouse_inert.json', metal: 'warehouse_metal.json', zbi: 'warehouse_zbi.json', 'scrap-metal': 'scrap_metal.json', inventory: 'inventory.json', spares: 'warehouse_spares.json' }[parts[1]] || 'warehouse_metal.json';
  else if (parts[0] === 'logistics') file = { ttn: 'ttn.json', 'concrete-returns': 'concrete_returns.json', realization: 'realization.json', 'dispatch-queue': 'dispatch_queue.json' }[parts[1]] || 'ttn.json';
  else if (parts[0] === 'quality') file = parts[1] === 'passports' ? 'quality_passports.json' : 'reclamations.json';
  else if (parts[0] === 'clients' && parts[1]) {
    const list = await load('clients.json', []);
    const arr = Array.isArray(list) ? list : [];
    return arr.find(c => c.id === parts[1] || c.name === parts[1]) || null;
  }
  else if (parts[0] === 'weighings' && parts[1]) {
    const list = await load('weighings.json', []);
    const arr = Array.isArray(list) ? list : [];
    return arr.find(w => w.id === parts[1]) || null;
  }
  return load(file, []);
}

export const staticApi = {
  request: staticRequest,
  noop,
};
