import './RecentTable.css';

export default function RecentTable({ title, columns, rows, emptyText }) {
  return (
    <div className="recent-table-wrapper">
      {title && <h3 className="recent-table-title">{title}</h3>}
      <div className="recent-table-scroll">
        <table className="recent-table">
          <thead className="recent-table-head">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="recent-table-th" style={col.width ? { width: col.width } : {}}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="recent-table-body">
            {rows && rows.length > 0 ? (
              rows.map((row, idx) => (
                <tr key={row.id ?? idx} className="recent-table-tr">
                  {columns.map((col) => (
                    <td key={col.key} className="recent-table-td">
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="recent-table-empty" colSpan={columns.length}>
                  {emptyText || 'No data available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
