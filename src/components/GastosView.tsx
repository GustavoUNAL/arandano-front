import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchGastos,
  type GastosByTypeGroup,
  type GastosResponse,
  type RecipeCostKind,
} from '../api'
import { CollapsibleFiltersToolbar } from './CollapsibleFiltersToolbar'
import { SectionSummaryBar } from './SectionSummaryBar'

function num(v: string | number | null | undefined): number {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

function formatCOP(value: string | number | null | undefined): string {
  const n = num(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

function paginationDots(current: number, total: number): number[] {
  if (total <= 1) return []
  const out: number[] = []
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let p = start; p <= end; p++) out.push(p)
  if (!out.includes(1)) out.unshift(1)
  if (!out.includes(total)) out.push(total)
  return out
}

type GastoRow = {
  id: string
  type: string
  name: string
  unit: string
  lineTotalCOP: string
  kind: RecipeCostKind
}

function rowsFromResponse(data: GastosResponse): { fixed: GastoRow[]; variable: GastoRow[] } {
  if (Array.isArray(data.items) && data.items.length > 0) {
    const fixed: GastoRow[] = []
    const variable: GastoRow[] = []
    for (const it of data.items) {
      const row: GastoRow = {
        id: it.id,
        type: it.type,
        name: it.name,
        unit: it.unit,
        lineTotalCOP: it.lineTotalCOP,
        kind: it.kind,
      }
      if (it.kind === 'FIJO') fixed.push(row)
      else variable.push(row)
    }
    return { fixed, variable }
  }
  return {
    fixed: (data.fixed ?? []).map((r) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      unit: r.unit,
      lineTotalCOP: r.lineTotalCOP,
      kind: 'FIJO' as const,
    })),
    variable: (data.variable ?? []).map((r) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      unit: r.unit,
      lineTotalCOP: r.lineTotalCOP,
      kind: 'VARIABLE' as const,
    })),
  }
}

