import React, { useState, useEffect } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';

export default function RBUShift() {
  const [orders, setOrders] = useState([]);
  const [batches, setBatches] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState(1);

  useEffect(() => {
    Promise.all([
      api.orders.beton.list().catch(() => []),
      api.production.rbuBatches.list().catch(() => []),
      (api.recipes?.list?.() || Promise.resolve([])).catch(() => []),
    ]).then(([b, batchesData, r]) => {
      const betonDay = (b || []).filter(o => o.scheduledDate === date && o.status !== 'cancelled');
      setOrders(betonDay);
      setBatches(batchesData || []);
      setRecipes(r || []);
    });
  }, [date]);

  return (
    <div>
      <h1 className="page-title">РБУ (замесы / рецепты)</h1>
      <p className="page-sub">Сменное задание, журнал замесов, справочник рецептур с версиями.</p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="filters">
          <div className="field"><label>Дата</label><div className="control"><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div></div>
          <div className="field"><label>Смена</label><div className="control"><select value={shift} onChange={e => setShift(Number(e.target.value))}><option value={1}>Смена 1</option><option value={2}>Смена 2</option></select></div></div>
        </div>
      </div>

      <div className="grid">
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <div className="card-hd"><b>Сменное задание</b><span className="badge">очередь</span></div>
          <div className="card-bd">
            <table>
              <thead><tr><th>Время</th><th>Марка</th><th>Объём</th><th>Клиент</th><th>Статус</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}><td>{o.scheduledTime || o.scheduledDate || '—'}</td><td>{o.mark || '—'}</td><td>{o.volume ? `${o.volume} м³` : '—'}</td><td>{o.clientName || '—'}</td><td><span className="badge">в очереди</span></td></tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={5}>Нет заказов</td></tr>}
              </tbody>
            </table>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}><span className="mini primary">▶ Начать</span><span className="mini">⏸ Пауза</span><span className="mini">⏭ Следующий</span></div>
          </div>
        </div>
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <div className="card-hd"><b>Журнал замесов</b><span className="badge">BatchID</span></div>
          <div className="card-bd">
            <DataTable columns={[{ key: 'id', label: 'BatchID', render: v => v?.slice(-8) }, { key: 'date', label: 'Время' }, { key: 'mark', label: 'Марка' }, { key: 'recipeId', label: 'Рецепт' }, { key: 'volume', label: 'Объём', render: v => v ? `${v} м³` : '—' }, { key: 'dest', label: 'Назначение', render: (_, r) => r.orderId ? 'внешний' : 'ЖБ (внутр.)' }, { key: 'status', label: 'Статус', render: () => <span className="badge ok">передан</span> }]} data={batches} renderActions={() => <><span className="mini">Открыть</span><span className="mini">Состав</span></>} emptyMessage="Нет замесов" />
          </div>
        </div>
        <div className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card-hd"><b>Рецептуры</b><span className="badge">версии / права</span></div>
          <div className="card-bd">
            <DataTable columns={[{ key: 'id', label: 'Код' }, { key: 'mark', label: 'Марка' }, { key: 'version', label: 'Версия' }, { key: 'components', label: 'Компоненты', render: () => 'цемент · песок · щебень · вода · добавка' }, { key: 'status', label: 'Статус', render: () => <span className="badge ok">актуальная</span> }, { key: 'owner', label: 'Ответственный', render: () => 'Технолог' }]} data={recipes} renderActions={() => <><span className="mini">История</span><span className="mini warn">Новая версия</span></>} emptyMessage="Нет рецептур" />
          </div>
        </div>
      </div>
    </div>
  );
}
