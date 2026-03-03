import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DASHBOARDS = [
  { id: 'operational', label: 'Оперативный', badge: 'ok', desc: 'Отгрузка · простои · сверка', filters: 'Фильтры: период, РБУ, продукт, контрагент.' },
  { id: 'financial', label: 'Финансовый', badge: 'warn', desc: 'ДЗ · маржа · реализации', filters: 'Фокус: просрочка, лимиты, топ-должники.' },
  { id: 'technical', label: 'Технический', badge: '', desc: 'Наработка · простои · ТОиР', filters: 'Дробилка, металл, ремонты.' },
  { id: 'quality', label: 'Качество', badge: '', desc: 'Прочность · рекламации', filters: 'Партии, паспорта, отклонения, причины.' },
];

export default function BIReports() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 10));
  const [metric, setMetric] = useState('shipment');
  const [slice, setSlice] = useState('clients');

  return (
    <div>
      <h1 className="page-title">BI отчёты (Power BI / Tableau)</h1>
      <p className="page-sub">Каталог дашбордов и быстрый доступ. Встраивание внешних BI-страниц.</p>

      <div className="grid">
        <div className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card-hd"><b>Каталог дашбордов</b><span className="badge">витрины</span></div>
          <div className="card-bd">
            <div className="grid">
              {DASHBOARDS.map(d => (
                <div key={d.id} className="card" style={{ gridColumn: 'span 4' }}>
                  <div className="card-bd">
                    <div className={`badge ${d.badge || ''}`}>{d.label}</div>
                    <div style={{ marginTop: 10, fontWeight: 900, fontSize: 16 }}>{d.desc}</div>
                    <div className="page-sub" style={{ margin: '6px 0 0' }}>{d.filters}</div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className="mini primary" onClick={() => navigate('/')}>Открыть</span>
                      <span className="mini">Экспорт</span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="card" style={{ gridColumn: 'span 12' }}>
                <div className="card-bd" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <b>Конструктор показателей (минимальный UI)</b>
                    <div className="page-sub" style={{ margin: '6px 0 0' }}>Выбор метрик/разрезов/источников витрин (доступ: руководитель/аналитик).</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="mini">Источник: EIS витрина</span>
                    <span className="mini primary">Создать виджет</span>
                  </div>
                </div>
                <div className="filters" style={{ marginTop: 12 }}>
                  <div className="field">
                    <label>Метрика</label>
                    <div className="control">📈
                      <select value={metric} onChange={e => setMetric(e.target.value)}>
                        <option value="shipment">Отгрузка (м³)</option>
                        <option value="deviation">Отклонения (&gt;2%)</option>
                        <option value="debt">ДЗ (сумма)</option>
                        <option value="reclamations">Рекламации (шт)</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label>Разрез</label>
                    <div className="control">🧩
                      <select value={slice} onChange={e => setSlice(e.target.value)}>
                        <option value="clients">По клиентам</option>
                        <option value="shifts">По сменам</option>
                        <option value="marks">По маркам</option>
                        <option value="rbu">По РБУ</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label>Период</label>
                    <div className="control">📅
                      <input type="date" value={period} onChange={e => setPeriod(e.target.value)} />
                    </div>
                  </div>
                  <div className="field" style={{ minWidth: 220 }}>
                    <label>Действие</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className="btn" style={{ flex: 1 }}>Предпросмотр</span>
                      <span className="btn btn-primary" style={{ flex: 1 }}>Сохранить</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