function GastosTable({
  rows,
  emptyLabel,
}: {
  rows: GastoRow[]
  emptyLabel: string
}) {
  if (rows.length === 0) return <p className="muted">{emptyLabel}</p>
  return (
    <div className="data-table-wrap data-table-elevated costs-table-block">
      <table className="data-table data-table-striped">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Concepto</th>
            <th>Unidad</th>
            <th className="num">Total (COP)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="muted">{r.type}</td>
              <td>{r.name}</td>
              <td className="muted">{r.unit}</td>
              <td className="num mono">{formatCOP(r.lineTotalCOP)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ByTypeSection({
  title,
  groups,
}: {
  title: string
  groups: GastosByTypeGroup[]
}) {
  if (!groups.length) return null
  return (
    <div className="cost-product-block">
      <h4 className="muted small" style={{ margin: '0 0 0.5rem', textTransform: 'uppercase' }}>
        {title}
      </h4>
      <div
        style={{
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        }}
      >
        {groups.map((g) => (
          <div
            key={`${g.type}-${title}`}
            style={{
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '0.75rem',
              background: 'var(--surface-elevated)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <strong style={{ fontSize: '0.9rem' }}>{g.type}</strong>
              <span className="mono">{formatCOP(g.totalCOP)}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem' }}>
              {g.items.map((it) => (
                <li key={it.id}>
                  {it.name}{' '}
                  <span className="muted">
                    · {formatCOP(it.lineTotalCOP)} {it.unit ? `(${it.unit})` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GastosView({ baseUrl }: { baseUrl: string }) {
  const PAGE_SIZE = 20
  const [data, setData] = useState<GastosResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [filterKind, setFilterKind] = useState<'all' | 'FIJO' | 'VARIABLE'>('all')
  const [fixedPage, setFixedPage] = useState(1)
  const [variablePage, setVariablePage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchGastos(baseUrl)
      setData(res)
    } catch (e) {
      setData(null)
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [baseUrl])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search), 320)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setFixedPage(1)
    setVariablePage(1)
  }, [searchDebounced, filterKind])

  const { fixed: fixedAll, variable: variableAll } = useMemo(
    () => (data ? rowsFromResponse(data) : { fixed: [] as GastoRow[], variable: [] as GastoRow[] }),
    [data],
  )

  const filterRows = useCallback(
    (rows: GastoRow[]) => {
      const q = searchDebounced.trim().toLowerCase()
      if (!q) return rows
      return rows.filter((r) => {
        const hay = `${r.type} ${r.name} ${r.unit}`.toLowerCase()
        return hay.includes(q)
      })
    },
    [searchDebounced],
  )

  const fixedRows = useMemo(() => filterRows(fixedAll), [filterRows, fixedAll])
  const variableRows = useMemo(() => filterRows(variableAll), [filterRows, variableAll])
  const fixedTotalPages = Math.max(1, Math.ceil(fixedRows.length / PAGE_SIZE))
  const variableTotalPages = Math.max(1, Math.ceil(variableRows.length / PAGE_SIZE))
  const fixedPageSafe = Math.min(fixedPage, fixedTotalPages)
  const variablePageSafe = Math.min(variablePage, variableTotalPages)
  const fixedPageDots = paginationDots(fixedPageSafe, fixedTotalPages)
  const variablePageDots = paginationDots(variablePageSafe, variableTotalPages)
  const fixedPageRows = fixedRows.slice(
    (fixedPageSafe - 1) * PAGE_SIZE,
    fixedPageSafe * PAGE_SIZE,
  )
  const variablePageRows = variableRows.slice(
    (variablePageSafe - 1) * PAGE_SIZE,
    variablePageSafe * PAGE_SIZE,
  )

  const sums = useMemo(() => {
    let fixed = 0
    let variable = 0
    for (const r of fixedRows) fixed += num(r.lineTotalCOP)
    for (const r of variableRows) variable += num(r.lineTotalCOP)
    return { fixed, variable, all: fixed + variable }
  }, [fixedRows, variableRows])

  const summaryItems = useMemo(
    () =>
      data
        ? [
            {
              label: 'Líneas FIJO',
              value: fixedRows.length,
              title: 'Gastos fijos que coinciden con la búsqueda',
            },
            {
              label: 'Líneas VARIABLE',
              value: variableRows.length,
              title: 'Gastos variables que coinciden con la búsqueda',
            },
            {
              label: 'Total FIJO',
              value: formatCOP(sums.fixed),
            },
            {
              label: 'Total VARIABLE',
              value: formatCOP(sums.variable),
            },
            {
              label: 'Total (búsqueda)',
              value: formatCOP(sums.all),
              title: 'Suma FIJO + VARIABLE con búsqueda aplicada',
            },
            {
              label: 'Total API',
              value: formatCOP(data.totals.totalCOP),
              title: 'Totales devueltos por GET /gastos',
            },
          ]
        : [],
    [data, fixedRows.length, sums, variableRows.length],
  )

  return (
    <div className="products-layout">
      <div className="products-list-pane">
        <div className="page-intro page-intro--tight">
          <h2 className="page-title">Gastos</h2>
          <p className="muted">
            <code className="mono">GET /gastos</code> · Fijos y variables del negocio.
            Costos por receta en <strong>Costos</strong>.
          </p>
        </div>

        <CollapsibleFiltersToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por tipo o concepto…"
          searchAriaLabel="Buscar gastos"
          onRefresh={load}
          refreshDisabled={loading}
          hasActiveFilters={filterKind !== 'all' || search.trim() !== ''}
          filterDrawer={
            <div className="inventory-filter-bar__controls">
              <label className="inventory-filter">
                <span className="inventory-filter__label">Mostrar</span>
                <select
                  className="inventory-filter__input"
                  value={filterKind}
                  onChange={(e) =>
                    setFilterKind(e.target.value as 'all' | 'FIJO' | 'VARIABLE')
                  }
                >
                  <option value="all">FIJO y VARIABLE</option>
                  <option value="FIJO">Solo FIJO</option>
                  <option value="VARIABLE">Solo VARIABLE</option>
                </select>
              </label>
              <div className="inventory-filter-bar__actions inventory-filter-bar__actions--inline">
                <button
                  type="button"
                  className="btn-secondary btn-compact"
                  onClick={() => {
                    setSearch('')
                    setFilterKind('all')
                  }}
                >
                  Limpiar
                </button>
              </div>
            </div>
          }
        />

        {!loading && data && (
          <SectionSummaryBar section="gastos" items={summaryItems} />
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {loading && <p className="muted">Cargando gastos…</p>}

        {!loading && data && (
          <>
            {data.fixedByType && data.fixedByType.length > 0 && filterKind !== 'VARIABLE' && (
              <ByTypeSection title="Resumen FIJO por tipo" groups={data.fixedByType} />
            )}
            {data.variableByType && data.variableByType.length > 0 && filterKind !== 'FIJO' && (
              <ByTypeSection title="Resumen VARIABLE por tipo" groups={data.variableByType} />
            )}

            {filterKind !== 'VARIABLE' && (
              <section className="cost-section" aria-label="Gastos fijos">
                <div className="cost-section-head cost-section-head--sub">
                  <h3 className="cost-section-title">FIJO</h3>
                  <strong className="mono">{formatCOP(sums.fixed)}</strong>
                </div>
                <GastosTable rows={fixedPageRows} emptyLabel="Sin gastos fijos." />
                {fixedRows.length > PAGE_SIZE && (
                  <div className="pagination-bar">
                    <span className="muted">
                      Página {fixedPageSafe} de {fixedTotalPages} · {fixedRows.length}{' '}
                      registro{fixedRows.length !== 1 ? 's' : ''}
                    </span>
                    {fixedPageDots.length > 1 && (
                      <div className="pager-dots" aria-hidden>
                        {fixedPageDots.map((p) => (
                          <span
                            key={p}
                            className={`pager-dot${p === fixedPageSafe ? ' is-active' : ''}`}
                          />
                        ))}
                      </div>
                    )}
                    <div className="pager">
                      <button
                        type="button"
                        disabled={fixedPageSafe <= 1}
                        onClick={() => setFixedPage((p) => Math.max(1, p - 1))}
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        disabled={fixedPageSafe >= fixedTotalPages}
                        onClick={() =>
                          setFixedPage((p) => Math.min(fixedTotalPages, p + 1))
                        }
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {filterKind !== 'FIJO' && (
              <section className="cost-section" aria-label="Gastos variables">
                <div className="cost-section-head cost-section-head--sub">
                  <h3 className="cost-section-title cost-section-title--var">VARIABLE</h3>
                  <strong className="mono">{formatCOP(sums.variable)}</strong>
                </div>
                <GastosTable rows={variablePageRows} emptyLabel="Sin gastos variables." />
                {variableRows.length > PAGE_SIZE && (
                  <div className="pagination-bar">
                    <span className="muted">
                      Página {variablePageSafe} de {variableTotalPages} ·{' '}
                      {variableRows.length} registro{variableRows.length !== 1 ? 's' : ''}
                    </span>
                    {variablePageDots.length > 1 && (
                      <div className="pager-dots" aria-hidden>
                        {variablePageDots.map((p) => (
                          <span
                            key={p}
                            className={`pager-dot${p === variablePageSafe ? ' is-active' : ''}`}
                          />
                        ))}
                      </div>
                    )}
                    <div className="pager">
                      <button
                        type="button"
                        disabled={variablePageSafe <= 1}
                        onClick={() => setVariablePage((p) => Math.max(1, p - 1))}
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        disabled={variablePageSafe >= variableTotalPages}
                        onClick={() =>
                          setVariablePage((p) => Math.min(variableTotalPages, p + 1))
                        }
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            <div className="costs-summary-bar costs-summary-bar--slim">
              <span className="muted">Total visible (filtro)</span>
              <strong className="mono costs-summary-total">{formatCOP(sums.all)}</strong>
              <span className="muted" style={{ marginLeft: '0.75rem' }}>
                · Total API
              </span>
              <strong className="mono costs-summary-total">
                {formatCOP(data.totals.totalCOP)}
              </strong>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
