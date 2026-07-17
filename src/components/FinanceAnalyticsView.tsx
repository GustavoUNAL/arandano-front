import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchFinancialAnalytics,
  fetchMonthUtilities,
  upsertMonthUtilities,
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

function monthRange(ref = bogotaToday()): { from: string; to: string } {
  const [y, m] = ref.split('-').map(Number)
  const from = `${y}-${String(m).padStart(2, '0')}-01`
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const to = `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`
  return { from, to }
}

function shiftMonth(ref: string, delta: number): string {
  const [y, m] = ref.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

function mondayOf(ref: string): string {
  const [y, m, d] = ref.split('-').map(Number)
  const noon = new Date(`${ref}T12:00:00-05:00`)
  const dow = noon.getUTCDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  return new Date(Date.UTC(y, m - 1, d + mondayOffset)).toISOString().slice(0, 10)
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

function toMonthInput(isoDate: string): string {
  return isoDate.slice(0, 7)
}

function parseMoneyInput(raw: string): number {
  const n = Number(String(raw).replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0
}

const GRANULARITY_LABEL: Record<AnalyticsGranularity, string> = {
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
}

export function FinanceAnalyticsView({ baseUrl }: { baseUrl: string }) {
  const today = bogotaToday()
  const [dateFrom, setDateFrom] = useState('2025-01-01')
  const [dateTo, setDateTo] = useState(() => bogotaToday())
  const [granularity, setGranularity] = useState<AnalyticsGranularity>('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<FinancialAnalyticsOverview | null>(null)
  const [initialized, setInitialized] = useState(false)

  const [utilMonth, setUtilMonth] = useState(() => toMonthInput(today))
  const [agua, setAgua] = useState('')
  const [energia, setEnergia] = useState('')
  const [internet, setInternet] = useState('')
  const [utilSaving, setUtilSaving] = useState(false)
  const [utilMsg, setUtilMsg] = useState<string | null>(null)

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
      if (!initialized && res.dataBounds) {
        setInitialized(true)
        if (
          res.dataBounds.dateFrom !== dateFrom ||
          res.dataBounds.dateTo !== dateTo
        ) {
          setDateFrom(res.dataBounds.dateFrom)
          setDateTo(res.dataBounds.dateTo)
        }
      } else if (!initialized) {
        setInitialized(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar análisis')
      setData(null)
      setInitialized(true)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, dateFrom, dateTo, granularity, initialized])

  useEffect(() => {
    void load()
  }, [load])

  const loadUtilities = useCallback(async () => {
    try {
      const snap = await fetchMonthUtilities(baseUrl, utilMonth)
      setAgua(snap.aguaCOP ? String(snap.aguaCOP) : '')
      setEnergia(snap.energiaCOP ? String(snap.energiaCOP) : '')
      setInternet(snap.internetCOP ? String(snap.internetCOP) : '')
    } catch {
      /* empty form if none */
    }
  }, [baseUrl, utilMonth])

  useEffect(() => {
    void loadUtilities()
  }, [loadUtilities])

  const chartMax = useMemo(() => {
    if (!data?.combined.length) return 1
    return Math.max(
      1,
      ...data.combined.map((r) =>
        Math.max(
          r.salesCOP,
          r.purchasesCOP,
          r.staffPayCOP,
          r.utilitiesCOP ?? 0,
          Math.abs(r.netCOP),
        ),
      ),
    )
  }, [data])

  const summary = data?.summary
  const utilitiesTotal = summary?.utilitiesCOP ?? 0
  const outflows =
    summary?.outflowsCOP ??
    (summary?.purchasesCOP ?? 0) + (summary?.staffPayCOP ?? 0) + utilitiesTotal
  const inflows = summary?.inflowsCOP ?? summary?.salesCOP ?? 0

  const setPreset = (
    kind: 'today' | 'week' | 'lastWeek' | 'month' | 'prevMonth' | 'all',
  ) => {
    setInitialized(true)
    if (kind === 'today') {
      setDateFrom(today)
      setDateTo(today)
      setGranularity('day')
      return
    }
    if (kind === 'week') {
      const monday = mondayOf(today)
      setDateFrom(monday)
      setDateTo(addDays(monday, 6))
      setGranularity('day')
      return
    }
    if (kind === 'lastWeek') {
      const monday = addDays(mondayOf(today), -7)
      setDateFrom(monday)
      setDateTo(addDays(monday, 6))
      setGranularity('day')
      return
    }
    if (kind === 'prevMonth') {
      const range = monthRange(shiftMonth(today, -1))
      setDateFrom(range.from)
      setDateTo(range.to)
      setGranularity('week')
      return
    }
    if (kind === 'all') {
      if (data?.dataBounds) {
        setDateFrom(data.dataBounds.dateFrom)
        setDateTo(data.dataBounds.dateTo)
      } else {
        setDateFrom('2025-01-01')
        setDateTo(today)
      }
      setGranularity('month')
      return
    }
    const range = monthRange(today)
    setDateFrom(range.from)
    setDateTo(range.to)
    setGranularity('week')
  }

  const saveUtilities = async () => {
    setUtilSaving(true)
    setUtilMsg(null)
    try {
      await upsertMonthUtilities(baseUrl, {
        expenseMonth: utilMonth,
        aguaCOP: parseMoneyInput(agua),
        energiaCOP: parseMoneyInput(energia),
        internetCOP: parseMoneyInput(internet),
      })
      setUtilMsg('Servicios guardados')
      await load()
    } catch (e) {
      setUtilMsg(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setUtilSaving(false)
    }
  }

  return (
    <div className="finance-analytics page-pane">
      <header className="finance-analytics__head">
        <div>
          <h1 className="finance-analytics__title">Análisis financiero</h1>
          <p className="muted finance-analytics__lead">
            Entradas, salidas y utilidad estimada por día, semana o mes — desde los
            primeros datos.
          </p>
        </div>
        <div className="view-toggle finance-analytics__granularity" role="group" aria-label="Agrupación">
          {(['day', 'week', 'month'] as const).map((g) => (
            <button
              key={g}
              type="button"
              className={granularity === g ? 'active' : ''}
              onClick={() => {
                setGranularity(g)
                setInitialized(true)
              }}
            >
              {GRANULARITY_LABEL[g]}
            </button>
          ))}
        </div>
      </header>

      <div className="finance-analytics__presets" role="group" aria-label="Rangos rápidos">
        <button type="button" className="btn-secondary btn-compact" onClick={() => setPreset('all')}>
          Todo el historial
        </button>
        <button type="button" className="btn-secondary btn-compact" onClick={() => setPreset('month')}>
          Este mes
        </button>
        <button type="button" className="btn-secondary btn-compact" onClick={() => setPreset('prevMonth')}>
          Mes pasado
        </button>
        <button type="button" className="btn-secondary btn-compact" onClick={() => setPreset('week')}>
          Esta semana
        </button>
        <button type="button" className="btn-secondary btn-compact" onClick={() => setPreset('lastWeek')}>
          Semana pasada
        </button>
        <button type="button" className="btn-secondary btn-compact" onClick={() => setPreset('today')}>
          Hoy
        </button>
      </div>

      <div className="finance-analytics__filters">
        <label className="field-stack">
          <span>Desde</span>
          <input type="date" value={dateFrom} onChange={(e) => {
            setDateFrom(e.target.value)
            setInitialized(true)
          }} />
        </label>
        <label className="field-stack">
          <span>Hasta</span>
          <input type="date" value={dateTo} onChange={(e) => {
            setDateTo(e.target.value)
            setInitialized(true)
          }} />
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

      <section className="finance-analytics__flow" aria-label="Entradas y salidas">
        <article className="finance-analytics__flow-card finance-analytics__flow-card--in">
          <span className="finance-analytics__kpi-label">Entradas (ventas)</span>
          <strong>{loading ? '…' : formatCOP(inflows)}</strong>
          <ul className="finance-analytics__flow-list">
            <li>
              Nequi <em>{formatCOP(summary?.nequiCOP ?? 0)}</em>
            </li>
            <li>
              Caja <em>{formatCOP(summary?.cashCOP ?? 0)}</em>
            </li>
            <li>
              Otros <em>{formatCOP(summary?.otherPayCOP ?? 0)}</em>
            </li>
          </ul>
        </article>
        <article className="finance-analytics__flow-card finance-analytics__flow-card--out">
          <span className="finance-analytics__kpi-label">Salidas</span>
          <strong>{loading ? '…' : formatCOP(outflows)}</strong>
          <ul className="finance-analytics__flow-list">
            <li>
              Compras <em>{formatCOP(summary?.purchasesCOP ?? 0)}</em>
            </li>
            <li>
              Nómina <em>{formatCOP(summary?.staffPayCOP ?? 0)}</em>
            </li>
            <li>
              Servicios <em>{formatCOP(utilitiesTotal)}</em>
            </li>
          </ul>
        </article>
        <article
          className={`finance-analytics__flow-card finance-analytics__flow-card--net${(summary?.netCOP ?? 0) < 0 ? ' finance-analytics__flow-card--negative' : ''}`}
        >
          <span className="finance-analytics__kpi-label">Utilidad estimada</span>
          <strong>{loading ? '…' : formatCOP(summary?.netCOP ?? 0)}</strong>
          <p className="muted small">Entradas − compras − nómina − servicios</p>
        </article>
      </section>

      <section className="finance-analytics__kpi-grid" aria-label="Detalle del resumen">
        <article className="finance-analytics__kpi finance-analytics__kpi--sales">
          <span className="finance-analytics__kpi-label">Ventas</span>
          <strong>{loading ? '…' : formatCOP(summary?.salesCOP ?? 0)}</strong>
          <span className="muted small">
            {loading ? '' : `${data?.sales.totals.count ?? 0} ops`}
          </span>
        </article>
        <article className="finance-analytics__kpi finance-analytics__kpi--purchases">
          <span className="finance-analytics__kpi-label">Compras</span>
          <strong>{loading ? '…' : formatCOP(summary?.purchasesCOP ?? 0)}</strong>
        </article>
        <article className="finance-analytics__kpi finance-analytics__kpi--staff">
          <span className="finance-analytics__kpi-label">Nómina</span>
          <strong>{loading ? '…' : formatCOP(summary?.staffPayCOP ?? 0)}</strong>
          <span className="muted small">
            {loading ? '' : `${data?.staff.totals.shiftCount ?? 0} turnos`}
          </span>
        </article>
        <article className="finance-analytics__kpi finance-analytics__kpi--utilities">
          <span className="finance-analytics__kpi-label">Servicios</span>
          <strong>{loading ? '…' : formatCOP(utilitiesTotal)}</strong>
          <span className="muted small">
            Agua {formatCOP(summary?.aguaCOP ?? 0)} · Energía{' '}
            {formatCOP(summary?.energiaCOP ?? 0)} · Internet{' '}
            {formatCOP(summary?.internetCOP ?? 0)}
          </span>
        </article>
      </section>

      <section className="finance-analytics__panel finance-analytics__utilities" aria-label="Registrar servicios">
        <div className="finance-analytics__panel-head">
          <h2>Servicios del mes</h2>
          <p className="muted small">Agua, energía e internet entran al cálculo de utilidad.</p>
        </div>
        <div className="finance-analytics__util-form">
          <label className="field-stack">
            <span>Mes</span>
            <input
              type="month"
              value={utilMonth}
              onChange={(e) => setUtilMonth(e.target.value)}
            />
          </label>
          <label className="field-stack">
            <span>Agua</span>
            <input
              inputMode="numeric"
              placeholder="0"
              value={agua}
              onChange={(e) => setAgua(e.target.value)}
            />
          </label>
          <label className="field-stack">
            <span>Energía</span>
            <input
              inputMode="numeric"
              placeholder="0"
              value={energia}
              onChange={(e) => setEnergia(e.target.value)}
            />
          </label>
          <label className="field-stack">
            <span>Internet</span>
            <input
              inputMode="numeric"
              placeholder="0"
              value={internet}
              onChange={(e) => setInternet(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            disabled={utilSaving}
            onClick={() => void saveUtilities()}
          >
            {utilSaving ? 'Guardando…' : 'Guardar servicios'}
          </button>
        </div>
        {utilMsg ? (
          <p className="muted small finance-analytics__util-msg" role="status">
            {utilMsg}
          </p>
        ) : null}
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
              <span className="finance-analytics__legend-item finance-analytics__legend-item--utilities">
                Servicios
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
                  <span
                    className="finance-analytics__bar finance-analytics__bar--utilities"
                    style={{ width: `${((row.utilitiesCOP ?? 0) / chartMax) * 100}%` }}
                    title={`Servicios: ${formatCOP(row.utilitiesCOP ?? 0)}`}
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
                <th className="num">Entradas</th>
                <th className="num">Compras</th>
                <th className="num">Nómina</th>
                <th className="num">Servicios</th>
                <th className="num">Utilidad</th>
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
                      <span className="muted small">
                        {' '}
                        · N {formatCOP(row.nequiCOP)} · C {formatCOP(row.cashCOP)}
                      </span>
                    </td>
                    <td className="num mono">{formatCOP(row.purchasesCOP)}</td>
                    <td className="num mono">{formatCOP(row.staffPayCOP)}</td>
                    <td className="num mono">{formatCOP(row.utilitiesCOP ?? 0)}</td>
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
                    Entradas <em className="mono">{formatCOP(row.salesCOP)}</em>
                  </span>
                  <span>
                    Compras <em className="mono">{formatCOP(row.purchasesCOP)}</em>
                  </span>
                  <span>
                    Nómina <em className="mono">{formatCOP(row.staffPayCOP)}</em>
                  </span>
                  <span>
                    Servicios <em className="mono">{formatCOP(row.utilitiesCOP ?? 0)}</em>
                  </span>
                  <span>
                    Nequi <em className="mono">{formatCOP(row.nequiCOP)}</em>
                  </span>
                  <span>
                    Caja <em className="mono">{formatCOP(row.cashCOP)}</em>
                  </span>
                  <span
                    className={`finance-analytics__mobile-net${row.netCOP < 0 ? ' finance-analytics__net--negative' : ''}`}
                  >
                    Utilidad <em className="mono">{formatCOP(row.netCOP)}</em>
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
