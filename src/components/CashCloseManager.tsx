import { useCallback, useEffect, useState } from 'react'
import {
  fetchPurchaseLotsCalendar,
  fetchSalesCalendar,
} from '../api'
import { useMatchMedia } from '../hooks/useMatchMedia'
import { MOBILE_FILTER_BREAKPOINT } from './MobileAwareFilterBar'
import { CashClosePanel } from './CashClosePanel'
import { MonthCalendar } from './MonthCalendar'
import { ViewBootSplash } from './DataLoadingSplash'
import {
  getOpenPosTables,
  type OpenPosTableSnapshot,
} from '../pos/lib/openTablesSnapshot'

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
  const isMobile = useMatchMedia(MOBILE_FILTER_BREAKPOINT)
  const now = new Date()
  const [calendarYear, setCalendarYear] = useState(now.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState(localDateKey())
  const [salesCalendar, setSalesCalendar] = useState<
    Awaited<ReturnType<typeof fetchSalesCalendar>> | null
  >(null)
  const [purchasesCalendar, setPurchasesCalendar] = useState<
    Awaited<ReturnType<typeof fetchPurchaseLotsCalendar>> | null
  >(null)
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const [panelRefreshKey, setPanelRefreshKey] = useState(0)
  const [openPosTables, setOpenPosTables] = useState<OpenPosTableSnapshot[]>(() =>
    getOpenPosTables(),
  )

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
    const purchasesPromise = isMobile
      ? Promise.resolve(null)
      : fetchPurchaseLotsCalendar(baseUrl, calendarYear, calendarMonth)

    void Promise.all([
      fetchSalesCalendar(baseUrl, calendarYear, calendarMonth),
      purchasesPromise,
    ])
      .then(([sales, purchases]) => {
        if (cancelled) return
        setSalesCalendar(sales)
        setPurchasesCalendar(purchases)
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setCalendarError(e.message)
          setSalesCalendar(null)
          setPurchasesCalendar(null)
        }
      })
      .finally(() => {
        if (!cancelled) setCalendarLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [baseUrl, calendarYear, calendarMonth, isMobile, panelRefreshKey])

  const handleSaved = useCallback(() => {
    setPanelRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="cash-close-manager">
      <header className="cash-close-manager__head">
        <div>
          <h1 className="cash-close-manager__title">Cierre del día</h1>
          <p className="cash-close-manager__lead muted">
            Resumen de ventas y actividad del día
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
        <aside className="cash-close-manager__calendars" aria-label="Calendarios del mes">
          <div className="cash-close-manager__calendar-block">
            <MonthCalendar
              year={calendarYear}
              month={calendarMonth}
              days={salesCalendar?.days ?? []}
              loading={calendarLoading && !salesCalendar}
              error={calendarError}
              countLabel="venta"
              showZeroForPastDays
              selectedDate={selectedDate}
              inaugurationDate={inaugurationDate}
              onDayClick={setSelectedDate}
              onPrevMonth={() => shiftMonth(-1)}
              onNextMonth={() => shiftMonth(1)}
              onToday={goToday}
              hideNav={isMobile}
            />
          </div>
          {!isMobile ? (
            <div className="cash-close-manager__calendar-block">
              <MonthCalendar
                year={calendarYear}
                month={calendarMonth}
                days={purchasesCalendar?.days ?? []}
                loading={calendarLoading && !purchasesCalendar}
                error={null}
                countLabel="compra"
                showZeroForPastDays
                selectedDate={selectedDate}
                inaugurationDate={inaugurationDate}
                onDayClick={setSelectedDate}
                onPrevMonth={() => shiftMonth(-1)}
                onNextMonth={() => shiftMonth(1)}
                onToday={goToday}
              />
            </div>
          ) : null}
        </aside>

        <div className="cash-close-manager__detail">
          {calendarLoading && !salesCalendar ? (
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
