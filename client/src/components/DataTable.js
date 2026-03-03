import React, { useState, useMemo } from 'react';

const PAGE_SIZES = [5, 10, 25, 50];

/**
 * Универсальная таблица с фильтрами, пагинацией и действиями
 * @param {Object} props
 * @param {Array} props.columns - [{ key, label, render?: (value, row) => node }]
 * @param {Array} props.data - массив данных
 * @param {ReactNode} props.filters - блок фильтров
 * @param {Function} props.renderActions - (row) => ReactNode - кнопки действий
 * @param {string} props.emptyMessage - сообщение при пустом списке
 * @param {string} props.keyField - ключ для id (default: 'id')
 */
export default function DataTable({
  columns = [],
  data = [],
  filters = null,
  renderActions,
  emptyMessage = 'Нет данных',
  keyField = 'id',
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    let result = [...data];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(row =>
        columns.some(col => {
          const val = row[col.key];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }
    return result;
  }, [data, search, columns]);

  const total = filteredData.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageData = filteredData.slice(start, start + pageSize);

  return (
    <div className="card data-table">
      {filters && (
        <div className="data-table-filters">
          {filters}
        </div>
      )}
      <div className="data-table-search">
        <input
          type="search"
          placeholder="Поиск..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="form-control"
        />
      </div>
      <div className="data-table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
              {renderActions && <th style={{ width: 120 }}>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {pageData.map(row => (
              <tr key={row[keyField]}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {renderActions && (
                  <td className="table-actions">
                    {renderActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {pageData.length === 0 && (
          <p className="data-table-empty">{emptyMessage}</p>
        )}
      </div>
      {total > 0 && (
        <div className="data-table-pagination">
          <div className="pagination-info">
            Показано {start + 1}–{Math.min(start + pageSize, total)} из {total}
          </div>
          <div className="pagination-controls">
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="page-size-select"
            >
              {PAGE_SIZES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="pagination-pages">
              Страница {currentPage} из {totalPages}
            </span>
            <button
              className="btn btn-secondary pagination-btn"
              disabled={currentPage <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              ←
            </button>
            <button
              className="btn btn-secondary pagination-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
