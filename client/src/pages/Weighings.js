import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import DataTable from '../components/DataTable';

const TYPES = {
  tare: 'Тара (въезд)',
  brutto: 'Брутто (выезд)',
  receipt_inert: 'Приём инертных',
  receipt_cement: 'Приём цемента',
  receipt_metal: 'Приём металла',
};

const OP_LABELS = {
  tare: 'Тара',
  brutto: 'Отгрузка бетона',
  receipt_inert: 'Приход инертных',
  receipt_cement: 'Приход цемента',
  receipt_metal: 'Приход металла',
};

export default function Weighings() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', type: '', vehicleNumber: '' });
  const [form, setForm] = useState({ type: 'tare', vehicleNumber: '', driver: '', weight: '', tare: '', date: new Date().toISOString().slice(0, 10), time: '', material: '' });

  const load = () => {
    api.weighings.list(filters).then(setList).catch(() => setList([]));
  };

  useEffect(load, [filters.type, filters.dateFrom, filters.dateTo, filters.vehicleNumber]);

  const noLinkCount = list.filter(w => !w.orderId && ['tare', 'brutto'].includes(w.type)).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (form.type === 'brutto' && form.tare) {
        payload.tare = Number(form.tare);
        payload.netto = Number(form.weight) - Number(form.tare);
      }
      await api.weighings.create(payload);
      setForm({ type: 'tare', vehicleNumber: '', driver: '', weight: '', tare: '', date: new Date().toISOString().slice(0, 10), time: '', material: '' });
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = [
    { key: 'id', label: 'ID', render: v => v?.slice(-8) || '—' },
    { key: 'datetime', label: 'Дата/время', render: (_, r) => `${r.date || ''} ${r.time || ''}`.trim() },
    { key: 'vehicleNumber', label: 'Госномер' },
    { key: 'operation', label: 'Операция', render: (_, r) => OP_LABELS[r.type] || TYPES[r.type] || r.type },
    { key: 'tare', label: 'Тара', render: (_, r) => r.tare ?? (r.type === 'tare' ? r.weight : '—') },
    { key: 'brutto', label: 'Брутто', render: (_, r) => r.brutto ?? (r.type === 'brutto' || r.type?.startsWith('receipt') ? r.weight : '—') },
    { key: 'netto', label: 'Нетто', render: (_, r) => r.netto ?? (r.type === 'brutto' && r.tare ? (r.weight - r.tare) : (r.type === 'brutto' ? r.weight : '—')) },
    { key: 'link', label: 'Связь', render: (_, r) => r.orderId ? <span className="badge ok">Order #{r.orderId?.slice(-6)}</span> : (['tare','brutto'].includes(r.type) ? <span className="badge warn">нет привязки</span> : <span className="badge">Партия</span>) },
    { key: 'status', label: 'Статус', render: (_, r) => r.orderId ? <span className="badge ok">ОК</span> : (['tare','brutto'].includes(r.type) ? <span className="badge warn">ожидает</span> : <span className="badge ok">ОК</span>) },
  ];

  return (
    <div>
      <h1 className="page-title">Весовая (1С Весы)</h1>
      <p className="page-sub">Журнал взвешиваний: тара/брутто/нетто, привязка к заказу/контрагенту, статус синхронизации.</p>

      <div className="grid">
        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="card-hd"><b>Быстрые действия</b><span className="badge">оператор</span></div>
          <div className="card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="btn btn-primary" onClick={() => setShowForm(true)}>⚖️ Новое взвешивание</span>
            <span className="btn" onClick={load}>🔁 Повторить выгрузку</span>
            <span className="btn btn-warn" onClick={() => setShowForm(true)}>🚨 Без привязки ({noLinkCount})</span>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 8' }}>
          <div className="card-hd"><b>Журнал взвешиваний</b><span className="badge">синхронизация</span></div>
          <div className="card-bd">
            <DataTable
              columns={columns}
              data={list}
              filters={
                <div className="filters">
                  <div className="field"><label>С</label><div className="control"><input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} /></div></div>
                  <div className="field"><label>По</label><div className="control"><input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} /></div></div>
                  <div className="field"><label>Тип</label><div className="control"><select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}><option value="">Все</option>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div></div>
                  <div className="field"><label>Госномер</label><div className="control"><input placeholder="B1234KG" value={filters.vehicleNumber} onChange={e => setFilters(f => ({ ...f, vehicleNumber: e.target.value }))} /></div></div>
                </div>
              }
              renderActions={row => (
                <span className="mini primary" onClick={() => navigate(`/weighings/${row.id}`)}>Карточка</span>
              )}
              emptyMessage="Нет записей"
            />
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="card-hd"><b>Новое взвешивание</b><span className="mini" onClick={() => setShowForm(false)}>✕ Закрыть</span></div>
          <div className="card-bd">
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Тип</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Госномер</label>
                  <input value={form.vehicleNumber} onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value }))} placeholder="B1234KG" />
                </div>
                <div className="form-group">
                  <label>Водитель</label>
                  <input value={form.driver} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))} />
                </div>
                {form.type === 'tare' && (
                  <div className="form-group">
                    <label>Тара (кг)</label>
                    <input type="number" required value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
                  </div>
                )}
                {form.type === 'brutto' && (
                  <>
                    <div className="form-group">
                      <label>Тара (кг)</label>
                      <input type="number" value={form.tare} onChange={e => setForm(f => ({ ...f, tare: e.target.value }))} placeholder="12480" />
                    </div>
                    <div className="form-group">
                      <label>Брутто (кг)</label>
                      <input type="number" required value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
                    </div>
                  </>
                )}
                {!['tare','brutto'].includes(form.type) && (
                  <div className="form-group">
                    <label>Вес (кг)</label>
                    <input type="number" required value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
                  </div>
                )}
                <div className="form-group">
                  <label>Дата</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Время</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
                {['receipt_inert', 'receipt_cement', 'receipt_metal'].includes(form.type) && (
                  <div className="form-group">
                    <label>Материал</label>
                    <input value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} placeholder="песок, щебень, цемент..." />
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary">Сохранить</button>
              <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => setShowForm(false)}>Отмена</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
