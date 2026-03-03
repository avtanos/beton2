import React, { useState, useEffect } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';

export default function RepairRequests() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ equipment: 'crusher', priority: 'normal', reason: '' });

  useEffect(() => {
    api.repairRequests.list().then(setItems).catch(() => setItems([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.repairRequests.create(form);
      setShowForm(false);
      api.repairRequests.list().then(setItems);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">Заявки на ремонт</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : '+ Новая заявка'}
        </button>
      </div>
      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label>Оборудование</label>
                <select value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}>
                  <option value="crusher">Дробилка</option>
                  <option value="rbu">РБУ</option>
                </select>
              </div>
              <div className="form-group">
                <label>Приоритет</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="normal">Обычный</option>
                  <option value="high">Высокий</option>
                  <option value="urgent">Срочный</option>
                </select>
              </div>
              <div className="form-group">
                <label>Причина</label>
                <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Создать</button>
          </form>
        </div>
      )}
      <DataTable
        columns={[
          { key: 'equipment', label: 'Оборудование' },
          { key: 'priority', label: 'Приоритет' },
          { key: 'reason', label: 'Причина' },
          { key: 'status', label: 'Статус', render: v => {
        const labels = { open: 'Открыта', in_progress: 'В работе', closed: 'Закрыта' };
        return labels[v] ?? v;
      } },
          { key: 'assignedTo', label: 'Исполнитель' },
        ]}
        data={items}
        renderActions={row => (
          <button className="btn btn-secondary" onClick={() => api.repairRequests.update(row.id, { status: 'closed' }).then(() => api.repairRequests.list().then(setItems))}>Закрыть</button>
        )}
        emptyMessage="Нет заявок"
      />
    </div>
  );
}
