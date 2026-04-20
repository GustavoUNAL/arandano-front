import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchRecipeCosts, type RecipeCostLineRow } from '../api'
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

function sortByProductAndOrder(a: RecipeCostLineRow, b: RecipeCostLineRow): number {
  const pa = (a.productName ?? '').localeCompare(b.productName ?? '', 'es')
  if (pa !== 0) return pa
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
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
  const PAGE_SIZE = 9
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
  const [page, setPage] = useState(1)

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

  useEffect(() => {
    setPage(1)
  }, [searchDebounced, filterCategory, filterKind])

  const products = useMemo(() => data?.products ?? [], [data])

  const categories = useMemo(() => {
    const s = new Set<string>()
    for (const p of products) {
      const name = (p.categoryName ?? '').trim()
      if (name) s.add(name)
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'es'))
  }, [products])

  const filteredProducts = useMemo(() => {
    const q = searchDebounced.trim().toLowerCase()
    return products
      .map((p) => {
        if (filterCategory && (p.categoryName ?? '') !== filterCategory) return null

        const baseRows = (p.rows ?? [...(p.fixed ?? []), ...(p.variable ?? [])]).map(
          (r) => ({ ...r, productName: p.productName, categoryName: p.categoryName }),
        )

        const rowsFiltered = baseRows.filter((r) => {
          if (filterKind !== 'all' && r.kind !== filterKind) return false
          if (!q) return true
          const hay = `${p.productName} ${p.categoryName ?? ''} ${r.name}`.toLowerCase()
          return hay.includes(q)
        })

        const visibleLineCount = rowsFiltered.length
        if (q && visibleLineCount === 0) return null
        return {
          ...p,
          rows: [...rowsFiltered].sort(sortByProductAndOrder),
        }
      })
      .filter(Boolean) as Array<
      (typeof products)[number] & {
        rows: RecipeCostLineRow[]
      }
    >
  }, [products, searchDebounced, filterCategory, filterKind])

  const totals = useMemo(() => {
    let fixed = 0
    let variable = 0
    let fixedLines = 0
    let variableLines = 0
    for (const p of filteredProducts) {
      for (const r of p.rows) {
        if (r.kind === 'FIJO') {
          fixed += num(r.lineTotalCOP)
          fixedLines++
        } else {
          variable += num(r.lineTotalCOP)
          variableLines++
        }
      }
    }
    return {
      fixed,
      variable,
      all: fixed + variable,
      fixedLines,
      variableLines,
      linesAll: fixedLines + variableLines,
    }
  }, [filteredProducts])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const pageDots = paginationDots(pageSafe, totalPages)
  const pageStart = (pageSafe - 1) * PAGE_SIZE
  const pageProducts = filteredProducts.slice(pageStart, pageStart + PAGE_SIZE)

  const costsSummaryItems = useMemo(
    () => [
      {
        label: 'Productos',
        value: products.length,
        title: 'Productos con costos (según API)',
      },
      {
        label: 'Visibles',
        value: filteredProducts.length,
        title: 'Productos que cumplen filtros',
      },
      {
        label: 'Líneas',
        value: totals.linesAll,
        title: 'Total líneas visibles (FIJO + VARIABLE)',
      },
      {
        label: 'FIJO',
        value: totals.fixedLines,
      },
      {
        label: 'VARIABLE',
        value: totals.variableLines,
      },
      {
        label: 'Total visible',
        value: formatCOP(totals.all),
        title: 'Suma de líneas visibles',
      },
      ...(data
        ? [
            {
              label: 'Total global',
              value: formatCOP(data.totals.totalCOP),
              title: 'Totales globales devueltos por la API',
            },
          ]
        : []),
    ],
    [
      data,
      filteredProducts.length,
      products.length,
      totals.all,
      totals.fixedLines,
      totals.linesAll,
      totals.variableLines,
    ],
  )

  const hasExtraFilters =
    filterKind !== 'all' || filterCategory !== ''

  return (
    <div className="products-layout">
      <div className="products-list-pane">
        <div className="page-intro page-intro--tight">
          <h2 className="page-title">Costos por producto</h2>
          <p className="muted">
            <code className="mono">GET /recipes/costs</code> · Líneas por receta. Gastos
            generales del negocio: menú <strong>Gastos</strong> (
            <code className="mono">GET /gastos</code>).
          </p>
        </div>

        <CollapsibleFiltersToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar producto, categoría o concepto…"
          searchAriaLabel="Buscar costos"
          onRefresh={load}
          refreshDisabled={loading}
          hasActiveFilters={hasExtraFilters}
          filterDrawer={
            <div className="inventory-filter-bar__controls">
              <label className="inventory-filter">
                <span className="inventory-filter__label">Tipo</span>
                <select
                  className="inventory-filter__input"
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
              <label className="inventory-filter">
                <span className="inventory-filter__label">Categoría</span>
                <select
                  className="inventory-filter__input"
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
              <div className="inventory-filter-bar__actions inventory-filter-bar__actions--inline">
                <button
                  type="button"
                  className="btn-secondary btn-compact"
                  onClick={() => {
                    setFilterKind('all')
                    setFilterCategory('')
                  }}
                >
                  Limpiar
                </button>
              </div>
            </div>
          }
        />

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
            <div className="cost-overview-strip" aria-label="Resumen del filtro actual">
              <span>
                <strong>{filteredProducts.length}</strong> producto(s)
              </span>
              <span className="sep" aria-hidden>
                ·
              </span>
              <span>
                FIJO{' '}
                <strong className="mono">{formatCOP(totals.fixed)}</strong>
              </span>
              <span className="sep" aria-hidden>
                ·
              </span>
              <span>
                VARIABLE{' '}
                <strong className="mono">{formatCOP(totals.variable)}</strong>
              </span>
              <span className="sep" aria-hidden>
                ·
              </span>
              <span>
                Total filtrado <strong className="mono">{formatCOP(totals.all)}</strong>
              </span>
            </div>

            <section className="cost-section" aria-label="Costos por producto">
              <div className="cost-section-head">
                <h3 className="cost-section-title">Productos</h3>
                <span className="muted small">Expandir cada fila para el detalle</span>
              </div>

              {filteredProducts.length === 0 ? (
                <p className="empty-hint">No hay productos que coincidan con los filtros.</p>
              ) : (
                <>
                  <div className="cost-products-grid">
                    {pageProducts.map((p) => (
                      <details
                        key={p.productId}
                        className="cost-product-details"
                        aria-label={`Costos por producto: ${p.productName}`}
                      >
                        <summary className="cost-product-summary">
                          <span className="cost-product-summary-title">
                            {p.productName}{' '}
                            {!p.productActive && (
                              <span className="badge badge-muted">Inactivo</span>
                            )}
                          </span>
                          <span className="cost-product-meta">
                            {[p.categoryName?.trim() || '—', `${p.rows.length} línea(s)`].join(
                              ' · ',
                            )}
                          </span>
                          <span className="mono">{formatCOP(p.totals.totalCOP)}</span>
                        </summary>

                        <CostTable
                          rows={p.rows}
                          emptyLabel="Sin líneas visibles para este producto."
                        />
                      </details>
                    ))}
                  </div>
                  {filteredProducts.length > PAGE_SIZE && (
                    <div className="pagination-bar">
                      <span className="muted">
                        Página {pageSafe} de {totalPages} · {filteredProducts.length} producto
                        {filteredProducts.length !== 1 ? 's' : ''}
                      </span>
                      {pageDots.length > 1 && (
                        <div className="pager-dots" aria-hidden>
                          {pageDots.map((p) => (
                            <span
                              key={p}
                              className={`pager-dot${p === pageSafe ? ' is-active' : ''}`}
                            />
                          ))}
                        </div>
                      )}
                      <div className="pager">
                        <button
                          type="button"
                          disabled={pageSafe <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                          Anterior
                        </button>
                        <button
                          type="button"
                          disabled={pageSafe >= totalPages}
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            <div className="costs-summary-bar costs-summary-bar--slim">
              <span className="muted">Total visible</span>
              <strong className="mono costs-summary-total">
                {formatCOP(totals.all)}
              </strong>
              <span className="muted" style={{ marginLeft: '0.75rem' }}>
                · Total global
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
