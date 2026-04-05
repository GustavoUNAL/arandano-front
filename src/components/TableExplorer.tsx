import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchTableRows,
  fetchTables,
  type TableInfo,
  type TableRowsResponse,
} from '../api'

const PAGE_SIZE = 75

function cellPreview(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function TableExplorer({ baseUrl }: { baseUrl: string }) {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [tablesError, setTablesError] = useState<string | null>(null)
  const [tablesLoading, setTablesLoading] = useState(false)

  const [selected, setSelected] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [data, setData] = useState<TableRowsResponse | null>(null)
  const [rowsError, setRowsError] = useState<string | null>(null)
  const [rowsLoading, setRowsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setTablesLoading(true)
    setTablesError(null)
    fetchTables(baseUrl)
      .then((list) => {
        if (!cancelled) setTables(list)
      })
      .catch((e: Error) => {
        if (!cancelled) setTablesError(e.message)
      })
      .finally(() => {
        if (!cancelled) setTablesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [baseUrl])

  useEffect(() => {
    if (!selected) {
      setData(null)
      return
    }
    let cancelled = false
    setRowsLoading(true)
    setRowsError(null)
    fetchTableRows(baseUrl, selected, PAGE_SIZE, page * PAGE_SIZE)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((e: Error) => {
        if (!cancelled) setRowsError(e.message)
      })
      .finally(() => {
        if (!cancelled) setRowsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [baseUrl, selected, page])

  const columns = useMemo(() => data?.columns ?? [], [data])
  const totalPages =
    data && data.total > 0 ? Math.ceil(data.total / PAGE_SIZE) : 0

  const pickTable = useCallback((slug: string) => {
    setSelected(slug)
    setPage(0)
  }, [])

  return (
    <div className="explorer-split">
      <aside className="explorer-sidebar">
        <h2 className="explorer-sidebar-title">Tablas SQL</h2>
        {tablesLoading && <p className="muted">Cargando…</p>}
        {tablesError && (
          <p className="error" role="alert">
            {tablesError}
          </p>
        )}
        <nav className="explorer-nav">
          <ul>
            {tables.map((t) => (
              <li key={t.slug}>
                <button
                  type="button"
                  className={t.slug === selected ? 'active' : ''}
                  onClick={() => pickTable(t.slug)}
                >
                  {t.slug}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="explorer-main">
        {!selected && (
          <div className="empty-hint">
            <p>Elige una tabla para ver filas (solo lectura).</p>
            <p className="muted">
              <code>GET /explorer/tables</code>,{' '}
              <code>GET /explorer/tables/:slug</code>
            </p>
          </div>
        )}

        {selected && (
          <>
            <div className="toolbar">
              <h2 className="mono">{selected}</h2>
              {data && (
                <span className="muted">
                  {data.total} fila{data.total !== 1 ? 's' : ''} · página{' '}
                  {page + 1}
                  {totalPages > 0 ? ` / ${totalPages}` : ''}
                </span>
              )}
              <div className="pager">
                <button
                  type="button"
                  disabled={page <= 0 || rowsLoading}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={
                    rowsLoading || !data || (page + 1) * PAGE_SIZE >= data.total
                  }
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>

            {rowsError && (
              <p className="error" role="alert">
                {rowsError}
              </p>
            )}
            {rowsLoading && <p className="muted">Cargando filas…</p>}

            {data && columns.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, i) => (
                      <tr key={row.id != null ? String(row.id) : i}>
                        {columns.map((c) => (
                          <td key={c} title={cellPreview(row[c])}>
                            {cellPreview(row[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data && data.rows.length === 0 && (
              <p className="muted">Esta tabla no tiene filas.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
