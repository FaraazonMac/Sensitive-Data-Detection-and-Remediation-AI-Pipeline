interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
}

export function DataTable<T>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-hairline">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-hairline bg-panel-hover">
            {columns.map((col) => (
              <th
                key={col.header}
                className="px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-text-meta"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-hairline last:border-0 hover:bg-panel-hover">
              {columns.map((col) => (
                <td key={col.header} className="px-3 py-2 text-text-mid">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
