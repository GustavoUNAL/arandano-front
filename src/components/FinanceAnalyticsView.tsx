import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchFinancialAnalytics,
  type AnalyticsGranularity,
  type FinancialAnalyticsOverview,
} from '../api'
import { formatCOP } from '../lib/money'
import { ViewBootSplash } from './DataLoadingSplash'

function bogotaToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
  }).format(new Date())
}

function monthRange(): { from: string; to: string } {
  const today = bogotaToday()
  const [y, m] = today.split('-').map(Number)
  const from = `${y}-${String(m).padStart(2, '0')}-01`
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const to = `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`
  return { from, to }
}

const GRANULARITY_LABEL: Record<AnalyticsGranularity, string> = {
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
}

export function FinanceAnalyticsView({ baseUrl }: { baseUrl: string }) {
  const defaultRange = useMemo(() => monthRange(), [])
  const [dateFrom, setDateFrom] = useState(defaultRange.from)
  const [dateTo, setDateTo] = useState(defaultRange.to)
  const [granularity, setGranularity] = useState<AnalyticsGranularity>('day')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<FinancialAnalyticsOverview | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchFinancialAnalytics(baseUrl, {
        dateFrom,
        dateTo,
        granularity,
      })
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar análisis')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, dateFrom, dateTo, granularity])

  useEffect(() => {
    void load()
  }, [load])

  const chartMax = useMemo(() => {
    if (!data?.combined.length) return 1
    return Math.max(
      1,
      ...data.combined.map((r) =>
        Math.max(r.salesCOP, r.purchasesCOP, r.staffPayCOP, Math.abs(r.netCOP)),
      ),
    )
  }, [data])

  const summary = data?.summary

  const setPreset = (kind: 'today' | 'week' | 'month') => {
    const today = bogotaToday()
    if (kind === 'today') {
      setDateFrom(today)
      setDateTo(today)
      setGranularity('day')
      return
    }
    if (kind === 'week') {
      const [y, m, d] = today.split('-').map(Number)
      const noon = new Date(`${today}T12:00:00-05:00`)
      const dow = noon.getUTCDay()
      const mondayOffset = dow === 0 ? -6 : 1 - dow
      const monday = new Date(Date.UTC(y, m - 1, d + mondayOffset))
      const from = monday.toISOString().slice(0, 10)
      setDateFrom(from)
      setDateTo(today)
      setGranularity('day')
      return
    }
    const range = monthRange()
    setDateFrom(range.from)
    setDateTo(range.to)
    setGranularity('day')
  }

  return (
    <div className="finance-analytics page-pane">
      <header className="finance-analytics__head">
        <div>
          <h1 className="finance-analytics__title">Análisis financiero</h1>
          <p className="muted finance-analytics__lead">
            Ventas, compras, Nequi y caja por día, semana o mes.
          </p>
        </div>
        <div className="view-toggle finance-analytics__granularity" role="group" aria-label="Agrupación">
          {(['day', 'week', 'month'] as const).map((g) => (
            <button
              key={g}
              type="button"
              className={granularity === g ? 'active' : ''}
              onClick={() => setGranularity(g)}
            >
              {GRANULARITY_LABEL[g]}
            </button>
          ))}
        </div>
      </header>

      <div className="finance-analytics__presets" role="group" aria-label="Rangos rápidos">
        <button type="button" className="btn-secondary btn-compact" onClick={() => setPreset('today')}>
          Hoy
        </button>
        <button type="button" className="btn-secondary btn-compact" onClick={() => setPreset('week')}>
          Esta semana
        </button>
        <button type="button" className="btn-secondary btn-compact" onClick={() => setPreset('month')}>
          Este mes
        </button>
      </div>

      <div className="finance-analytics__filters">
        <label className="field-stack">
          <span>Desde</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="field-stack">
          <span>Hasta</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <button type="button" className="btn-secondary" onClick={() => void load()} disabled={loading}>
          Actualizar
        </button>
      </div>

      {error ? (
        <p className="banner-warn" role="alert">
          {error}
        </p>
      ) : null}

      <section className="finance-analytics__kpi-grid" aria-label="Resumen del periodo">
        <article className="finance-analytics__kpi finance-analytics__kpi--sales">
          <span className="finance-analytics__kpi-label">Ventas</span>
          <strong>{loading ? '…' : formatCOP(summary?.salesCOP ?? 0)}</strong>
          <span className="muted small">
            {loading ? '' : `${data?.sales.totals.count ?? 0} operaciones`}
          </span>
        </article>
        <article className="finance-analytics__kpi finance-analytics__kpi--nequi">
          <span className="finance-analytics__kpi-label">Nequi</span>
          <strong>{loading ? '…' : formatCOP(summary?.nequiCOP ?? 0)}</strong>
          <span className="muted small">Transferencias</span>
        </article>
        <article className="finance-analytics__kpi finance-analytics__kpi--cash">
          <span className="finance-analytics__kpi-label">Caja / efectivo</span>
          <strong>{loading ? '…' : formatCOP(summary?.cashCOP ?? 0)}</strong>
          <span className="muted small">Efectivo recibido</span>
        </article>
        <article className="finance-analytics__kpi finance-analytics__kpi--purchases">
          <span className="finance-analytics__kpi-label">Compras</span>
          <strong>{loading ? '…' : formatCOP(summary?.purchasesCOP ?? 0)}</strong>
          <span className="muted small">
            {loading ? '' : `${data?.purchases.totals.count ?? 0} lotes`}
          </span>
        </article>
        <article className="finance-analytics__kpi finance-analytics__kpi--staff">
          <span className="finance-analytics__kpi-label">Nómina</span>
          <strong>{loading ? '…' : formatCOP(summary?.staffPayCOP ?? 0)}</strong>
          <span className="muted small">
            {loading ? '' : `${data?.staff.totals.shiftCount ?? 0} turnos`}
          </span>
        </article>
        <article
          className={`finance-analytics__kpi finance-analytics__kpi--net${(summary?.netCOP ?? 0) < 0 ? ' finance-analytics__kpi--negative' : ''}`}
        >
          <span className="finance-analytics__kpi-label">Neto</span>
          <strong>{loading ? '…' : formatCOP(summary?.netCOP ?? 0)}</strong>
          <span className="muted small">Ventas − compras − nómina</span>
        </article>
      </section>

      {!loading && data && data.combined.length > 0 ? (
        <section className="finance-analytics__panel" aria-label="Gráfico por periodo">
          <div className="finance-analytics__panel-head">
            <h2>Por {GRANULARITY_LABEL[granularity].toLowerCase()}</h2>
            <div className="finance-analytics__legend">
              <span className="finance-analytics__legend-item finance-analytics__legend-item--sales">
                Ventas
              </span>
              <span className="finance-analytics__legend-item finance-analytics__legend-item--purchases">
                Compras
              </span>
              <span className="finance-analytics__legend-item finance-analytics__legend-item--staff">
                Nómina
              </span>
            </div>
          </div>
          <div className="finance-analytics__chart">
            {data.combined.map((row) => (
              <div key={row.period} className="finance-analytics__chart-row">
                <span className="finance-analytics__chart-label">{row.label}</span>
                <div className="finance-analytics__chart-bars">
                  <span
                    className="finance-analytics__bar finance-analytics__bar--sales"
                    style={{ width: `${(row.salesCOP / chartMax) * 100}%` }}
                    title={`Ventas: ${formatCOP(row.salesCOP)}`}
                  />
                  <span
                    className="finance-analytics__bar finance-analytics__bar--purchases"
                    style={{ width: `${(row.purchasesCOP / chartMax) * 100}%` }}
                    title={`Compras: ${formatCOP(row.purchasesCOP)}`}
                  />
                  <span
                    className="finance-analytics__bar finance-analytics__bar--staff"
                    style={{ width: `${(row.staffPayCOP / chartMax) * 100}%` }}
                    title={`Nómina: ${formatCOP(row.staffPayCOP)}`}
                  />
                </div>
                <span
                  className={`finance-analytics__chart-net mono${row.netCOP < 0 ? ' finance-analytics__chart-net--negative' : ''}`}
                >
                  {formatCOP(row.netCOP)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="finance-analytics__panel">
        <div className="finance-analytics__panel-head">
          <h2>Detalle por periodo</h2>
        </div>
        <div className="data-table-wrap finance-analytics__table-wrap">
          <table className="data-table finance-analytics__table">
            <thead>
              <tr>
                <th>Periodo</th>
                <th className="num">Ventas</th>
                <th className="num">Nequi</th>
                <th className="num">Caja</th>
                <th className="num">Compras</th>
                <th className="num">Neto</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="muted">
                    Cargando…
                  </td>
                </tr>
              ) : !data?.combined.length ? (
                <tr>
                  <td colSpan={6} className="muted">
                    Sin movimientos en el rango seleccionado.
                  </td>
                </tr>
              ) : (
                data.combined.map((row) => (
                  <tr key={row.period}>
                    <td>{row.label}</td>
                    <td className="num mono">
                      {formatCOP(row.salesCOP)}
                      <span className="muted small"> · {row.salesCount}</span>
                    </td>
                    <td className="num mono">{formatCOP(row.nequiCOP)}</td>
                    <td className="num mono">{formatCOP(row.cashCOP)}</td>
                    <td className="num mono">
                      {formatCOP(row.purchasesCOP)}
                      <span className="muted small"> · {row.purchasesCount}</span>
                    </td>
                    <td
                      className={`num mono${row.netCOP < 0 ? ' finance-analytics__net--negative' : ''}`}
                    >
                      {formatCOP(row.netCOP)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <ul className="finance-analytics__mobile-cards" aria-label="Detalle móvil">
          {!loading &&
            data?.combined.map((row) => (
              <li key={`m-${row.period}`} className="finance-analytics__mobile-card">
                <strong>{row.label}</strong>
                <div className="finance-analytics__mobile-grid">
                  <span>
                    Ventas <em className="mono">{formatCOP(row.salesCOP)}</em>
                  </span>
                  <span>
                    Nequi <em className="mono">{formatCOP(row.nequiCOP)}</em>
                  </span>
                  <span>
                    Caja <em className="mono">{formatCOP(row.cashCOP)}</em>
                  </span>
                  <span>
                    Compras <em className="mono">{formatCOP(row.purchasesCOP)}</em>
                  </span>
                  <span className={row.netCOP < 0 ? 'finance-analytics__net--negative' : ''}>
                    Neto <em className="mono">{formatCOP(row.netCOP)}</em>
                  </span>
                </div>
              </li>
            ))}
        </ul>
      </section>

      <ViewBootSplash ready={!loading} label="Cargando análisis financiero…" />
    </div>
  )
}
