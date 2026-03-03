import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function OrderCard() {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [tab, setTab] = useState('summary');
  const [batches, setBatches] = useState([]);
  const [weighings, setWeighings] = useState([]);
  const [ttn, setTtn] = useState([]);
  const [unblockReason, setUnblockReason] = useState('');
  const [unblockComment, setUnblockComment] = useState('');

  useEffect(() => {
    const t = type || 'beton';
    const list = t === 'zbi' ? api.orders.zbi.list() : api.orders.beton.list();
    list.catch(() => []).then(orders => setOrder((orders || []).find(o => o.id === id) || null));
    api.production.rbuBatches.list().catch(() => []).then(b => setBatches((b || []).filter(x => x.orderId === id)));
    api.weighings.list({}).catch(() => []).then(w => setWeighings((w || []).filter(x => x.orderId === id)));
    api.logistics.ttn.list().catch(() => []).then(t => setTtn((t || []).filter(x => x.orderId === id)));
  }, [id, type]);

  if (!order) return <div className="card">Загрузка...</div>;

  const deviation = order.volume && order.weightNet
    ? (Math.abs((order.volume * 2.4 - order.weightNet) / (order.volume * 2.4) * 100)).toFixed(2)
    : '0';
  const isBlocked = parseFloat(deviation) > 2;

  const handleUnblock = async () => {
    if (!unblockReason || !unblockComment.trim()) {
      alert('Укажите причину и комментарий для разблокировки');
      return;
    }
    try {
      for (const t of ttn.filter(x => x.status === 'blocked')) {
        await api.logistics.ttn.update(t.id, { status: 'draft', unblockReason, unblockComment });
      }
      setTtn(prev => prev.map(t => t.status === 'blocked' ? { ...t, status: 'draft' } : t));
      setUnblockReason('');
      setUnblockComment('');
    } catch (e) {
      alert(e.message);
    }
  };

  const tabs = [
    { id: 'summary', label: '🧾 Сводка' },
    { id: 'weighings', label: '🚚 Рейсы' },
    { id: 'batches', label: '🏭 Замесы' },
    { id: 'reconciliation', label: '🧮 Сверка' },
    { id: 'documents', label: '📄 Документы' },
    { id: 'finance', label: '💰 Финансы' },
  ];

  return (
    <div>
      <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => navigate(-1)}>← Назад</button>
      <h1 className="page-title">Карточка заказа #{order.id?.slice(-6)}</h1>

      <div className="grid" style={{ marginTop: 12 }}>
        <div className="card" style={{ gridColumn: 'span 8' }}>
          <div className="card-hd"><b>Карточка заказа</b><span className="badge">Order #{order.id?.slice(-6)}</span></div>
          <div className="card-bd">
            <div className="tabs">
              <div className="tab-row">
                {tabs.map(t => (
                  <label key={t.id} className={`tabbtn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)} style={{ cursor: 'pointer' }}>
                    {t.label}
                  </label>
                ))}
              </div>

              {tab === 'summary' && (
                <div className="grid">
                  <div className="card" style={{ gridColumn: 'span 6' }}>
                    <div className="card-bd">
                      <div className="t" style={{ color: 'var(--text-muted)' }}>Клиент</div>
                      <div style={{ fontWeight: 800, marginTop: 2 }}>{order.clientName}</div>
                      <div className="t" style={{ color: 'var(--text-muted)', marginTop: 10 }}>Продукт</div>
                      <div style={{ fontWeight: 800, marginTop: 2 }}>
                        {order.productType === 'beton' ? `${order.mark} · ${order.volume} м³` : `${order.productType} ${order.productSize} x${order.quantity}`}
                      </div>
                    </div>
                  </div>
                  <div className="card" style={{ gridColumn: 'span 6' }}>
                    <div className="card-bd">
                      <div className="t" style={{ color: 'var(--text-muted)' }}>Статусы</div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className={`badge ${order.paymentChecked ? 'ok' : 'warn'}`}>{order.paymentChecked ? 'Оплата OK' : 'Лимит: проверка'}</span>
                        {isBlocked && <span className="badge danger">ТТН: блок</span>}
                        <span className="badge warn">Паспорт: нужен</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'weighings' && (
                <table>
                  <thead><tr><th>Рейс</th><th>Госномер</th><th>Тара</th><th>Брутто</th><th>Нетто</th><th>Весовщик</th></tr></thead>
                  <tbody>
                    {weighings.map(w => (
                      <tr key={w.id}>
                        <td>#{w.id?.slice(-6)}</td>
                        <td>{w.vehicleNumber}</td>
                        <td>{w.tare ?? '—'}</td>
                        <td>{w.brutto ?? w.weight ?? '—'}</td>
                        <td>{w.netto ?? w.weight ?? '—'}</td>
                        <td>{w.weigher ?? '—'}</td>
                      </tr>
                    ))}
                    {weighings.length === 0 && <tr><td colSpan={6}>Нет рейсов</td></tr>}
                  </tbody>
                </table>
              )}

              {tab === 'batches' && (
                <table>
                  <thead><tr><th>BatchID</th><th>Марка</th><th>Рецепт</th><th>Объём</th><th>Оператор</th><th>Статус</th></tr></thead>
                  <tbody>
                    {batches.map(b => (
                      <tr key={b.id}>
                        <td>{b.id?.slice(-8)}</td>
                        <td>{b.mark}</td>
                        <td>{b.recipeId || '—'}</td>
                        <td>{b.volume} м³</td>
                        <td>{b.operator || '—'}</td>
                        <td><span className="badge ok">закрыт</span></td>
                      </tr>
                    ))}
                    {batches.length === 0 && <tr><td colSpan={6}>Нет замесов</td></tr>}
                  </tbody>
                </table>
              )}

              {tab === 'reconciliation' && (
                <div>
                  <div className="card" style={{ background: isBlocked ? 'rgba(255,107,107,0.1)' : 'transparent', borderColor: isBlocked ? 'rgba(255,107,107,0.22)' : undefined }}>
                    <div className="card-bd">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div>
                          <b>{isBlocked ? `Отклонение ${deviation}% → ТТН заблокирована` : `Отклонение ${deviation}%`}</b>
                          <div className="page-sub" style={{ margin: '6px 0 0' }}>
                            {isBlocked ? 'Требуется причина + комментарий для разблокировки (роль: диспетчер/технолог/руководитель).' : 'Сверка в норме.'}
                          </div>
                        </div>
                        {isBlocked && (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span className="mini danger" onClick={handleUnblock}>Разблокировать</span>
                          </div>
                        )}
                      </div>
                      {isBlocked && (
                        <div className="filters" style={{ marginTop: 10 }}>
                          <div className="field">
                            <label>Причина</label>
                            <div className="control">🧷
                              <select value={unblockReason} onChange={e => setUnblockReason(e.target.value)}>
                                <option value="">Выбрать…</option>
                                <option value="scale_error">Погрешность весов</option>
                                <option value="density">Корректировка плотности</option>
                                <option value="mixed">Смешанный рейс</option>
                                <option value="human">Человеческий фактор</option>
                              </select>
                            </div>
                          </div>
                          <div className="field" style={{ minWidth: 240 }}>
                            <label>Комментарий</label>
                            <div className="control">✍️
                              <input placeholder="Опишите основание разблокировки…" value={unblockComment} onChange={e => setUnblockComment(e.target.value)} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'documents' && (
                <table>
                  <thead><tr><th>Тип</th><th>Номер</th><th>Статус</th></tr></thead>
                  <tbody>
                    {ttn.map(t => (
                      <tr key={t.id}>
                        <td>ТТН</td>
                        <td>{t.number}</td>
                        <td><span className={`badge ${t.status === 'blocked' ? 'danger' : 'ok'}`}>{t.status === 'blocked' ? 'Заблокировано' : { draft: 'Черновик', confirmed: 'Подтверждён', sent: 'Отправлено', delivered: 'Доставлено' }[t.status] || 'Черновик'}</span></td>
                      </tr>
                    ))}
                    {ttn.length === 0 && <tr><td colSpan={3}>Нет документов</td></tr>}
                  </tbody>
                </table>
              )}

              {tab === 'finance' && (
                <div className="card">
                  <div className="card-bd">
                    <p>Сумма: {order.price} сом. Оплата: {order.paymentChecked ? 'Проверена' : 'Не проверена'}</p>
                    <button className="btn btn-primary" onClick={() => (order.productType === 'zbi' ? api.orders.zbi.checkPayment(order.id) : api.orders.beton.checkPayment(order.id)).then(() => window.location.reload())}>
                      Проверить оплату
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="card-hd"><b>Документы</b><span className="badge">печать/выгрузка</span></div>
          <div className="card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="card">
              <div className="card-bd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div>
                  <b>ТТН</b>
                  <div className="t" style={{ color: 'var(--text-muted)' }}>Статус: <span className={`badge ${ttn.some(x => x.status === 'blocked') ? 'danger' : ''}`}>{ttn.some(x => x.status === 'blocked') ? 'Заблокировано' : 'Черновик'}</span></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="mini">Просмотр</span>
                  {ttn.some(x => x.status === 'blocked') && <span className="mini danger" onClick={() => setTab('reconciliation')}>Разблок.</span>}
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-bd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div>
                  <b>Акт</b>
                  <div className="t" style={{ color: 'var(--text-muted)' }}>Статус: <span className="badge">Черновик</span></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="mini">Сформировать</span>
                  <span className="mini">PDF</span>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-bd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div>
                  <b>Паспорт качества</b>
                  <div className="t" style={{ color: 'var(--text-muted)' }}>Статус: <span className="badge warn">Требуется</span></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="mini warn" onClick={() => navigate('/quality')}>Создать</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
