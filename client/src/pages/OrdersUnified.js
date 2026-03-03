import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import DataTable from '../components/DataTable';

export default function OrdersUnified() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [ttnList, setTtnList] = useState([]);
  const [filters, setFilters] = useState({ product: '', status: '', client: '', focus: '' });

  useEffect(() => {
    Promise.all([
      api.orders.beton.list().catch(() => []),
      api.orders.zbi.list().catch(() => []),
      api.clients.list().catch(() => []),
      api.logistics.ttn.list().catch(() => []),
    ]).then(([b, z, c, t]) => {
      const merged = [
        ...(b || []).map(o => ({ ...o, productType: 'beton', productLabel: `${o.mark || ''} ${o.volume || 0}м³` })),
        ...(z || []).map(o => ({ ...o, productType: 'zbi', productLabel: `${o.productType || ''} ${o.productSize || ''} x${o.quantity || 0}` })),
      ];
      setOrders(merged.sort((a, b) => (b.scheduledDate || '').localeCompare(a.scheduledDate || '')));
      setClients(c || []);
      setTtnList(t || []);
    });
  }, []);

  const getTtnForOrder = (orderId) => ttnList.filter(t => t.orderId === orderId);
  const getDeviation = (o) => o.volume && o.weightNet ? (Math.abs((o.volume * 2.4 - o.weightNet) / (o.volume * 2.4) * 100)).toFixed(2) : null;
  const hasPassport = (o) => true; // placeholder

  let filtered = orders;
  if (filters.product) filtered = filtered.filter(o => o.productType === filters.product);
  if (filters.status) filtered = filtered.filter(o => (o.status || 'new') === filters.status);
  if (filters.client) filtered = filtered.filter(o => (o.clientName || '').toLowerCase().includes(filters.client.toLowerCase()));
  if (filters.focus === 'discrepancy') filtered = filtered.filter(o => parseFloat(getDeviation(o) || 0) > 2);
  if (filters.focus === 'no_passport') filtered = filtered.filter(o => !hasPassport(o));
  if (filters.focus === 'no_payment') filtered = filtered.filter(o => !o.paymentChecked);

  const columns = [
    { key: 'id', label: 'Заказ', render: (v, r) => (
      <div><b>#{v?.slice(-6)}</b><div className="t" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.scheduledDate || r.createdAt?.slice(0, 10)} · смена</div></div>
    )},
    { key: 'clientName', label: 'Клиент / продукт', render: (v, r) => `${v || ''} · ${r.productLabel || ''}` },
    { key: 'volume', label: 'Объём', render: (v, r) => r.productType === 'beton' ? `${v || 0} м³` : r.quantity || '—' },
    { key: 'paymentChecked', label: 'Оплата/лимит', render: v => v ? <span className="badge ok">Разрешено</span> : <span className="badge warn">Лимит</span> },
    { key: 'deviation', label: 'Сверка', render: (_, r) => {
      const dev = getDeviation(r);
      const bad = dev && parseFloat(dev) > 2;
      return dev ? <span className={`badge ${bad ? 'danger' : 'ok'}`}>{dev}%</span> : <span className="badge ok">0%</span>;
    }},
    { key: 'documents', label: 'Документы', render: (_, r) => {
      const ttn = getTtnForOrder(r.id);
      const blocked = ttn.some(t => t.status === 'blocked');
      return (
        <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <span className={`badge ${blocked ? 'danger' : 'ok'}`}>{blocked ? 'ТТН: блок' : 'ТТН'}</span>
          <span className="badge">Акт</span>
          <span className="badge warn">Паспорт</span>
        </span>
      );
    }},
  ];

  return (
    <div>
      <h1 className="page-title">Заказы и отгрузки</h1>
      <p className="page-sub">Лента заказов + карточка заказа с рейсами/замесами/сверкой/документами/финансами.</p>

      <div className="filters">
        <div className="field">
          <label>Период</label>
          <div className="control">📅
            <select value={filters.period || ''} onChange={e => setFilters(f => ({ ...f, period: e.target.value }))}>
              <option>Смена</option><option>Сутки</option><option>Неделя</option><option>Произвольный</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Статус</label>
          <div className="control">🏷️
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">Все</option><option value="new">В работе</option><option value="confirmed">Отгружено</option><option value="cancelled">Отменён</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Контрагент</label>
          <div className="control">🧾
            <input placeholder="например: ОсОО &quot;Строй-Сити&quot;" value={filters.client} onChange={e => setFilters(f => ({ ...f, client: e.target.value }))} />
          </div>
        </div>
        <div className="field">
          <label>Фокус</label>
          <div className="control">⚠️
            <select value={filters.focus} onChange={e => setFilters(f => ({ ...f, focus: e.target.value }))}>
              <option value="">Обычный режим</option><option value="discrepancy">Требует внимания (&gt;2%)</option><option value="no_passport">Без паспорта</option><option value="no_payment">Без оплаты</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <b>Лента заказов</b>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge">Всего: {filtered.length}</span>
            <span className="mini primary" onClick={() => navigate('/orders-beton')}>＋ Новый заказ</span>
          </div>
        </div>
        <div className="card-bd">
          <DataTable
            columns={columns}
            data={filtered}
            filters={null}
            renderActions={row => (
              <span className="td-actions">
                <span className="mini primary" onClick={() => navigate(`/order/${row.productType}/${row.id}`)}>Открыть</span>
                <span className="mini" onClick={() => navigate(`/order/${row.productType}/${row.id}`)}>Рейсы</span>
                {parseFloat(getDeviation(row) || 0) > 2 && (
                  <span className="mini danger" onClick={() => navigate(`/order/${row.productType}/${row.id}`)}>Разблокировать</span>
                )}
              </span>
            )}
            emptyMessage="Нет заказов"
          />
        </div>
      </div>
    </div>
  );
}
