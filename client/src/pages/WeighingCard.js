import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function WeighingCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [weighing, setWeighing] = useState(null);

  useEffect(() => {
    api.weighings.get(id).then(setWeighing).catch(() => setWeighing(null));
  }, [id]);

  if (!weighing) return <div className="card">Загрузка...</div>;

  const TYPES = { tare: 'Тара', brutto: 'Брутто', receipt_inert: 'Приём инертных', receipt_cement: 'Приём цемента', receipt_metal: 'Приём металла' };

  return (
    <div>
      <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => navigate(-1)}>← Назад</button>
      <h1 className="page-title">Взвешивание {weighing.id?.slice(-8)}</h1>
      <div className="card">
        <div className="grid-2">
          <div>Тип: {TYPES[weighing.type] || weighing.type}</div>
          <div>Дата/время: {weighing.date} {weighing.time}</div>
          <div>Госномер: {weighing.vehicleNumber}</div>
          <div>Водитель: {weighing.driver}</div>
          <div>Вес: {weighing.weight} кг</div>
          <div>Материал: {weighing.material || '—'}</div>
          <div>Заказ: {weighing.orderId || 'Не привязан'}</div>
          <div>Синхронизация: <span className="status-ok">ОК</span></div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary">Привязать к заказу</button>
          <button className="btn btn-secondary" style={{ marginLeft: '0.5rem' }}>Повторить выгрузку в EIS</button>
        </div>
      </div>
    </div>
  );
}
