import { Children, type ReactElement, type ReactNode } from 'react'

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
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
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

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {caption && <p className="sr-only">{caption}</p>}
        {Children.map(children, (child) => {
          if (!child || typeof child !== 'object' || !('props' in child)) return child
          const row = child as ReactElement<{ children: ReactNode }>
          const cells = Children.toArray(row.props.children)
          return (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-2">
              {cells.map((cell, i) => {
                const col = columns[i]
                if (!col) return cell
                const cellEl = cell as ReactElement<{ children: ReactNode; className?: string }>
                return (
                  <div key={col.key} className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                      {col.header}
                    </span>
                    <span className={`text-sm text-right text-slate-900 dark:text-slate-100 ${cellEl.props.className || ''}`}>
                      {cellEl.props.children}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </>
  )
}

interface TableRowProps {
  children: ReactNode
  className?: string
}

export function TableRow({ children, className = '' }: TableRowProps) {
  return (
    <tr
      className={`border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-700/50 transition-colors ${className}`}
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
