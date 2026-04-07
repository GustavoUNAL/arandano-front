import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchRecipeCosts, type RecipeCostLineRow } from '../api'
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

function CostTable({
  rows,
  emptyLabel,
}: {
  rows: RecipeCostLineRow[]
  emptyLabel: string
}) {
  if (rows.length === 0) {
    return <p className="muted">{emptyLabel}</p>
  }
  return (
    <div className="data-table-wrap data-table-elevated costs-table-block">
      <table className="data-table data-table-striped">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Concepto</th>
            <th className="num">Cant.</th>
            <th>Unidad</th>
            <th className="num">Total (COP)</th>
            <th>Ref. hoja</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.productName}</td>
              <td className="muted">{r.categoryName ?? '—'}</td>
              <td>{r.name}</td>
              <td className="num mono">{r.quantity ?? '—'}</td>
              <td className="muted">{r.unit}</td>
              <td className="num mono">{formatCOP(r.lineTotalCOP)}</td>
              <td className="muted small">{r.sheetUnitCost ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CostsView({ baseUrl }: { baseUrl: string }) {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof fetchRecipeCosts>
  > | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [filterKind, setFilterKind] = useState<'all' | 'FIJO' | 'VARIABLE'>(
    'all',
  )
  const [filterCategory, setFilterCategory] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchRecipeCosts(baseUrl)
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

  const allRows = useMemo(() => {
    if (!data) return [] as RecipeCostLineRow[]
    return [...data.fixed, ...data.variable]
  }, [data])

  const categories = useMemo(() => {
    const s = new Set<string>()
    for (const r of allRows) {
      const name = (r.categoryName ?? '').trim()
      if (name) s.add(name)
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'es'))
  }, [allRows])

  const passesFilters = useCallback(
    (r: RecipeCostLineRow) => {
      if (filterKind !== 'all' && r.kind !== filterKind) return false
      if (filterCategory && (r.categoryName ?? '') !== filterCategory) return false
      const q = searchDebounced.trim().toLowerCase()
      if (!q) return true
      const hay = `${r.productName} ${r.categoryName ?? ''} ${r.name}`.toLowerCase()
      return hay.includes(q)
    },
    [filterCategory, filterKind, searchDebounced],
  )

  const fixedRows = useMemo(() => {
    if (!data) return []
    return data.fixed.filter(passesFilters)
  }, [data, passesFilters])

  const variableRows = useMemo(() => {
    if (!data) return []
    return data.variable.filter(passesFilters)
  }, [data, passesFilters])

  const totals = useMemo(() => {
    const fixed = fixedRows.reduce((s, r) => s + num(r.lineTotalCOP), 0)
    const variable = variableRows.reduce((s, r) => s + num(r.lineTotalCOP), 0)
    return { fixed, variable, all: fixed + variable }
  }, [fixedRows, variableRows])

  const costsSummaryItems = useMemo(
    () => [
      {
        label: 'Líneas total',
        value: allRows.length,
        title: 'FIJO + VARIABLE sin filtrar búsqueda',
      },
      {
        label: 'Visibles',
        value: fixedRows.length + variableRows.length,
        title: 'Líneas que cumplen filtros',
      },
      {
        label: 'FIJO',
        value: fixedRows.length,
      },
      {
        label: 'VARIABLE',
        value: variableRows.length,
      },
      {
        label: 'Total COP',
        value: formatCOP(totals.all),
        title: 'Suma de líneas visibles',
      },
    ],
    [
      allRows.length,
      fixedRows.length,
      variableRows.length,
      totals.all,
    ],
  )

  return (
    <div className="products-layout">
      <div className="products-list-pane">
        <div className="page-intro">
          <h2 className="page-title">Costos de recetas</h2>
          <p className="muted">
            Líneas de costeo fijo y variable por producto (tabla{' '}
            <span className="mono">costos</span> en la API).
          </p>
        </div>

        <div className="data-toolbar data-toolbar--stack costs-toolbar">
          <div className="search-field">
            <span className="search-icon" aria-hidden />
            <input
              type="search"
              placeholder="Buscar por producto, categoría o concepto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar costos"
            />
          </div>
          <div className="toolbar-filters toolbar-filters--wrap">
            <label className="filter-field">
              <span>Tipo</span>
              <select
                value={filterKind}
                onChange={(e) =>
                  setFilterKind(e.target.value as 'all' | 'FIJO' | 'VARIABLE')
                }
              >
                <option value="all">Todos</option>
                <option value="FIJO">FIJO</option>
                <option value="VARIABLE">VARIABLE</option>
              </select>
            </label>
            <label className="filter-field">
              <span>Categoría</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn-secondary btn-compact"
              onClick={() => {
                setSearch('')
                setFilterKind('all')
                setFilterCategory('')
              }}
            >
              Limpiar filtros
            </button>
          </div>
          <div className="toolbar-actions">
          <button
            type="button"
            className="btn-secondary btn-compact"
            onClick={() => void load()}
            disabled={loading}
          >
            Actualizar
          </button>
          </div>
        </div>

        {!loading && data && (
          <SectionSummaryBar section="costs" items={costsSummaryItems} />
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {loading && <p className="muted">Cargando costos…</p>}

        {!loading && data && (
          <>
            <section className="cost-section" aria-labelledby="costs-fixed-h">
              <div className="cost-section-head">
                <h3 id="costs-fixed-h" className="cost-section-title">
                  Costos fijos
                </h3>
                <span className="cost-section-total mono">
                  {formatCOP(totals.fixed)}
                </span>
              </div>
              <CostTable
                rows={fixedRows}
                emptyLabel="No hay líneas de costo fijo registradas."
              />
            </section>

            <section className="cost-section" aria-labelledby="costs-var-h">
              <div className="cost-section-head">
                <h3 id="costs-var-h" className="cost-section-title cost-section-title--var">
                  Costos variables
                </h3>
                <span className="cost-section-total mono">
                  {formatCOP(totals.variable)}
                </span>
              </div>
              <CostTable
                rows={variableRows}
                emptyLabel="No hay líneas de costo variable registradas."
              />
            </section>

            <div className="costs-summary-bar">
              <span className="muted">Suma fijos + variables</span>
              <strong className="mono costs-summary-total">
                {formatCOP(totals.all)}
              </strong>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
