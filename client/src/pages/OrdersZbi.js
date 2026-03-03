import React, { useState, useEffect } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';

export default function OrdersZbi() {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', source: '' });
  const [form, setForm] = useState({
    clientId: '', clientName: '', productType: '', productSize: '', quantity: '', price: '', source: 'production', scheduledDate: '', notes: '',
  });

  useEffect(() => {
    api.orders.zbi.list().then(setOrders).catch(() => setOrders([]));
    api.clients.list().then(setClients).catch(() => setClients([]));
  }, []);

  const filteredOrders = orders.filter(o => {
    if (filters.dateFrom && (o.scheduledDate || o.createdAt?.slice(0, 10) || '') < filters.dateFrom) return false;
    if (filters.dateTo && (o.scheduledDate || o.createdAt?.slice(0, 10) || '') > filters.dateTo) return false;
    if (filters.source && o.source !== filters.source) return false;
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.orders.zbi.create(form);
      setForm({ clientId: '', clientName: '', productType: '', productSize: '', quantity: '', price: '', source: 'production', scheduledDate: '', notes: '' });
      setShowForm(false);
      api.orders.zbi.list().then(setOrders);
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePaymentCheck = async (id) => {
    try {
      await api.orders.zbi.checkPayment(id);
      api.orders.zbi.list().then(setOrders);
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = [
    { key: 'scheduledDate', label: 'Дата', render: (_, r) => r.scheduledDate || r.createdAt?.slice(0, 10) },
    { key: 'clientName', label: 'Клиент' },
    { key: 'productType', label: 'Тип изделия' },
    { key: 'productSize', label: 'Типоразмер' },
    { key: 'quantity', label: 'Кол-во' },
    { key: 'price', label: 'Цена', render: v => v ? `${v} сом` : '—' },
    { key: 'source', label: 'Источник' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">Заказы на ЖБИ (A2)</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : '+ Новый заказ'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Новый заказ на ЖБИ</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label>Клиент</label>
                <select value={form.clientId} onChange={e => {
                  const c = clients.find(x => x.id === e.target.value);
                  setForm(f => ({ ...f, clientId: e.target.value, clientName: c?.name || '' }));
                }}>
                  <option value="">— Выберите —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Тип изделия</label>
                <input value={form.productType} onChange={e => setForm(f => ({ ...f, productType: e.target.value }))} placeholder="напр. ФБС" />
              </div>
              <div className="form-group">
                <label>Типоразмер</label>
                <input value={form.productSize} onChange={e => setForm(f => ({ ...f, productSize: e.target.value }))} placeholder="напр. 24-6-6" />
              </div>
              <div className="form-group">
                <label>Количество</label>
                <input type="number" required value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Цена (сом)</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Источник</label>
                <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                  <option value="production">Производство</option>
                  <option value="warehouse">Со склада</option>
                </select>
              </div>
              <div className="form-group">
                <label>Дата отгрузки</label>
                <input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Примечания</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <button type="submit" className="btn btn-primary">Создать заказ</button>
          </form>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredOrders}
        filters={
          <>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
            <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
            <select value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}>
              <option value="">Все источники</option>
              <option value="production">Производство</option>
              <option value="warehouse">Склад</option>
            </select>
          </>
        }
        renderActions={row => (
          <>
            {!row.paymentChecked && (
              <button className="btn btn-primary" onClick={() => handlePaymentCheck(row.id)}>Проверить</button>
            )}
            {row.paymentChecked && <span style={{ color: 'var(--success)' }}>✓</span>}
          </>
        )}
        emptyMessage="Нет заказов"
      />
    </div>
  );
}
