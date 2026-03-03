import React, { useState, useEffect } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';

export default function OrdersBeton() {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', mark: '', status: '' });
  const [form, setForm] = useState({
    clientId: '', clientName: '', mark: 'М100', volume: '', price: '', address: '', scheduledDate: '', notes: '',
  });

  useEffect(() => {
    api.orders.beton.list().then(setOrders).catch(() => setOrders([]));
    api.clients.list().then(setClients).catch(() => setClients([]));
  }, []);

  const filteredOrders = orders.filter(o => {
    if (filters.dateFrom && (o.scheduledDate || o.createdAt?.slice(0, 10) || '') < filters.dateFrom) return false;
    if (filters.dateTo && (o.scheduledDate || o.createdAt?.slice(0, 10) || '') > filters.dateTo) return false;
    if (filters.mark && o.mark !== filters.mark) return false;
    if (filters.status && (o.status || 'new') !== filters.status) return false;
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.orders.beton.create(form);
      setForm({ clientId: '', clientName: '', mark: 'М100', volume: '', price: '', address: '', scheduledDate: '', notes: '' });
      setShowForm(false);
      api.orders.beton.list().then(setOrders);
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePaymentCheck = async (id) => {
    try {
      await api.orders.beton.checkPayment(id);
      api.orders.beton.list().then(setOrders);
    } catch (err) {
      alert(err.message);
    }
  };

  const marks = ['М100', 'М150', 'М200', 'М250', 'М300', 'М350'];

  const columns = [
    { key: 'scheduledDate', label: 'Дата', render: (_, r) => r.scheduledDate || r.createdAt?.slice(0, 10) },
    { key: 'clientName', label: 'Клиент' },
    { key: 'mark', label: 'Марка' },
    { key: 'volume', label: 'Объём', render: v => v ? `${v} м³` : '—' },
    { key: 'price', label: 'Цена', render: v => v ? `${v} сом` : '—' },
    { key: 'status', label: 'Статус', render: (_, r) => {
      const s = r.status || 'new';
      const labels = { new: 'Новый', confirmed: 'Подтверждён', cancelled: 'Отменён' };
      return (
        <span className={`badge badge-${s === 'cancelled' ? 'cancelled' : s === 'confirmed' ? 'confirmed' : 'new'}`}>
          {labels[s] || s}
        </span>
      );
    } },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">Заказы на бетон (A1)</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : '+ Новый заказ'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Новый заказ на бетон</h3>
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
                <label>Марка бетона</label>
                <select value={form.mark} onChange={e => setForm(f => ({ ...f, mark: e.target.value }))}>
                  {marks.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Объём (м³)</label>
                <input type="number" step="0.1" required value={form.volume} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Цена (сом)</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Адрес доставки</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
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
            <input type="date" placeholder="От" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
            <input type="date" placeholder="До" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
            <select value={filters.mark} onChange={e => setFilters(f => ({ ...f, mark: e.target.value }))}>
              <option value="">Все марки</option>
              {marks.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">Все статусы</option>
              <option value="new">Новый</option>
              <option value="confirmed">Подтверждён</option>
              <option value="cancelled">Отменён</option>
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
