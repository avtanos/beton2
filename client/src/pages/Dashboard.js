import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Dashboard({ period: propPeriod }) {
  const navigate = useNavigate();
  const [operational, setOperational] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [technical, setTechnical] = useState(null);
  const [quality, setQuality] = useState(null);
  const [capacity, setCapacity] = useState(null);
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState(propPeriod || new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setDate(propPeriod || new Date().toISOString().slice(0, 10));
  }, [propPeriod]);

  useEffect(() => {
    const d = date || new Date().toISOString().slice(0, 10);
    api.analytics.operational(d).then(setOperational).catch(() => setOperational({}));
    api.analytics.financial().then(setFinancial).catch(() => setFinancial({}));
    api.analytics.technical().then(setTechnical).catch(() => setTechnical({}));
    api.analytics.quality().then(setQuality).catch(() => setQuality({}));
    api.analytics.capacity(d).then(setCapacity).catch(() => setCapacity({}));
    api.events.list(20).then(setEvents).catch(() => setEvents([]));
  }, [date]);

  const discrepancyCrit = operational?.discrepancyCritical;
  const risks = operational?.risks || [];

  return (
    <div>
      <h1 className="page-title">Оперативный дашборд</h1>
      <p className="page-sub">Один экран: KPI смены/суток, лента событий, топ-риски, очередь под РБУ, контроль расхождений и "без документов".</p>

      <div className="grid">
        <div className="card stat-card" style={{ gridColumn: 'span 3' }}>
          <div className="card-hd"><b>Отгрузка</b><span className={`badge ${!discrepancyCrit ? 'ok' : ''}`}>{!discrepancyCrit ? 'ОК' : '—'}</span></div>
          <div className="card-bd">
            <div className="kpi">
              <div>
                <div className="v">{operational?.rbuVolume ?? operational?.shipments?.weight ?? '—'} {operational?.rbuVolume ? 'м³' : 'кг'}</div>
                <div className="t">за смену</div>
              </div>
            </div>
            <button className="link-btn" style={{ marginTop: '0.25rem' }} onClick={() => navigate('/logistics')}>Разобрать</button>
          </div>
        </div>
        <div className="card stat-card" style={{ gridColumn: 'span 3' }}>
          <div className="card-hd"><b>Рейсы</b><span className="badge">факт</span></div>
          <div className="card-bd">
            <div className="kpi">
              <div>
                <div className="v">{operational?.shipments?.count ?? '—'}</div>
                <div className="t">машин</div>
              </div>
              <div className="badge">{operational?.queueAvgWait ? `средн. ${operational.queueAvgWait} мин` : '—'}</div>
            </div>
          </div>
        </div>
        <div className={`card stat-card ${discrepancyCrit ? 'status-critical' : ''}`} style={{ gridColumn: 'span 3' }}>
          <div className="card-hd"><b>Расхождения</b><span className={`badge ${discrepancyCrit ? 'danger' : ''}`}>{discrepancyCrit ? '>2%' : 'OK'}</span></div>
          <div className="card-bd">
            <div className="kpi">
              <div>
                <div className="v">{operational?.blockedTtnCount ?? (discrepancyCrit ? '4' : '0')}</div>
                <div className="t">заказа требуют сверки</div>
              </div>
              <span className="mini danger" onClick={() => navigate('/orders')}>Разобрать</span>
            </div>
          </div>
        </div>
        <div className="card stat-card" style={{ gridColumn: 'span 3' }}>
          <div className="card-hd"><b>Дебиторка</b><span className="badge warn">Внимание</span></div>
          <div className="card-bd">
            <div className="kpi">
              <div>
                <div className="v">{(financial?.totalDebt ?? 0) / 1000 > 0 ? `${((financial?.totalDebt ?? 0) / 1e6).toFixed(2)} млн` : (financial?.totalDebt ?? '—')}</div>
                <div className="t">сумма ДЗ</div>
              </div>
              <span className="mini warn" onClick={() => navigate('/debt')}>Топ-должники</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 8' }}>
          <div className="card-hd"><b>Лента событий</b><span className="badge">последние 20</span></div>
          <div className="card-bd">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Время</th>
                  <th>Событие</th>
                  <th style={{ width: 140 }}>Связь</th>
                  <th style={{ width: 100 }}>Статус</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 20).map((e, i) => (
                  <tr key={i}>
                    <td>{e.time || '—'}</td>
                    <td>{e.label}</td>
                    <td>{e.orderId ? <span className="badge">Order #{e.orderId?.slice(-6)}</span> : e.batchId ? <span className="badge">Batch #{e.batchId}</span> : '—'}</td>
                    <td><span className={`badge ${e.status === 'ok' ? 'ok' : e.status === 'block' ? 'danger' : ''}`}>{e.status === 'ok' ? 'ОК' : e.status === 'block' ? 'Блок' : '—'}</span></td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Нет событий</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="card-hd"><b>Топ-риски</b><span className="badge">контроль</span></div>
          <div className="card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {discrepancyCrit && (
              <div className="card" style={{ background: 'rgba(255,107,107,0.1)', borderColor: 'rgba(255,107,107,0.22)' }}>
                <div className="card-bd">
                  <b>Расхождение >2%</b>
                  <div className="page-sub" style={{ margin: '6px 0 0' }}>{(operational?.blockedTtnCount || 4)} заказа — ТТН заблокированы</div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="mini danger" onClick={() => navigate('/orders')}>Открыть список</span>
                  </div>
                </div>
              </div>
            )}
            {risks.map((r, i) => (
              <div key={i} className="card" style={{ background: r.severity === 'critical' ? 'rgba(255,107,107,0.1)' : 'rgba(255,204,102,0.1)', borderColor: r.severity === 'critical' ? 'rgba(255,107,107,0.22)' : 'rgba(255,204,102,0.2)' }}>
                <div className="card-bd">
                  <b>{r.label}</b>
                  {r.orderId && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <span className="mini primary" onClick={() => navigate(`/order/beton/${r.orderId}`)}>Карточка</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="card" style={{ background: 'rgba(17,100,102,0.12)', borderColor: 'rgba(255,203,154,0.18)' }}>
              <div className="card-bd">
                <b>Очередь под РБУ</b>
                <div className="page-sub" style={{ margin: '6px 0 0' }}>{(operational?.queueCount ?? 0)} машин · среднее ожидание {operational?.queueAvgWait ?? '—'} мин</div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <span className="mini primary" onClick={() => navigate('/rbu-shift')}>Открыть очередь</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
