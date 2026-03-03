import React, { useState, useEffect } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';

export default function FormingPlan() {
  const [orders, setOrders] = useState([]);
  const [production, setProduction] = useState([]);
  const [armo, setArmo] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    api.orders.zbi.list().then(o => setOrders(o.filter(x => x.scheduledDate === date)));
    api.production.zbiProduction.list().then(setProduction);
    api.production.armoCarcasses.list().then(setArmo);
  }, [date]);

  return (
    <div>
      <h1 className="page-title">ЖБИ производство</h1>
      <p className="page-sub">План формовки, маршрут изделия (каркас → заливка → ТВО → склад), связи с бетоном (BatchID) и арматурой.</p>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <div className="card">
        <h3>Изделия на период</h3>
        <DataTable
          columns={[
            { key: 'productType', label: 'Тип' },
            { key: 'productSize', label: 'Типоразмер' },
            { key: 'quantity', label: 'Кол-во' },
            { key: 'status', label: 'Каркасы' },
            { key: 'status', label: 'Бетон' },
          ]}
          data={orders}
          emptyMessage="Нет плана"
        />
      </div>
    </div>
  );
}
