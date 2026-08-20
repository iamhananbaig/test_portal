import type { ReactNode } from 'react'

interface Column {
  key: string
  header: string
  className?: string
}

interface TableProps {
  columns: Column[]
  children: ReactNode
  caption?: string
}

export default function Table({ columns, children, caption }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`pb-3 text-xs font-semibold uppercase tracking-wider ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

interface TableRowProps {
  children: ReactNode
  className?: string
}

export function TableRow({ children, className = '' }: TableRowProps) {
  return (
    <tr
      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors ${className}`}
    >
      {children}
    </tr>
  )
}

interface TableCellProps {
  children: ReactNode
  className?: string
}

export function TableCell({ children, className = '' }: TableCellProps) {
  return <td className={`py-3 ${className}`}>{children}</td>
}
