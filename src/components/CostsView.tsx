import { useCallback, useEffect, useState } from 'react'
import { fetchRecipeCosts, type RecipeCostLineRow } from '../api'

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

  const totalAll =
    data != null
      ? num(data.totals.fixedCOP) + num(data.totals.variableCOP)
      : NaN

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

        <div className="costs-toolbar">
          <button
            type="button"
            className="btn-secondary btn-compact"
            onClick={() => void load()}
            disabled={loading}
          >
            Actualizar
          </button>
        </div>

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
                  {formatCOP(data.totals.fixedCOP)}
                </span>
              </div>
              <CostTable
                rows={data.fixed}
                emptyLabel="No hay líneas de costo fijo registradas."
              />
            </section>

            <section className="cost-section" aria-labelledby="costs-var-h">
              <div className="cost-section-head">
                <h3 id="costs-var-h" className="cost-section-title cost-section-title--var">
                  Costos variables
                </h3>
                <span className="cost-section-total mono">
                  {formatCOP(data.totals.variableCOP)}
                </span>
              </div>
              <CostTable
                rows={data.variable}
                emptyLabel="No hay líneas de costo variable registradas."
              />
            </section>

            <div className="costs-summary-bar">
              <span className="muted">Suma fijos + variables</span>
              <strong className="mono costs-summary-total">
                {formatCOP(totalAll)}
              </strong>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
