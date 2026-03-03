import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import DataTable from '../components/DataTable';

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ prepayment: '' });
  const [form, setForm] = useState({ name: '', inn: '', address: '', contactPerson: '', phone: '', creditLimit: 0, prepaymentRequired: true });

  useEffect(() => {
    api.clients.list().then(setClients).catch(() => setClients([]));
  }, []);

  const filteredClients = clients.filter(c => {
    if (filters.prepayment === 'yes' && !c.prepaymentRequired) return false;
    if (filters.prepayment === 'no' && c.prepaymentRequired) return false;
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.clients.create(form);
      setForm({ name: '', inn: '', address: '', contactPerson: '', phone: '', creditLimit: 0, prepaymentRequired: true });
      setShowForm(false);
      api.clients.list().then(setClients);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить клиента?')) return;
    try {
      await api.clients.delete(id);
      api.clients.list().then(setClients);
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = [
    { key: 'name', label: 'Наименование' },
    { key: 'inn', label: 'ИНН' },
    { key: 'contactPerson', label: 'Контакт', render: (_, r) => `${r.contactPerson || ''} ${r.phone || ''}`.trim() },
    { key: 'creditLimit', label: 'Лимит', render: v => v ? `${v} сом` : '—' },
    { key: 'prepaymentRequired', label: 'Предоплата', render: v => v ? 'Да' : 'Нет' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">Клиенты</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : '+ Добавить клиента'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Новый клиент</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label>Наименование</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>ИНН</label>
                <input value={form.inn} onChange={e => setForm(f => ({ ...f, inn: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Адрес</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Контактное лицо</label>
                <input value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Телефон</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Кредитный лимит (сом)</label>
                <input type="number" value={form.creditLimit} onChange={e => setForm(f => ({ ...f, creditLimit: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={form.prepaymentRequired} onChange={e => setForm(f => ({ ...f, prepaymentRequired: e.target.checked }))} />
                  Предоплата обязательна
                </label>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Сохранить</button>
          </form>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredClients}
        filters={
          <select value={filters.prepayment} onChange={e => setFilters(f => ({ ...f, prepayment: e.target.value }))}>
            <option value="">Все</option>
            <option value="yes">С предоплатой</option>
            <option value="no">Без предоплаты</option>
          </select>
        }
        renderActions={row => (
          <>
            <button className="btn btn-primary" onClick={() => navigate(`/clients/${row.id}`)}>Карточка</button>
            <button className="btn btn-secondary" onClick={() => handleDelete(row.id)}>Удалить</button>
          </>
        )}
        emptyMessage="Нет клиентов"
      />
    </div>
  );
}
