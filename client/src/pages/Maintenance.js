import React, { useState, useEffect } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';

export default function Maintenance() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ equipment: '', type: '' });
  const [form, setForm] = useState({ equipment: 'crusher', type: 'planned', description: '', date: new Date().toISOString().slice(0, 10), duration: '', downtime: 0, performedBy: '' });

  useEffect(() => {
    api.maintenance.list().then(setItems).catch(() => setItems([]));
  }, []);

  const filteredItems = items.filter(i => {
    if (filters.equipment && i.equipment !== filters.equipment) return false;
    if (filters.type && i.type !== filters.type) return false;
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.maintenance.create(form);
      setShowForm(false);
      api.maintenance.list().then(setItems);
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = [
    { key: 'date', label: 'Дата' },
    { key: 'equipment', label: 'Оборудование' },
    { key: 'type', label: 'Тип' },
    { key: 'description', label: 'Описание' },
    { key: 'duration', label: 'Длительность', render: v => v ? `${v} ч` : '—' },
    { key: 'downtime', label: 'Простой', render: v => v ? `${v} ч` : '—' },
    { key: 'performedBy', label: 'Исполнитель' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">ТОиР (В1)</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : '+ Новое ТО'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label>Оборудование</label>
                <select value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}>
                  <option value="crusher">Дробилка</option>
                  <option value="rbu">РБУ</option>
                  <option value="mixer">Миксер</option>
                  <option value="armature">Арматурный цех</option>
                </select>
              </div>
              <div className="form-group">
                <label>Тип</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="planned">Плановое</option>
                  <option value="emergency">Аварийное</option>
                </select>
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <div className="form-group">
                <label>Дата</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Длительность (ч)</label>
                <input type="number" step="0.5" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Простой (ч)</label>
                <input type="number" value={form.downtime} onChange={e => setForm(f => ({ ...f, downtime: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Исполнитель</label>
                <input value={form.performedBy} onChange={e => setForm(f => ({ ...f, performedBy: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Сохранить</button>
          </form>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredItems}
        filters={
          <>
            <select value={filters.equipment} onChange={e => setFilters(f => ({ ...f, equipment: e.target.value }))}>
              <option value="">Всё оборудование</option>
              <option value="crusher">Дробилка</option>
              <option value="rbu">РБУ</option>
              <option value="mixer">Миксер</option>
              <option value="armature">Арматурный цех</option>
            </select>
            <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
              <option value="">Все типы</option>
              <option value="planned">Плановое</option>
              <option value="emergency">Аварийное</option>
            </select>
          </>
        }
        renderActions={row => (
          <button className="btn btn-secondary">Детали</button>
        )}
        emptyMessage="Нет записей"
      />
    </div>
  );
}
