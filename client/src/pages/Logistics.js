import React, { useState, useEffect } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';

export default function Logistics() {
  const [tab, setTab] = useState('ttn');
  const [ttn, setTtn] = useState([]);
  const [returns, setReturns] = useState([]);
  const [realization, setRealization] = useState([]);
  const [showTtnForm, setShowTtnForm] = useState(false);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', productType: '' });
  const [form, setForm] = useState({ clientName: '', productType: 'beton', mark: '', volume: '', weight: '', vehicleNumber: '', driver: '', date: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    api.logistics.ttn.list().then(setTtn).catch(() => setTtn([]));
    api.logistics.concreteReturns.list().then(setReturns).catch(() => setReturns([]));
    api.logistics.realization.list().then(setRealization).catch(() => setRealization([]));
  }, []);

  const filteredTtn = ttn.filter(t => {
    if (filters.dateFrom && t.date < filters.dateFrom) return false;
    if (filters.dateTo && t.date > filters.dateTo) return false;
    if (filters.productType && t.productType !== filters.productType) return false;
    return true;
  });

  const filteredReturns = returns.filter(r => {
    const d = r.date?.slice(0, 10) || '';
    if (filters.dateFrom && d < filters.dateFrom) return false;
    if (filters.dateTo && d > filters.dateTo) return false;
    return true;
  });

  const filteredRealization = realization.filter(r => {
    if (filters.dateFrom && r.date < filters.dateFrom) return false;
    if (filters.dateTo && r.date > filters.dateTo) return false;
    return true;
  });

  const handleTtnSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.logistics.ttn.create(form);
      setShowTtnForm(false);
      api.logistics.ttn.list().then(setTtn);
    } catch (err) {
      alert(err.message);
    }
  };

  const filtersBlock = (
    <>
      <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
      <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
      {tab === 'ttn' && (
        <select value={filters.productType} onChange={e => setFilters(f => ({ ...f, productType: e.target.value }))}>
          <option value="">Все типы</option>
          <option value="beton">Бетон</option>
          <option value="zbi">ЖБИ</option>
        </select>
      )}
    </>
  );

  return (
    <div>
      <h1 className="page-title">Логистика и отгрузки (Группа Г)</h1>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['ttn', 'returns', 'realization'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t)}>
            {t === 'ttn' && 'ТТН'}
            {t === 'returns' && 'Возвраты бетона'}
            {t === 'realization' && 'Реализация'}
          </button>
        ))}
      </div>

      {tab === 'ttn' && (
        <>
          <button className="btn btn-primary" style={{ marginBottom: '1rem' }} onClick={() => setShowTtnForm(true)}>+ Создать ТТН</button>
          {showTtnForm && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <form onSubmit={handleTtnSubmit}>
                <div className="grid-2">
                  <div className="form-group"><label>Клиент</label><input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} /></div>
                  <div className="form-group"><label>Тип</label><select value={form.productType} onChange={e => setForm(f => ({ ...f, productType: e.target.value }))}><option value="beton">Бетон</option><option value="zbi">ЖБИ</option></select></div>
                  <div className="form-group"><label>Марка</label><input value={form.mark} onChange={e => setForm(f => ({ ...f, mark: e.target.value }))} /></div>
                  <div className="form-group"><label>Объём (м³)</label><input type="number" value={form.volume} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))} /></div>
                  <div className="form-group"><label>Вес (кг)</label><input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} /></div>
                  <div className="form-group"><label>Госномер</label><input value={form.vehicleNumber} onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value }))} /></div>
                  <div className="form-group"><label>Водитель</label><input value={form.driver} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))} /></div>
                  <div className="form-group"><label>Дата</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
                </div>
                <button type="submit" className="btn btn-primary">Сохранить</button>
                <button type="button" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => setShowTtnForm(false)}>Отмена</button>
              </form>
            </div>
          )}
          <DataTable
            columns={[
              { key: 'number', label: 'Номер' },
              { key: 'date', label: 'Дата' },
              { key: 'clientName', label: 'Клиент' },
              { key: 'productType', label: 'Тип' },
              { key: 'volume', label: 'Объём', render: v => v ?? '—' },
              { key: 'vehicleNumber', label: 'Госномер' },
              { key: 'status', label: 'Статус', render: v => {
                const labels = { draft: 'Черновик', blocked: 'Заблокировано', confirmed: 'Подтверждён', sent: 'Отправлено', delivered: 'Доставлено' };
                return labels[v] ?? v;
              } },
            ]}
            data={filteredTtn}
            filters={filtersBlock}
            renderActions={row => (
              <>
                {row.status === 'blocked' && <button className="btn btn-primary" onClick={() => { const r = prompt('Причина разблокировки:'); if (r) api.logistics.ttn.unblock(row.id, { reason: r }).then(() => api.logistics.ttn.list().then(setTtn)); }}>Разблокировать</button>}
                <button className="btn btn-secondary">Печать</button>
              </>
            )}
            emptyMessage="Нет ТТН"
          />
        </>
      )}

      {tab === 'returns' && (
        <DataTable
          columns={[
            { key: 'date', label: 'Дата', render: v => v?.slice(0, 10) || '—' },
            { key: 'vehicleNumber', label: 'Госномер' },
            { key: 'volume', label: 'Объём' },
            { key: 'mark', label: 'Марка' },
            { key: 'disposition', label: 'Распоряжение' },
          ]}
          data={filteredReturns}
          filters={filtersBlock}
          emptyMessage="Нет возвратов"
        />
      )}

      {tab === 'realization' && (
        <DataTable
          columns={[
            { key: 'date', label: 'Дата' },
            { key: 'clientName', label: 'Клиент' },
            { key: 'amount', label: 'Сумма', render: v => v ? `${v} сом` : '—' },
            { key: 'paidAmount', label: 'Оплачено', render: v => v ? `${v} сом` : '—' },
            { key: 'debt', label: 'Долг', render: v => v ? `${v} сом` : '—' },
            { key: 'status', label: 'Статус', render: v => {
              const labels = { paid: 'Оплачено', partial: 'Частично оплачено', pending: 'Ожидает оплаты' };
              return labels[v] ?? v;
            } },
          ]}
          data={filteredRealization}
          filters={filtersBlock}
          renderActions={row => (
            <button className="btn btn-primary">Оплата</button>
          )}
          emptyMessage="Нет реализаций"
        />
      )}
    </div>
  );
}
