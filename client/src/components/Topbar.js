import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Topbar({ period: propPeriod, onPeriodChange, onMenuClick }) {
  const period = propPeriod || new Date().toISOString().slice(0, 10);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (searchQ.length < 2) {
      setSearchResults(null);
      return;
    }
    const t = setTimeout(() => {
      api.search.query(searchQ).then(setSearchResults).catch(() => setSearchResults(null));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  useEffect(() => {
    api.analytics.operational(period).then(op => {
      const n = [];
      if (op?.discrepancyCritical) n.push({ type: 'critical', text: `Расхождение РБУ↔Весы >2%` });
      if (op?.blockedTtnCount > 0) n.push({ type: 'critical', text: `${op.blockedTtnCount} ТТН заблокированы` });
      if (op?.risks?.length > 0) n.push({ type: 'warning', text: `${op.risks.length} рисков` });
      setNotifications(n);
    }).catch(() => setNotifications([]));
  }, [period]);

  const notifCount = notifications.length;
  const handleSelectResult = (type, id) => {
    setSearchOpen(false);
    setSearchQ('');
    setSearchResults(null);
    if (type === 'order' || type === 'order_beton' || type === 'order_zbi') navigate('/orders');
    if (type === 'weighing') navigate(`/weighings?highlight=${id}`);
    if (type === 'ttn') navigate('/logistics?tab=ttn');
    if (type === 'client') navigate(`/clients/${id}`);
  };

  const periodLabel = !period ? 'Смена' : period === 'week' ? 'Неделя' : period?.slice(0, 10) || 'Сегодня';

  return (
    <header className="topbar">
      <button className="topbar-hamburger" onClick={onMenuClick} aria-label="Меню" type="button">☰</button>
      <div className="topbar-search-wrap" role="search">
        🔎
        <input
          type="search"
          placeholder="Поиск: заказ / рейс / госномер / ТТН / BatchID..."
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
        />
        {searchOpen && searchResults && (
          <div className="search-dropdown">
            {searchResults.orders?.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">Заказы</div>
                {searchResults.orders.slice(0, 3).map(o => (
                  <div key={o.id} className="search-item" onMouseDown={() => handleSelectResult('order', o.id)}>
                    {o.clientName} — {o.type === 'beton' ? o.mark : o.productType}
                  </div>
                ))}
              </div>
            )}
            {searchResults.ttn?.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">ТТН</div>
                {searchResults.ttn.slice(0, 3).map(t => (
                  <div key={t.id} className="search-item" onMouseDown={() => handleSelectResult('ttn', t.id)}>
                    {t.number} — {t.clientName}
                  </div>
                ))}
              </div>
            )}
            {searchResults.clients?.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">Клиенты</div>
                {searchResults.clients.slice(0, 3).map(c => (
                  <div key={c.id} className="search-item" onMouseDown={() => handleSelectResult('client', c.id)}>
                    {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="topbar-pill">📅 Период: <b style={{ color: 'var(--text)' }}>{periodLabel}</b></div>
      <button className="btn" onClick={() => window.print()} title="Экспорт/печать">⤓ Экспорт</button>
      <button className="btn btn-warn" title="Уведомления">🔔 {notifCount || 0}</button>
      <button className="btn btn-primary" onClick={() => navigate('/orders')}>＋ Создать</button>
      <button className="btn" onClick={toggleTheme} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <span className="topbar-user">{user.roleLabel}</span>
    </header>
  );
}
