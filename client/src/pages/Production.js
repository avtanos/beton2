import React, { useState, useEffect } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';

export default function Production() {
  const [tab, setTab] = useState('rbu');
  const [rbuBatches, setRbuBatches] = useState([]);
  const [armoCarcasses, setArmoCarcasses] = useState([]);
  const [zbiProduction, setZbiProduction] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [crusherLogs, setCrusherLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '' });

  useEffect(() => {
    api.production.rbuBatches.list().then(setRbuBatches).catch(() => setRbuBatches([]));
    api.production.armoCarcasses.list().then(setArmoCarcasses).catch(() => setArmoCarcasses([]));
    api.production.zbiProduction.list().then(setZbiProduction).catch(() => setZbiProduction([]));
    api.production.transferBeton.list().then(setTransfers).catch(() => setTransfers([]));
    api.production.crusherLog.list().then(setCrusherLogs).catch(() => setCrusherLogs([]));
  }, []);

  const filtered = (data, dateKey = 'date') => data.filter(row => {
    const d = row[dateKey] || '';
    if (filters.dateFrom && d < filters.dateFrom) return false;
    if (filters.dateTo && d > filters.dateTo) return false;
    return true;
  });

  const loadForm = (type) => {
    if (type === 'rbu') setForm({ mark: 'М100', volume: '', date: new Date().toISOString().slice(0, 10), destination: 'external' });
    if (type === 'armo') setForm({ type: '', size: '', quantity: '', weight: '', date: new Date().toISOString().slice(0, 10) });
    if (type === 'zbi') setForm({ productType: '', productSize: '', quantity: '', date: new Date().toISOString().slice(0, 10) });
    if (type === 'transfer') setForm({ volume: '', mark: '', date: new Date().toISOString().slice(0, 10) });
    if (type === 'crusher') setForm({ date: new Date().toISOString().slice(0, 10), operatingHours: '', output510: 0, output2040: 0, outputScreening: 0, downtime: 0 });
  };

  const handleSubmit = async (e, createFn) => {
    e.preventDefault();
    try {
      await createFn(form);
      setShowForm(false);
      api.production.rbuBatches.list().then(setRbuBatches);
      api.production.armoCarcasses.list().then(setArmoCarcasses);
      api.production.zbiProduction.list().then(setZbiProduction);
      api.production.transferBeton.list().then(setTransfers);
      api.production.crusherLog.list().then(setCrusherLogs);
    } catch (err) {
      alert(err.message);
    }
  };

  const dateFilters = (
    <>
      <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
      <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
    </>
  );

  return (
    <div>
      <h1 className="page-title">Производство (Группа Б)</h1>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['rbu', 'armo', 'zbi', 'transfer', 'crusher'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTab(t); loadForm(t); }}>
            {t === 'rbu' && 'Замесы РБУ'}
            {t === 'armo' && 'Армокаркасы'}
            {t === 'zbi' && 'Производство ЖБИ'}
            {t === 'transfer' && 'Передача в ЖБ'}
            {t === 'crusher' && 'Дробилка'}
          </button>
        ))}
      </div>

      {tab === 'rbu' && (
        <>
          <button className="btn btn-primary" style={{ marginBottom: '1rem' }} onClick={() => { setShowForm(true); loadForm('rbu'); }}>+ Замес</button>
          {showForm && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <form onSubmit={e => handleSubmit(e, api.production.rbuBatches.create)}>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Марка</label>
                    <select value={form.mark} onChange={e => setForm(f => ({ ...f, mark: e.target.value }))}>
                      {['М100', 'М150', 'М200', 'М250', 'М300'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Объём (м³)</label>
                    <input type="number" step="0.1" required value={form.volume} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Дата</label>
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Направление</label>
                    <select value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}>
                      <option value="external">Внешний клиент</option>
                      <option value="zbi">ЖБ цех</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Сохранить</button>
                <button type="button" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => setShowForm(false)}>Отмена</button>
              </form>
            </div>
          )}
          <DataTable
            columns={[
              { key: 'date', label: 'Дата' },
              { key: 'mark', label: 'Марка' },
              { key: 'volume', label: 'Объём', render: v => v ? `${v} м³` : '—' },
              { key: 'destination', label: 'Направление' },
            ]}
            data={filtered(rbuBatches)}
            filters={dateFilters}
            emptyMessage="Нет замесов"
          />
        </>
      )}

      {tab === 'armo' && (
        <>
          <button className="btn btn-primary" style={{ marginBottom: '1rem' }} onClick={() => { setShowForm(true); loadForm('armo'); }}>+ Армокаркас</button>
          {showForm && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <form onSubmit={e => handleSubmit(e, api.production.armoCarcasses.create)}>
                <div className="grid-2">
                  <div className="form-group"><label>Тип</label><input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} /></div>
                  <div className="form-group"><label>Размер</label><input value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} /></div>
                  <div className="form-group"><label>Кол-во</label><input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} /></div>
                  <div className="form-group"><label>Вес (кг)</label><input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} /></div>
                </div>
                <button type="submit" className="btn btn-primary">Сохранить</button>
                <button type="button" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => setShowForm(false)}>Отмена</button>
              </form>
            </div>
          )}
          <DataTable
            columns={[
              { key: 'date', label: 'Дата' },
              { key: 'type', label: 'Тип' },
              { key: 'size', label: 'Размер' },
              { key: 'quantity', label: 'Кол-во' },
              { key: 'weight', label: 'Вес', render: v => v ? `${v} кг` : '—' },
            ]}
            data={filtered(armoCarcasses)}
            filters={dateFilters}
            emptyMessage="Нет записей"
          />
        </>
      )}

      {tab === 'zbi' && (
        <>
          <button className="btn btn-primary" style={{ marginBottom: '1rem' }} onClick={() => { setShowForm(true); loadForm('zbi'); }}>+ Производство ЖБИ</button>
          {showForm && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <form onSubmit={e => handleSubmit(e, api.production.zbiProduction.create)}>
                <div className="grid-2">
                  <div className="form-group"><label>Тип изделия</label><input value={form.productType} onChange={e => setForm(f => ({ ...f, productType: e.target.value }))} /></div>
                  <div className="form-group"><label>Типоразмер</label><input value={form.productSize} onChange={e => setForm(f => ({ ...f, productSize: e.target.value }))} /></div>
                  <div className="form-group"><label>Количество</label><input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} /></div>
                </div>
                <button type="submit" className="btn btn-primary">Сохранить</button>
                <button type="button" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => setShowForm(false)}>Отмена</button>
              </form>
            </div>
          )}
          <DataTable
            columns={[
              { key: 'date', label: 'Дата' },
              { key: 'productType', label: 'Тип изделия' },
              { key: 'productSize', label: 'Типоразмер' },
              { key: 'quantity', label: 'Количество' },
            ]}
            data={filtered(zbiProduction)}
            filters={dateFilters}
            emptyMessage="Нет записей"
          />
        </>
      )}

      {tab === 'transfer' && (
        <DataTable
          columns={[
            { key: 'date', label: 'Дата' },
            { key: 'volume', label: 'Объём', render: v => v ? `${v} м³` : '—' },
            { key: 'mark', label: 'Марка' },
          ]}
          data={filtered(transfers)}
          filters={dateFilters}
          emptyMessage="Нет передач"
        />
      )}

      {tab === 'crusher' && (
        <>
          <button className="btn btn-primary" style={{ marginBottom: '1rem' }} onClick={() => { setShowForm(true); loadForm('crusher'); }}>+ Запись</button>
          {showForm && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <form onSubmit={e => handleSubmit(e, api.production.crusherLog.create)}>
                <div className="grid-2">
                  <div className="form-group"><label>Дата</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
                  <div className="form-group"><label>Моточасы</label><input type="number" step="0.1" value={form.operatingHours} onChange={e => setForm(f => ({ ...f, operatingHours: e.target.value }))} /></div>
                  <div className="form-group"><label>Выход 5-10</label><input type="number" value={form.output510} onChange={e => setForm(f => ({ ...f, output510: e.target.value }))} /></div>
                  <div className="form-group"><label>Выход 20-40</label><input type="number" value={form.output2040} onChange={e => setForm(f => ({ ...f, output2040: e.target.value }))} /></div>
                  <div className="form-group"><label>Простой (ч)</label><input type="number" value={form.downtime} onChange={e => setForm(f => ({ ...f, downtime: e.target.value }))} /></div>
                </div>
                <button type="submit" className="btn btn-primary">Сохранить</button>
                <button type="button" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => setShowForm(false)}>Отмена</button>
              </form>
            </div>
          )}
          <DataTable
            columns={[
              { key: 'date', label: 'Дата' },
              { key: 'operatingHours', label: 'Моточасы' },
              { key: 'output510', label: 'Выход 5-10' },
              { key: 'output2040', label: 'Выход 20-40' },
              { key: 'downtime', label: 'Простой' },
            ]}
            data={filtered(crusherLogs)}
            filters={dateFilters}
            emptyMessage="Нет записей"
          />
        </>
      )}
    </div>
  );
}
