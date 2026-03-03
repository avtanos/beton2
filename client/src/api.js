const API = process.env.REACT_APP_API || '';

async function request(path, options = {}) {
  const url = `${API}/api${path}`;
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch (err) {
    console.warn('API request failed:', path, err.message);
    throw new Error('Сервер недоступен. Запустите бэкенд: npm run server');
  }
  const data = res.ok ? await res.json() : null;
  if (!res.ok) {
    console.warn('API error:', path, res.status, data?.error || res.statusText);
    throw new Error(data?.error || res.statusText);
  }
  return data;
}

export const api = {
  clients: {
    list: () => request('/clients'),
    get: (id) => request(`/clients/${id}`),
    create: (body) => request('/clients', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/clients/${id}`, { method: 'DELETE' }),
  },
  orders: {
    beton: {
      list: () => request('/orders/beton'),
      create: (body) => request('/orders/beton', { method: 'POST', body: JSON.stringify(body) }),
      update: (id, body) => request(`/orders/beton/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
      checkPayment: (id) => request(`/orders/payment-check/${id}?type=beton`, { method: 'POST', body: JSON.stringify({}) }),
    },
    zbi: {
      list: () => request('/orders/zbi'),
      create: (body) => request('/orders/zbi', { method: 'POST', body: JSON.stringify(body) }),
      update: (id, body) => request(`/orders/zbi/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
      checkPayment: (id) => request(`/orders/payment-check/${id}?type=zbi`, { method: 'POST', body: JSON.stringify({}) }),
    },
    shiftPlans: {
      list: () => request('/orders/shift-plans'),
      create: (body) => request('/orders/shift-plans', { method: 'POST', body: JSON.stringify(body) }),
      update: (id, body) => request(`/orders/shift-plans/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    },
  },
  weighings: {
    list: (params) => request(`/weighings?${new URLSearchParams(params || {}).toString()}`),
    get: (id) => request(`/weighings/${id}`),
    create: (body) => request('/weighings', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/weighings/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  },
  production: {
    rbuBatches: {
      list: (params) => request(`/production/rbu-batches?${new URLSearchParams(params || {}).toString()}`),
      create: (body) => request('/production/rbu-batches', { method: 'POST', body: JSON.stringify(body) }),
    },
    armoCarcasses: {
      list: () => request('/production/armo-carcasses'),
      create: (body) => request('/production/armo-carcasses', { method: 'POST', body: JSON.stringify(body) }),
    },
    zbiProduction: {
      list: () => request('/production/zbi-production'),
      create: (body) => request('/production/zbi-production', { method: 'POST', body: JSON.stringify(body) }),
    },
    transferBeton: {
      list: () => request('/production/transfer-beton'),
      create: (body) => request('/production/transfer-beton', { method: 'POST', body: JSON.stringify(body) }),
    },
    crusherLog: {
      list: () => request('/production/crusher-log'),
      create: (body) => request('/production/crusher-log', { method: 'POST', body: JSON.stringify(body) }),
    },
  },
  warehouse: {
    inert: () => request('/warehouse/inert'),
    inertMovement: (body) => request('/warehouse/inert/movement', { method: 'POST', body: JSON.stringify(body) }),
    metal: () => request('/warehouse/metal'),
    metalReceipt: (body) => request('/warehouse/metal/receipt', { method: 'POST', body: JSON.stringify(body) }),
    metalIssue: (body) => request('/warehouse/metal/issue', { method: 'POST', body: JSON.stringify(body) }),
    zbi: () => request('/warehouse/zbi'),
    zbiCreate: (body) => request('/warehouse/zbi', { method: 'POST', body: JSON.stringify(body) }),
    zbiUpdate: (id, body) => request(`/warehouse/zbi/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    scrapMetal: {
      list: () => request('/warehouse/scrap-metal'),
      create: (body) => request('/warehouse/scrap-metal', { method: 'POST', body: JSON.stringify(body) }),
    },
    inventory: {
      list: () => request('/warehouse/inventory'),
      create: (body) => request('/warehouse/inventory', { method: 'POST', body: JSON.stringify(body) }),
    },
    spares: () => request('/warehouse/spares'),
  },
  logistics: {
    dispatchQueue: { list: () => request('/logistics/dispatch-queue'), create: (body) => request('/logistics/dispatch-queue', { method: 'POST', body: JSON.stringify(body) }) },
    ttn: {
      list: (params) => request(`/logistics/ttn?${new URLSearchParams(params || {}).toString()}`),
      create: (body) => request('/logistics/ttn', { method: 'POST', body: JSON.stringify(body) }),
      update: (id, body) => request(`/logistics/ttn/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
      unblock: (id, body) => request(`/logistics/ttn/${id}/unblock`, { method: 'POST', body: JSON.stringify(body) }),
    },
    concreteReturns: {
      list: () => request('/logistics/concrete-returns'),
      create: (body) => request('/logistics/concrete-returns', { method: 'POST', body: JSON.stringify(body) }),
    },
    realization: {
      list: (params) => request(`/logistics/realization?${new URLSearchParams(params || {}).toString()}`),
      create: (body) => request('/logistics/realization', { method: 'POST', body: JSON.stringify(body) }),
    },
  },
  maintenance: {
    list: () => request('/maintenance'),
    create: (body) => request('/maintenance', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  },
  quality: {
    passports: {
      list: (params) => request(`/quality/passports?${new URLSearchParams(params || {}).toString()}`),
      create: (body) => request('/quality/passports', { method: 'POST', body: JSON.stringify(body) }),
      update: (id, body) => request(`/quality/passports/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    },
    reclamations: {
      list: () => request('/quality/reclamations'),
      create: (body) => request('/quality/reclamations', { method: 'POST', body: JSON.stringify(body) }),
      update: (id, body) => request(`/quality/reclamations/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    },
  },
  analytics: {
    operational: (date) => request(`/analytics/operational?date=${date || ''}`),
    financial: () => request('/analytics/financial'),
    technical: () => request('/analytics/technical'),
    quality: () => request('/analytics/quality'),
    capacity: (date) => request(`/analytics/capacity?date=${date || ''}`),
  },
  search: { query: (q) => request(`/search?q=${encodeURIComponent(q || '')}`) },
  events: { list: (limit) => request(`/events?limit=${limit || 20}`) },
  audit: { list: (params) => request(`/audit?${new URLSearchParams(params || {}).toString()}`), create: (body) => request('/audit', { method: 'POST', body: JSON.stringify(body) }) },
  recipes: { list: () => request('/recipes'), create: (body) => request('/recipes', { method: 'POST', body: JSON.stringify(body) }) },
  repairRequests: { list: () => request('/repair-requests'), create: (body) => request('/repair-requests', { method: 'POST', body: JSON.stringify(body) }), update: (id, body) => request(`/repair-requests/${id}`, { method: 'PUT', body: JSON.stringify(body) }) },
};
