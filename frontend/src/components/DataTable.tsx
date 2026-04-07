/**
 * DataTable — 通用数据表格
 *
 * 传入列定义 + 数据，自动渲染表头 + 表格行。
 * 不需要关心表格样式，只需要定义每列的 key 和 render 函数。
 *
 * 用法：
 *   const cols: Column<MyRow>[] = [
 *     { key: "name", title: "名称", render: (row) => row.name },
 *     { key: "actions", title: "", render: (row) => <button>查看</button> },
 *   ]
 *   <DataTable columns={cols} rows={data} rowKey={(r) => r._id} />
 */
export type Column<T> = {
  key: string;
  title: string;
  render: (row: T) => React.ReactNode;
  width?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
};

export default function DataTable<T>({ columns, rows, rowKey }: Props<T>) {
  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-2.5 font-medium"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-t border-slate-100 hover:bg-slate-50"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2.5 text-slate-800">
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
