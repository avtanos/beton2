import React, { useState, useEffect } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';

export default function Quality() {
  const [tab, setTab] = useState('passports');
  const [passports, setPassports] = useState([]);
  const [reclamations, setReclamations] = useState([]);
  const [showPassportForm, setShowPassportForm] = useState(false);
  const [showReclamationForm, setShowReclamationForm] = useState(false);
  const [passportForm, setPassportForm] = useState({ mark: 'М100', slumpTest: '', cubeStrength7: '', cubeStrength28: '', date: new Date().toISOString().slice(0, 10), labAssistant: '', status: 'draft' });
  const [reclamationForm, setReclamationForm] = useState({ clientName: '', description: '', resolution: 'replacement', status: 'open' });
  const [filters, setFilters] = useState({ mark: '', status: '' });

  useEffect(() => {
    api.quality.passports.list().then(setPassports).catch(() => setPassports([]));
    api.quality.reclamations.list().then(setReclamations).catch(() => setReclamations([]));
  }, []);

  const filteredPassports = passports.filter(p => {
    if (filters.mark && p.mark !== filters.mark) return false;
    return true;
  });

  const filteredReclamations = reclamations.filter(r => {
    if (filters.status && r.status !== filters.status) return false;
    return true;
  });

  const handlePassportSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.quality.passports.create(passportForm);
      setShowPassportForm(false);
      api.quality.passports.list().then(setPassports);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReclamationSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.quality.reclamations.create(reclamationForm);
      setShowReclamationForm(false);
      api.quality.reclamations.list().then(setReclamations);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">Лаборатория / качество</h1>
      <p className="page-sub">Журнал проб, паспорта качества по BatchID/заказу, рекламации.</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button className={`btn ${tab === 'passports' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('passports')}>
          Паспорта качества
        </button>
        <button className={`btn ${tab === 'reclamations' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('reclamations')}>
          Рекламации
        </button>
      </div>

      {tab === 'passports' && (
        <>
          <button className="btn btn-primary" style={{ marginBottom: '1rem' }} onClick={() => setShowPassportForm(true)}>+ Паспорт качества</button>
          {showPassportForm && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <form onSubmit={handlePassportSubmit}>
                <div className="grid-2">
                  <div className="form-group"><label>Марка</label><select value={passportForm.mark} onChange={e => setPassportForm(f => ({ ...f, mark: e.target.value }))}>{['М100','М150','М200','М250','М300'].map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                  <div className="form-group"><label>Осадка конуса (см)</label><input type="number" value={passportForm.slumpTest} onChange={e => setPassportForm(f => ({ ...f, slumpTest: e.target.value }))} /></div>
                  <div className="form-group"><label>Прочность 7 сут (МПа)</label><input type="number" value={passportForm.cubeStrength7} onChange={e => setPassportForm(f => ({ ...f, cubeStrength7: e.target.value }))} /></div>
                  <div className="form-group"><label>Прочность 28 сут (МПа)</label><input type="number" value={passportForm.cubeStrength28} onChange={e => setPassportForm(f => ({ ...f, cubeStrength28: e.target.value }))} /></div>
                  <div className="form-group"><label>Дата</label><input type="date" value={passportForm.date} onChange={e => setPassportForm(f => ({ ...f, date: e.target.value }))} /></div>
                  <div className="form-group"><label>Лаборант</label><input value={passportForm.labAssistant} onChange={e => setPassportForm(f => ({ ...f, labAssistant: e.target.value }))} /></div>
                  <div className="form-group"><label>Статус</label><select value={passportForm.status} onChange={e => setPassportForm(f => ({ ...f, status: e.target.value }))}><option value="draft">Черновик</option><option value="issued">Выдан</option><option value="recalled">Отозван</option></select></div>
                </div>
                <button type="submit" className="btn btn-primary">Сохранить</button>
                <button type="button" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => setShowPassportForm(false)}>Отмена</button>
              </form>
            </div>
          )}
          <DataTable
            columns={[
              { key: 'date', label: 'Дата' },
              { key: 'mark', label: 'Марка' },
              { key: 'slumpTest', label: 'Осадка' },
              { key: 'cubeStrength7', label: 'Прочность 7' },
              { key: 'cubeStrength28', label: 'Прочность 28' },
              { key: 'labAssistant', label: 'Лаборант' },
              { key: 'status', label: 'Статус', render: v => {
        const s = v || 'draft';
        const labels = { draft: 'Черновик', issued: 'Выдан', recalled: 'Отозван' };
        return <span className={`badge badge-${s === 'issued' ? 'confirmed' : s === 'recalled' ? 'cancelled' : 'pending'}`}>{labels[s] || s}</span>;
      } },
            ]}
            data={filteredPassports}
            filters={
              <select value={filters.mark} onChange={e => setFilters(f => ({ ...f, mark: e.target.value }))}>
                <option value="">Все марки</option>
                {['М100','М150','М200','М250','М300'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            }
            renderActions={row => (
              <button className="btn btn-secondary">Печать</button>
            )}
            emptyMessage="Нет паспортов"
          />
        </>
      )}

      {tab === 'reclamations' && (
        <>
          <button className="btn btn-primary" style={{ marginBottom: '1rem' }} onClick={() => setShowReclamationForm(true)}>+ Рекламация</button>
          {showReclamationForm && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <form onSubmit={handleReclamationSubmit}>
                <div className="form-group"><label>Клиент</label><input value={reclamationForm.clientName} onChange={e => setReclamationForm(f => ({ ...f, clientName: e.target.value }))} /></div>
                <div className="form-group"><label>Описание</label><textarea value={reclamationForm.description} onChange={e => setReclamationForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
                <div className="form-group">
                  <label>Решение</label>
                  <select value={reclamationForm.resolution} onChange={e => setReclamationForm(f => ({ ...f, resolution: e.target.value }))}>
                    <option value="replacement">Замена</option>
                    <option value="recalculation">Перерасчёт</option>
                    <option value="rejection">Отказ</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">Сохранить</button>
                <button type="button" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => setShowReclamationForm(false)}>Отмена</button>
              </form>
            </div>
          )}
          <DataTable
            columns={[
              { key: 'createdAt', label: 'Дата', render: v => v?.slice(0, 10) || '—' },
              { key: 'clientName', label: 'Клиент' },
              { key: 'description', label: 'Описание' },
              { key: 'resolution', label: 'Решение' },
              { key: 'status', label: 'Статус', render: v => {
        const labels = { open: 'Открыта', resolved: 'Закрыта', closed: 'Закрыта', review: 'На рассмотрении' };
        return labels[v] ?? v;
      } },
            ]}
            data={filteredReclamations}
            filters={
              <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                <option value="">Все статусы</option>
                <option value="open">Открыта</option>
                <option value="resolved">Закрыта</option>
              </select>
            }
            renderActions={row => (
              row.status === 'open' ? <button className="btn btn-primary">Закрыть</button> : null
            )}
            emptyMessage="Нет рекламаций"
          />
        </>
      )}
    </div>
  );
}
