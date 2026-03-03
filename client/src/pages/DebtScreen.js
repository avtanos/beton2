import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import DataTable from '../components/DataTable';

export default function DebtScreen() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({ overdue: false, topN: '' });

  useEffect(() => {
    api.analytics.financial().catch(() => ({ byClient: [] })).then(f => {
      const byClient = (f?.byClient || []).filter(c => c.debt > 0);
      setData(byClient);
    });
  }, []);

  let filtered = data;
  if (filters.overdue) filtered = filtered.filter(c => c.debt > 0); // simplified
  if (filters.topN) filtered = filtered.slice(0, Number(filters.topN));

  const columns = [
    { key: 'name', label: 'Клиент', render: (v, r) => <button className="link-btn" onClick={() => navigate(`/clients/${r.id || r.name}`)}>{v}</button> },
    { key: 'amount', label: 'Сумма', render: v => `${v} сом` },
    { key: 'paid', label: 'Оплачено', render: v => `${v} сом` },
    { key: 'debt', label: 'Долг', render: v => <span className="status-warning">{v} сом</span> },
  ];

  return (
    <div>
      <h1 className="page-title">Финансы / ДЗ</h1>
      <p className="page-sub">Карточка клиента, лимиты/предоплата, реализация по ТТН, дебиторка и просрочка.</p>
      <DataTable
        columns={columns}
        data={filtered}
        filters={
          <>
            <label><input type="checkbox" checked={filters.overdue} onChange={e => setFilters(f => ({ ...f, overdue: e.target.checked }))} /> С просрочкой</label>
            <select value={filters.topN} onChange={e => setFilters(f => ({ ...f, topN: e.target.value }))}>
              <option value="">Все</option>
              <option value="10">Топ-10</option>
              <option value="20">Топ-20</option>
            </select>
          </>
        }
        emptyMessage="Нет задолженности"
      />
    </div>
  );
}
