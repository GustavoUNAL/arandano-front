import { useCallback, useEffect, useState } from 'react'
import { fetchCashCloseCalendar } from '../api'
import { CashClosePanel } from './CashClosePanel'
import { MonthCalendar } from './MonthCalendar'
import { ViewBootSplash } from './DataLoadingSplash'
import { useFirstName } from '../hooks/useSessionUser'
import { namedCopy } from '../lib/userIdentity'
import {
  getOpenPosTables,
  type OpenPosTableSnapshot,
} from '../pos/lib/openTablesSnapshot'
import { mobileViewClass } from './mobile/mobileView'

function localDateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatCOP(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', { timeStyle: 'short' }).format(d)
}

type Props = {
  baseUrl: string
  companyName?: string | null
  inaugurationDate?: string | null
  onOpenSales?: (date: string) => void
  onOpenPurchases?: (date: string) => void
  onOpenPos?: (tableId?: string) => void
}

export function CashCloseManager({
  baseUrl,
  companyName,
  inaugurationDate = null,
  onOpenSales,
  onOpenPurchases,
  onOpenPos,
}: Props) {
  const now = new Date()
  const [calendarYear, setCalendarYear] = useState(now.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState(localDateKey())
  const [cashCloseCalendar, setCashCloseCalendar] = useState<
    Awaited<ReturnType<typeof fetchCashCloseCalendar>> | null
  >(null)
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const [panelRefreshKey, setPanelRefreshKey] = useState(0)
  const [openPosTables, setOpenPosTables] = useState<OpenPosTableSnapshot[]>(() =>
    getOpenPosTables(),
  )
  const first = useFirstName()

  const shiftMonth = (delta: number) => {
    const d = new Date(calendarYear, calendarMonth - 1 + delta, 1)
    setCalendarYear(d.getFullYear())
    setCalendarMonth(d.getMonth() + 1)
  }

  const goToday = () => {
    const today = new Date()
    setCalendarYear(today.getFullYear())
    setCalendarMonth(today.getMonth() + 1)
    setSelectedDate(localDateKey(today))
  }

  useEffect(() => {
    const refresh = () => setOpenPosTables(getOpenPosTables())
    refresh()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])

  useEffect(() => {
    let cancelled = false
    setCalendarLoading(true)
    setCalendarError(null)

    void fetchCashCloseCalendar(baseUrl, calendarYear, calendarMonth)
      .then((calendar) => {
        if (!cancelled) setCashCloseCalendar(calendar)
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setCalendarError(e.message)
          setCashCloseCalendar(null)
        }
      })
      .finally(() => {
        if (!cancelled) setCalendarLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [baseUrl, calendarYear, calendarMonth, panelRefreshKey])

  const handleSaved = useCallback(() => {
    setPanelRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className={mobileViewClass('cash-close', 'cash-close-manager')}>
      <header className="cash-close-manager__head">
        <div>
          <h1 className="cash-close-manager__title">Cierre del día</h1>
          <p className="cash-close-manager__lead muted">
            {namedCopy(
              first,
              '{name}, seleccione un día en el calendario para registrar el arqueo. El cierre es a las 11:59 p. m.',
              'Seleccione un día en el calendario para registrar el arqueo. El cierre es a las 11:59 p. m.',
            )}
          </p>
        </div>
      </header>

      {onOpenPos && openPosTables.length > 0 ? (
        <section className="cash-close-manager__pos-alert" aria-label="Mesas abiertas en punto de venta">
          <div className="cash-close-manager__pos-alert-head">
            <div>
              <h2 className="cash-close-manager__pos-alert-title">Mesas abiertas en punto de venta</h2>
              <p className="muted small">
                {openPosTables.length} comanda
                {openPosTables.length !== 1 ? 's' : ''} pendiente
                {openPosTables.length !== 1 ? 's' : ''} de cobro
              </p>
            </div>
            <button
              type="button"
              className="btn-primary btn-compact"
              onClick={() => onOpenPos()}
            >
              Ir al punto de venta
            </button>
          </div>
          <ul className="cash-close-manager__open-tables">
            {openPosTables.map((table) => (
              <li key={table.tableId} className="cash-close-manager__open-table">
                <div>
                  <span className="cash-close-manager__open-table-name">{table.tableName}</span>
                  <span className="muted small">
                    {table.lineCount} {table.lineCount === 1 ? 'producto' : 'productos'}
                    {table.openedAt ? ` · abierta ${formatTime(table.openedAt)}` : ''}
                  </span>
                </div>
                <div className="cash-close-manager__open-table-actions">
                  <strong className="mono">{formatCOP(table.totalCOP)}</strong>
                  <button
                    type="button"
                    className="btn-secondary btn-compact"
                    onClick={() => onOpenPos(table.tableId)}
                  >
                    Continuar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="cash-close-manager__layout">
        <aside className="cash-close-manager__calendars" aria-label="Calendario del mes">
          <div className="cash-close-manager__calendar-card">
            <MonthCalendar
              year={calendarYear}
              month={calendarMonth}
              days={cashCloseCalendar?.days ?? []}
              loading={calendarLoading && !cashCloseCalendar}
              error={calendarError}
              countLabel="venta"
              showZeroForPastDays
              selectedDate={selectedDate}
              inaugurationDate={inaugurationDate}
              onDayClick={setSelectedDate}
              onPrevMonth={() => shiftMonth(-1)}
              onNextMonth={() => shiftMonth(1)}
              onToday={goToday}
            />
            <ul className="cash-close-manager__legend" aria-label="Estado del cierre">
              <li>
                <span className="cash-close-manager__legend-dot cash-close-manager__legend-dot--closed" />
                Cerrado
              </li>
              <li>
                <span className="cash-close-manager__legend-dot cash-close-manager__legend-dot--draft" />
                Borrador
              </li>
              <li>
                <span className="cash-close-manager__legend-dot cash-close-manager__legend-dot--open" />
                Abierto
              </li>
            </ul>
            {cashCloseCalendar ? (
              <p className="cash-close-manager__calendar-meta muted small">
                {cashCloseCalendar.totals.closedDays} día
                {cashCloseCalendar.totals.closedDays !== 1 ? 's' : ''} cerrado
                {cashCloseCalendar.totals.closedDays !== 1 ? 's' : ''} este mes
              </p>
            ) : null}
          </div>
        </aside>

        <div className="cash-close-manager__detail">
          {calendarLoading && !cashCloseCalendar ? (
            <ViewBootSplash ready={false} label="Cargando cierre del día…" />
          ) : (
            <CashClosePanel
              baseUrl={baseUrl}
              date={selectedDate}
              refreshKey={panelRefreshKey}
              companyName={companyName}
              onOpenSales={onOpenSales}
              onOpenPurchases={onOpenPurchases}
              onSaved={handleSaved}
              showArqueo
            />
          )}
        </div>
      </div>
    </div>
  )
}
