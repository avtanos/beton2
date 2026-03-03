import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function CementSilos() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.analytics.operational(new Date().toISOString().slice(0, 10)).then(op => setData(op)).catch(() => setData(null));
  }, []);

  const silos = data?.cementSilos || { silo1: { level: 80, daysToMin: 5 }, silo2: { level: 75, daysToMin: 4 } };

  return (
    <div>
      <h1 className="page-title">Силосы цемента</h1>
      <div className="grid-2">
        <div className="card stat-card">
          <h3>Силос №1</h3>
          <div className="value">{typeof silos.silo1 === 'object' ? silos.silo1.level : silos.silo1}%</div>
          <div style={{ fontSize: '0.875rem' }}>Дней до минимума: {typeof silos.silo1 === 'object' ? silos.silo1.daysToMin : '—'}</div>
        </div>
        <div className="card stat-card">
          <h3>Силос №2</h3>
          <div className="value">{typeof silos.silo2 === 'object' ? silos.silo2.level : silos.silo2}%</div>
          <div style={{ fontSize: '0.875rem' }}>Дней до минимума: {typeof silos.silo2 === 'object' ? silos.silo2.daysToMin : '—'}</div>
        </div>
      </div>
    </div>
  );
}
