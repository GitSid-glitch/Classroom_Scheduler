import type { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
}

interface EntityTableProps<T> {
  title: string;
  description: string;
  items: T[];
  columns: Column<T>[];
}

export function EntityTable<T>({
  title,
  description,
  items,
  columns,
}: EntityTableProps<T>) {
  return (
    <section className="rounded-[1.75rem] border border-stone-800 bg-stone-950 p-6">
      <div className="mb-5 space-y-2">
        <h2 className="text-2xl font-semibold text-stone-50">{title}</h2>
        <p className="max-w-3xl text-sm leading-7 text-stone-400">{description}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.2em] text-stone-500"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="rounded-2xl bg-stone-900/80">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4 text-sm text-stone-200">
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
