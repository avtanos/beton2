import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function ClientCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [realizations, setRealizations] = useState([]);

  useEffect(() => {
    api.clients.get(id).then(setClient).catch(() => setClient(null));
    api.logistics.realization.list().then(r => setRealizations(r.filter(x => x.clientId === id)));
  }, [id]);

  if (!client) return <div className="card">Загрузка...</div>;

  const debt = realizations.reduce((s, r) => s + ((r.amount || 0) - (r.paidAmount || 0)), 0);
  const overLimit = client.creditLimit > 0 && debt > client.creditLimit;

  return (
    <div>
      <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => navigate(-1)}>← Назад</button>
      <h1 className="page-title">{client.name}</h1>
      <div className="card">
        <h3>Реквизиты</h3>
        <div className="grid-2">
          <div>ИНН: {client.inn}</div>
          <div>Адрес: {client.address}</div>
          <div>Контакт: {client.contactPerson} {client.phone}</div>
          <div>Кредитный лимит: {client.creditLimit} сом</div>
          <div>Предоплата: {client.prepaymentRequired ? 'Да' : 'Нет'}</div>
        </div>
      </div>
      <div className="card">
        <h3>Финансы</h3>
        <p>Текущая ДЗ: <span className={overLimit ? 'status-critical' : 'status-ok'}>{debt} сом</span> {overLimit && '(превышен лимит)'}</p>
        <p>Отгрузка: {overLimit ? <span className="status-critical">Запрещена (превышен лимит)</span> : <span className="status-ok">Разрешена</span>}</p>
      </div>
      <div className="card">
        <h3>История</h3>
        <table>
          <thead><tr><th>Дата</th><th>Сумма</th><th>Оплачено</th><th>Долг</th></tr></thead>
          <tbody>{realizations.map(r => <tr key={r.id}><td>{r.date}</td><td>{r.amount} сом</td><td>{r.paidAmount} сом</td><td>{r.debt} сом</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
