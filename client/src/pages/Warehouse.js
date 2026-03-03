import React, { useState, useEffect } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';

function MetalReceiptForm({ onSuccess }) {
  const [form, setForm] = useState({ supplier: 'ОсОО "Металл-Трейд"', batch: 'MT-41', weight: '18 300' });
  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.warehouse.metalReceipt({
      type: 'A500C',
      diameter: 12,
      weight: parseFloat(String(form.weight).replace(/\s/g, '')) / 1000,
      certificate: form.batch,
      documentRef: form.supplier,
    });
    setForm({ supplier: '', batch: '', weight: '' });
    onSuccess?.();
  };
  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label>Поставщик</label>
        <div className="control">🏷️
          <input placeholder='ОсОО "Металл-Трейд"' value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} />
        </div>
      </div>
      <div className="field" style={{ marginTop: 10 }}>
        <label>Партия</label>
        <div className="control">🧾
          <input placeholder="MT-41" value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value }))} />
        </div>
      </div>
      <div className="field" style={{ marginTop: 10 }}>
        <label>Вес (из весов)</label>
        <div className="control">⚖️
          <input placeholder="18 300" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="submit" className="mini primary">Провести приход</button>
        <span className="mini">Печать ордера</span>
      </div>
    </form>
  );
}

function MetalIssueForm({ onSuccess }) {
  const [form, setForm] = useState({ materialType: '', weight: '', documentRef: '' });
  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.warehouse.metalIssue(form);
    setForm({ materialType: '', weight: '', documentRef: '' });
    onSuccess?.();
  };
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div className="field"><label>Тип металла</label><div className="control"><input placeholder="A500C" value={form.materialType} onChange={e => setForm(f => ({ ...f, materialType: e.target.value }))} /></div></div>
      <div className="field"><label>Вес (кг)</label><div className="control"><input type="number" placeholder="840" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} /></div></div>
      <div className="field"><label>Документ</label><div className="control"><input placeholder="План JBI-21" value={form.documentRef} onChange={e => setForm(f => ({ ...f, documentRef: e.target.value }))} /></div></div>
      <button type="submit" className="btn btn-primary">Списать</button>
    </form>
  );
}

export default function Warehouse() {
  const [tab, setTab] = useState('metal');
  const [inert, setInert] = useState(null);
  const [metal, setMetal] = useState([]);
  const [zbi, setZbi] = useState([]);
  const [scrap, setScrap] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [spares, setSpares] = useState([]);

  useEffect(() => {
    api.warehouse.inert().then(setInert).catch(() => setInert(null));
    api.warehouse.metal().then(setMetal).catch(() => setMetal([]));
    api.warehouse.zbi().then(setZbi).catch(() => setZbi([]));
    api.warehouse.scrapMetal.list().then(setScrap).catch(() => setScrap([]));
    api.warehouse.inventory.list().then(setInventory).catch(() => setInventory([]));
    api.warehouse.spares().then(setSpares).catch(() => setSpares([]));
  }, []);

  const loadMetal = () => api.warehouse.metal().then(setMetal).catch(() => setMetal([]));

  const inertTableData = inert ? [
    { id: 'sand', material: 'Песок', quantity: inert.sand || 0, unit: 'т' },
    { id: 'screening', material: 'Отсев', quantity: inert.screening || 0, unit: 'т' },
    { id: 'fraction510', material: 'Щебень 5-10', quantity: inert.fraction510 || 0, unit: 'т' },
    { id: 'fraction2040', material: 'Щебень 20-40', quantity: inert.fraction2040 || 0, unit: 'т' },
  ] : [];

  return (
    <div>
      <h1 className="page-title">Склад металла</h1>
      <p className="page-sub">Остатки по партиям/сертификатам, приход (связь с весами), списание в производство, отходы/лом.</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['metal', 'inert', 'zbi', 'scrap', 'inventory', 'spares'].map(t => (
          <button key={t} className={`tabbtn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'metal' && 'Металл'}
            {t === 'inert' && 'Инертные'}
            {t === 'zbi' && 'ЖБИ'}
            {t === 'scrap' && 'Отходы'}
            {t === 'inventory' && 'Инвентаризация'}
            {t === 'spares' && 'Запчасти'}
          </button>
        ))}
      </div>

      {tab === 'metal' && (
        <div className="grid">
          <div className="card" style={{ gridColumn: 'span 4' }}>
            <div className="card-hd"><b>Приход металла</b><span className="badge">форма</span></div>
            <div className="card-bd">
              <MetalReceiptForm onSuccess={loadMetal} />
            </div>
          </div>
          <div className="card" style={{ gridColumn: 'span 8' }}>
            <div className="card-hd"><b>Остатки металла</b><span className="badge">партии/сертификаты</span></div>
            <div className="card-bd">
              <DataTable
                columns={[
                  { key: 'type', label: 'Номенклатура' },
                  { key: 'diameter', label: '⌀' },
                  { key: 'batch', label: 'Партия', render: () => 'MT-41' },
                  { key: 'certificate', label: 'Сертификат', render: (v) => v ? <span className="badge ok">прикреплён</span> : <span className="badge warn">нет</span> },
                  { key: 'weight', label: 'Остаток', render: v => v ? `${v} т` : '—' },
                  { key: 'location', label: 'Локация', render: () => 'Склад-1' },
                ]}
                data={metal}
                renderActions={() => <span className="mini">Карточка</span>}
                emptyMessage="Нет остатков"
              />
            </div>
          </div>
          <div className="card" style={{ gridColumn: 'span 12' }}>
            <div className="card-hd"><b>Списание в производство / Отходы</b><span className="badge">контроль</span></div>
            <div className="card-bd">
              <MetalIssueForm onSuccess={loadMetal} />
            </div>
          </div>
        </div>
      )}

      {tab === 'inert' && (
        <DataTable columns={[{ key: 'material', label: 'Материал' }, { key: 'quantity', label: 'Остаток', render: (v, r) => `${v ?? 0} ${r.unit || 'т'}` }]} data={inertTableData} emptyMessage="Нет данных" />
      )}
      {tab === 'zbi' && (
        <DataTable columns={[{ key: 'productType', label: 'Изделие' }, { key: 'productSize', label: 'Типоразмер' }, { key: 'quantity', label: 'Кол-во' }]} data={zbi} emptyMessage="Нет записей" />
      )}
      {tab === 'scrap' && (
        <DataTable columns={[{ key: 'date', label: 'Дата', render: v => v?.slice(0, 10) }, { key: 'weight', label: 'Вес (кг)' }, { key: 'disposition', label: 'Распоряжение' }]} data={scrap} emptyMessage="Нет записей" />
      )}
      {tab === 'spares' && (
        <DataTable columns={[{ key: 'name', label: 'Наименование' }, { key: 'article', label: 'Артикул' }, { key: 'quantity', label: 'Кол-во' }]} data={spares} emptyMessage="Нет записей" />
      )}
      {tab === 'inventory' && (
        <DataTable columns={[{ key: 'date', label: 'Дата', render: v => v?.slice(0, 10) }, { key: 'warehouse', label: 'Склад' }, { key: 'status', label: 'Статус', render: v => ({ in_progress: 'В процессе', completed: 'Завершена', planned: 'Запланирована' }[v] ?? v) }]} data={inventory} emptyMessage="Нет инвентаризаций" />
      )}
    </div>
  );
}
