import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { AuthUser } from '../api'
import { Button } from '../components/ui/button'
import {
  bookingApi,
  formatCOP,
  hhmm,
  publicBookingUrl,
  STATUS_LABEL,
  type BookingAppointment,
  type BookingBlock,
  type BookingCustomer,
  type BookingHours,
  type BookingService,
  type BookingSettings,
  type BookingStaff,
  type BookingStatus,
} from './bookingApi'
import {
  addDays,
  BOOKING_MORE,
  BOOKING_NAV,
  BOOKING_MOBILE_DOCK,
  localYmd,
  WEEKDAYS,
  type BookingView,
} from './bookingNav'
import './booking.css'

type Props = {
  user: AuthUser
  baseUrl: string
  view: BookingView
  onNavigate: (v: BookingView) => void
  onLogout: () => void
  showHome?: boolean
  onHome?: () => void
  embedded?: boolean
}

export function BookingApp({
  user,
  baseUrl,
  view,
  onNavigate,
  onLogout,
  showHome,
  onHome,
  embedded,
}: Props) {
  const [composer, setComposer] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [day, setDay] = useState(localYmd())
  const [weekMode, setWeekMode] = useState(false)
  const [appts, setAppts] = useState<BookingAppointment[]>([])
  const [weekAppts, setWeekAppts] = useState<BookingAppointment[]>([])
  const [services, setServices] = useState<BookingService[]>([])
  const [staff, setStaff] = useState<BookingStaff[]>([])
  const [customers, setCustomers] = useState<BookingCustomer[]>([])
  const [hours, setHours] = useState<BookingHours[]>([])
  const [blocks, setBlocks] = useState<BookingBlock[]>([])
  const [settings, setSettings] = useState<BookingSettings | null>(null)
  const [pending, setPending] = useState<BookingAppointment[]>([])

  const screen: BookingView =
    view === 'home' || view === 'booking' ? 'agenda' : view

  async function refreshAll() {
    const [s, st, c, h, b, set] = await Promise.all([
      bookingApi.services(baseUrl),
      bookingApi.staff(baseUrl),
      bookingApi.customers(baseUrl),
      bookingApi.hours(baseUrl),
      bookingApi.blocks(baseUrl).catch(() => [] as BookingBlock[]),
      bookingApi.settings(baseUrl),
    ])
    setServices(s)
    setStaff(
      st.map((x) => ({
        ...x,
        serviceIds: x.serviceIds ?? x.serviceLinks?.map((l) => l.serviceId),
      })),
    )
    setCustomers(c)
    setHours(h)
    setBlocks(b)
    setSettings(set)
  }

  async function refreshDay(d = day) {
    const rows = await bookingApi.appointments(baseUrl, d, d)
    setAppts(rows)
  }

  async function refreshInbox() {
    const from = addDays(localYmd(), -7)
    const to = addDays(localYmd(), 90)
    const rows = await bookingApi.appointments(baseUrl, from, to)
    setPending(rows.filter((a) => a.status === 'PENDING'))
  }

  async function refreshWeek(d = day) {
    const start = addDays(d, -new Date(`${d}T12:00:00`).getDay())
    const end = addDays(start, 6)
    setWeekAppts(await bookingApi.appointments(baseUrl, start, end))
  }

  /* Fetch inicial: el linter no distingue setState async de fetch. */
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    let cancelled = false
    void refreshAll().catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Error')
    })
    return () => {
      cancelled = true
    }
  }, [baseUrl])

  useEffect(() => {
    let cancelled = false
    void Promise.all([refreshDay(day), refreshInbox()]).catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Error')
    })
    if (weekMode) {
      void refreshWeek(day).catch(() => undefined)
    }
    return () => {
      cancelled = true
    }
  }, [baseUrl, day, weekMode])
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  async function patchStatus(id: string, status: BookingStatus) {
    if (status === 'CANCELLED') await bookingApi.cancelAppointment(baseUrl, id)
    else await bookingApi.updateAppointment(baseUrl, id, { status })
    await Promise.all([
      refreshDay(),
      refreshInbox(),
      weekMode ? refreshWeek() : Promise.resolve(),
      refreshAll(),
    ])
  }

  const moreActive = BOOKING_MORE.includes(screen)

  return (
    <div className={`bk${embedded ? ' bk--embedded' : ''}`}>
      {embedded ? (
        <div className="bk__tabs" role="tablist" aria-label="Agenda de citas">
          {BOOKING_NAV.map((n) => (
            <button
              key={n.view}
              type="button"
              role="tab"
              aria-selected={screen === n.view}
              className={`bk__tab${screen === n.view ? ' is-on' : ''}`}
              onClick={() => onNavigate(n.view)}
            >
              {n.label}
            </button>
          ))}
        </div>
      ) : (
      <nav className="bk__dock" aria-label="Agenda de citas">
        {showHome ? (
          <button type="button" onClick={onHome}>
            VOS IA
          </button>
        ) : null}
        {BOOKING_NAV.filter((n) => !BOOKING_MORE.includes(n.view)).map((n) => (
          <button
            key={n.view}
            type="button"
            className={`bk__dock-item${screen === n.view ? ' is-on' : ''} bk__dock-item--desktop`}
            onClick={() => onNavigate(n.view)}
          >
            {n.label}
          </button>
        ))}
        {BOOKING_NAV.filter((n) => BOOKING_MORE.includes(n.view)).map((n) => (
          <button
            key={n.view}
            type="button"
            className={`bk__dock-item${screen === n.view ? ' is-on' : ''} bk__dock-item--desktop`}
            onClick={() => onNavigate(n.view)}
          >
            {n.label}
          </button>
        ))}
        {BOOKING_MOBILE_DOCK.map((v) => {
          const n = BOOKING_NAV.find((x) => x.view === v)!
          return (
            <button
              key={v}
              type="button"
              className={`bk__dock-item${screen === v ? ' is-on' : ''} bk__dock-item--mobile`}
              onClick={() => onNavigate(v)}
            >
              {n.label}
            </button>
          )
        })}
        <button
          type="button"
          className={`bk__dock-item${moreActive ? ' is-on' : ''} bk__dock-item--mobile`}
          onClick={() => setMoreOpen(true)}
        >
          Más
        </button>
      </nav>
      )}

      <div className="bk__main">
        {embedded ? null : (
        <header className="bk__top">
          <div>
            <p className="bk__brand">Agenda de citas</p>
            <strong>{user.companyName}</strong>
          </div>
          <button type="button" className="bk__user" onClick={onLogout}>
            Salir
          </button>
        </header>
        )}
        {error ? <p className="bk__alert">{error}</p> : null}

        {screen === 'agenda' ? (
          <Agenda
            day={day}
            setDay={setDay}
            appts={weekMode ? weekAppts : appts}
            pending={pending}
            weekMode={weekMode}
            setWeekMode={setWeekMode}
            settings={settings}
            onOpenSettings={() => onNavigate('settings')}
            onStatus={patchStatus}
            onReschedule={async (id, date, time) => {
              await bookingApi.updateAppointment(baseUrl, id, { date, time })
              await Promise.all([refreshDay(), weekMode ? refreshWeek() : Promise.resolve()])
            }}
          />
        ) : null}

        {screen === 'appointments' ? (
          <AppointmentsList appts={appts} day={day} setDay={setDay} onStatus={patchStatus} />
        ) : null}

        {screen === 'customers' ? <CustomersList customers={customers} /> : null}
        {screen === 'services' ? (
          <ServicesList
            services={services}
            onSave={async (body, id) => {
              if (id) await bookingApi.updateService(baseUrl, id, body)
              else await bookingApi.createService(baseUrl, body)
              await refreshAll()
            }}
          />
        ) : null}
        {screen === 'professionals' ? (
          <StaffList
            staff={staff}
            services={services}
            onSave={async (body, id) => {
              if (id) await bookingApi.updateStaff(baseUrl, id, body)
              else await bookingApi.createStaff(baseUrl, body)
              await refreshAll()
            }}
          />
        ) : null}
        {screen === 'hours' ? (
          <AvailabilityPane
            hours={hours}
            blocks={blocks}
            staff={staff}
            onSaveHours={async (next, staffId) => {
              await bookingApi.replaceHours(baseUrl, next, staffId)
              await refreshAll()
            }}
            onCreateBlock={async (body) => {
              await bookingApi.createBlock(baseUrl, body)
              await refreshAll()
            }}
            onDeleteBlock={async (id) => {
              await bookingApi.deleteBlock(baseUrl, id)
              await refreshAll()
            }}
          />
        ) : null}
        {screen === 'settings' && settings ? (
          <SettingsPane
            settings={settings}
            onSave={async (body) => {
              setSettings(await bookingApi.updateSettings(baseUrl, body))
            }}
          />
        ) : null}
      </div>

      <button type="button" className="bk__fab" onClick={() => setComposer(true)}>
        + Nueva cita
      </button>

      {moreOpen ? (
        <div className="bk__sheet" role="dialog" aria-label="Más">
          <button type="button" className="bk__ghost" onClick={() => setMoreOpen(false)}>
            Cerrar
          </button>
          <h2>Más</h2>
          {BOOKING_MORE.map((v) => {
            const n = BOOKING_NAV.find((x) => x.view === v)!
            return (
              <button
                key={v}
                type="button"
                className="bk-public__choice"
                onClick={() => {
                  setMoreOpen(false)
                  onNavigate(v)
                }}
              >
                {n.label}
              </button>
            )
          })}
        </div>
      ) : null}

      {composer ? (
        <Composer
          baseUrl={baseUrl}
          services={services.filter((s) => s.active)}
          staff={staff.filter((s) => s.active)}
          customers={customers}
          onClose={() => setComposer(false)}
          onCreated={async () => {
            setComposer(false)
            await Promise.all([refreshAll(), refreshDay()])
            onNavigate('agenda')
          }}
        />
      ) : null}
    </div>
  )
}

function PublicBookingLinkCard({
  settings,
  onOpenSettings,
}: {
  settings: BookingSettings
  onOpenSettings?: () => void
}) {
  const [copied, setCopied] = useState(false)
  const url = publicBookingUrl(settings.publicSlug)
  return (
    <div className="bk__card bk__public-link">
      <p className="bk__meta">Enlace para que cualquiera pida una cita</p>
      <h3 style={{ wordBreak: 'break-all' }}>{url}</h3>
      <p className="bk__meta">
        {settings.publicEnabled
          ? 'Quien abre el enlace ve un calendario, elige día y horario, y envía una solicitud. Tú aceptas o rechazas en Agenda.'
          : 'El enlace está pausado. Actívalo para recibir solicitudes.'}
      </p>
      <div className="bk__actions">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            void navigator.clipboard.writeText(url).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1600)
            })
          }}
        >
          {copied ? 'Copiado' : 'Copiar enlace'}
        </Button>
        <a className="bk__ghost" href={url} target="_blank" rel="noreferrer">
          Abrir
        </a>
        {onOpenSettings ? (
          <button type="button" className="bk__ghost" onClick={onOpenSettings}>
            Configurar
          </button>
        ) : null}
      </div>
    </div>
  )
}

function Agenda({
  day,
  setDay,
  appts,
  weekMode,
  setWeekMode,
  onStatus,
  onReschedule,
  settings,
  onOpenSettings,
  pending,
}: {
  day: string
  setDay: (d: string) => void
  appts: BookingAppointment[]
  pending: BookingAppointment[]
  weekMode: boolean
  setWeekMode: (v: boolean) => void
  onStatus: (id: string, status: BookingStatus) => Promise<void>
  onReschedule: (id: string, date: string, time: string) => Promise<void>
  settings: BookingSettings | null
  onOpenSettings?: () => void
}) {
  const hours = Array.from({ length: 13 }, (_, i) => 7 + i)
  const weekStart = addDays(day, -new Date(`${day}T12:00:00`).getDay())
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <>
      <div className="bk__row">
        <h1 className="bk__title">Agenda</h1>
        <div className="bk__actions" style={{ margin: 0 }}>
          <Button type="button" size="sm" variant={weekMode ? 'secondary' : 'primary'} onClick={() => setWeekMode(false)}>
            Día
          </Button>
          <Button type="button" size="sm" variant={weekMode ? 'primary' : 'secondary'} onClick={() => setWeekMode(true)}>
            Semana
          </Button>
        </div>
      </div>
      <div className="bk__actions" style={{ marginBottom: '0.8rem' }}>
        <button type="button" className="bk__ghost" onClick={() => setDay(addDays(day, weekMode ? -7 : -1))}>
          {weekMode ? 'Semana ant.' : 'Ayer'}
        </button>
        <button type="button" className="bk__ghost" onClick={() => setDay(localYmd())}>
          Hoy
        </button>
        <button type="button" className="bk__ghost" onClick={() => setDay(addDays(day, weekMode ? 7 : 1))}>
          {weekMode ? 'Semana sig.' : 'Mañana'}
        </button>
        <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
      </div>
      {settings ? <PublicBookingLinkCard settings={settings} onOpenSettings={onOpenSettings} /> : null}
      {pending.length ? (
        <section className="bk__requests" aria-label="Solicitudes por aceptar">
          <h2 className="bk__subtitle">Solicitudes por aceptar · {pending.length}</h2>
          {pending.map((a) => (
            <ApptCard key={a.id} a={a} onStatus={onStatus} showDate />
          ))}
        </section>
      ) : null}

      {weekMode ? (
        <div className="bk__week">
          {weekDays.map((d) => {
            const inDay = appts.filter((a) => a.date === d)
            return (
              <button
                key={d}
                type="button"
                className={`bk__week-day${d === day ? ' is-on' : ''}`}
                onClick={() => {
                  setDay(d)
                  setWeekMode(false)
                }}
              >
                <strong>{WEEKDAYS[new Date(`${d}T12:00:00`).getDay()]}</strong>
                <span>{d.slice(8)}</span>
                <span className="bk__meta">{inDay.length} citas</span>
                {inDay.slice(0, 3).map((a) => (
                  <span key={a.id} className="bk__week-chip">
                    {hhmm(a.startAt)} {a.customer.name}
                  </span>
                ))}
              </button>
            )
          })}
        </div>
      ) : (
        hours.map((h) => {
          const label = `${String(h).padStart(2, '0')}:00`
          const inHour = appts.filter(
            (a) => a.status !== 'PENDING' && Number(hhmm(a.startAt).slice(0, 2)) === h,
          )
          return (
            <div key={h} className="bk__card">
              <p className="bk__meta">{label}</p>
              {inHour.length === 0 ? <p className="bk__meta">Libre</p> : null}
              {inHour.map((a) => (
                <ApptCard key={a.id} a={a} onStatus={onStatus} onReschedule={(id, time) => onReschedule(id, day, time)} />
              ))}
            </div>
          )
        })
      )}
    </>
  )
}

function AppointmentsList({
  appts,
  day,
  setDay,
  onStatus,
}: {
  appts: BookingAppointment[]
  day: string
  setDay: (d: string) => void
  onStatus: (id: string, status: BookingStatus) => Promise<void>
}) {
  return (
    <>
      <div className="bk__row">
        <h1 className="bk__title">Citas</h1>
        <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
      </div>
      {appts.length === 0 ? <p className="bk__meta">No hay citas este día.</p> : null}
      {appts.map((a) => (
        <ApptCard key={a.id} a={a} onStatus={onStatus} />
      ))}
    </>
  )
}

function ApptCard({
  a,
  onStatus,
  onReschedule,
  showDate,
}: {
  a: BookingAppointment
  onStatus: (id: string, status: BookingStatus) => Promise<void>
  onReschedule?: (id: string, time: string) => Promise<void>
  showDate?: boolean
}) {
  const [move, setMove] = useState('')
  return (
    <div className={`bk__card${a.status === 'PENDING' ? ' bk__card--pending' : ''}`}>
      <div className="bk__row">
        <h3>
          {showDate ? `${a.date} · ` : ''}
          {hhmm(a.startAt)} · {a.customer.name}
        </h3>
        <span className={`bk__badge bk__badge--${a.status.toLowerCase()}`}>{STATUS_LABEL[a.status]}</span>
      </div>
      <p className="bk__meta">
        {a.service.name} · {a.staff.name} · {a.service.durationMin} min
        {a.source === 'PUBLIC_BOOKING' ? ' · Solicitud del enlace' : ''}
      </p>
      <p className="bk__meta">
        {a.customer.phone}
        {a.customer.email ? ` · ${a.customer.email}` : ''}
      </p>
      {a.notes ? <p className="bk__meta">{a.notes}</p> : null}
      {a.status === 'PENDING' ? (
        <div className="bk__actions">
          <Button type="button" size="sm" onClick={() => void onStatus(a.id, 'CONFIRMED')}>
            Aceptar cita
          </Button>
          <button type="button" className="bk__danger" onClick={() => void onStatus(a.id, 'CANCELLED')}>
            Rechazar
          </button>
        </div>
      ) : a.status !== 'CANCELLED' ? (
        <div className="bk__actions">
          <button type="button" className="bk__ghost" onClick={() => void onStatus(a.id, 'COMPLETED')}>
            Completar
          </button>
          <button type="button" className="bk__ghost" onClick={() => void onStatus(a.id, 'NO_SHOW')}>
            No show
          </button>
          <button type="button" className="bk__danger" onClick={() => void onStatus(a.id, 'CANCELLED')}>
            Cancelar
          </button>
        </div>
      ) : null}
      {onReschedule && a.status === 'CONFIRMED' ? (
        <div className="bk__actions">
          <input placeholder="HH:MM" value={move} onChange={(e) => setMove(e.target.value)} style={{ width: 90 }} />
          <button type="button" className="bk__ghost" onClick={() => move && void onReschedule(a.id, move)}>
            Reprogramar
          </button>
        </div>
      ) : null}
    </div>
  )
}

function CustomersList({ customers }: { customers: BookingCustomer[] }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <>
      <h1 className="bk__title">Clientes</h1>
      {customers.map((c) => (
        <button
          key={c.id}
          type="button"
          className="bk__card"
          onClick={() => setOpen(open === c.id ? null : c.id)}
        >
          <h3>{c.name}</h3>
          <p className="bk__meta">
            {c.phone}
            {c.email ? ` · ${c.email}` : ''}
          </p>
          <p className="bk__meta">{c.appointments?.length ?? 0} citas recientes</p>
          {open === c.id && c.appointments?.length ? (
            <ul className="bk__meta">
              {c.appointments.map((a) => (
                <li key={a.id}>
                  {a.date || a.startAt.slice(0, 10)} {hhmm(a.startAt)} · {a.service?.name} ·{' '}
                  {STATUS_LABEL[a.status]}
                </li>
              ))}
            </ul>
          ) : null}
        </button>
      ))}
    </>
  )
}

function ServicesList({
  services,
  onSave,
}: {
  services: BookingService[]
  onSave: (body: object, id?: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', durationMin: '40', price: '25000', description: '' })
  return (
    <>
      <div className="bk__row">
        <h1 className="bk__title">Servicios</h1>
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          Nuevo
        </Button>
      </div>
      {open ? (
        <form
          className="bk__card"
          onSubmit={(e) => {
            e.preventDefault()
            void onSave({
              name: form.name,
              durationMin: Number(form.durationMin),
              price: Number(form.price),
              description: form.description,
            }).then(() => setOpen(false))
          }}
        >
          <label className="bk__field">
            Nombre
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="bk__field">
            Duración (min)
            <input type="number" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} />
          </label>
          <label className="bk__field">
            Precio
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </label>
          <Button type="submit">Guardar</Button>
        </form>
      ) : null}
      {services.map((s) => (
        <div key={s.id} className="bk__card">
          <div className="bk__row">
            <h3>{s.name}</h3>
            <span>{formatCOP(s.price)}</span>
          </div>
          <p className="bk__meta">
            {s.durationMin} min {s.active ? '' : '· inactivo'}
          </p>
        </div>
      ))}
    </>
  )
}

function StaffList({
  staff,
  services,
  onSave,
}: {
  staff: BookingStaff[]
  services: BookingService[]
  onSave: (body: object, id?: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [ids, setIds] = useState<string[]>([])
  return (
    <>
      <div className="bk__row">
        <h1 className="bk__title">Profesionales</h1>
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          Nuevo
        </Button>
      </div>
      {open ? (
        <form
          className="bk__card"
          onSubmit={(e) => {
            e.preventDefault()
            void onSave({ name, serviceIds: ids }).then(() => setOpen(false))
          }}
        >
          <label className="bk__field">
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          {services.map((s) => (
            <label key={s.id} className="bk__meta">
              <input
                type="checkbox"
                checked={ids.includes(s.id)}
                onChange={(e) =>
                  setIds((prev) => (e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id)))
                }
              />{' '}
              {s.name}
            </label>
          ))}
          <Button type="submit">Guardar</Button>
        </form>
      ) : null}
      {staff.map((s) => (
        <div key={s.id} className="bk__card">
          <h3>{s.name}</h3>
          <p className="bk__meta">{(s.serviceIds ?? []).length} servicios</p>
        </div>
      ))}
    </>
  )
}

function hourRowsFrom(hours: BookingHours[], staffId: string) {
  const current = hours.filter((h) => (staffId ? h.staffId === staffId : !h.staffId))
  return [1, 2, 3, 4, 5, 6, 0].map((weekday) => {
    const hit = current.find((h) => h.weekday === weekday)
    return {
      weekday,
      enabled: Boolean(hit),
      start: hit
        ? `${String(Math.floor(hit.startMin / 60)).padStart(2, '0')}:${String(hit.startMin % 60).padStart(2, '0')}`
        : '08:00',
      end: hit
        ? `${String(Math.floor(hit.endMin / 60)).padStart(2, '0')}:${String(hit.endMin % 60).padStart(2, '0')}`
        : '18:00',
    }
  })
}

function HoursRows({
  hours,
  staffId,
  onSaveHours,
}: {
  hours: BookingHours[]
  staffId: string
  onSaveHours: (
    hours: { weekday: number; startMin: number; endMin: number }[],
    staffId: string | null,
  ) => Promise<void>
}) {
  const [rows, setRows] = useState(() => hourRowsFrom(hours, staffId))
  function toMin(t: string) {
    const [h, m] = t.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  return (
    <>
      {rows.map((r, i) => (
        <div key={r.weekday} className="bk__card">
          <label className="bk__row">
            <span>{WEEKDAYS[r.weekday]}</span>
            <input
              type="checkbox"
              checked={r.enabled}
              onChange={(e) => {
                const next = [...rows]
                next[i] = { ...r, enabled: e.target.checked }
                setRows(next)
              }}
            />
          </label>
          {r.enabled ? (
            <div className="bk__row">
              <input
                type="time"
                value={r.start}
                onChange={(e) => {
                  const next = [...rows]
                  next[i] = { ...r, start: e.target.value }
                  setRows(next)
                }}
              />
              <input
                type="time"
                value={r.end}
                onChange={(e) => {
                  const next = [...rows]
                  next[i] = { ...r, end: e.target.value }
                  setRows(next)
                }}
              />
            </div>
          ) : null}
        </div>
      ))}
      <Button
        type="button"
        onClick={() =>
          void onSaveHours(
            rows
              .filter((r) => r.enabled)
              .map((r) => ({ weekday: r.weekday, startMin: toMin(r.start), endMin: toMin(r.end) })),
            staffId || null,
          )
        }
      >
        Guardar horarios
      </Button>
    </>
  )
}

function AvailabilityPane({
  hours,
  blocks,
  staff,
  onSaveHours,
  onCreateBlock,
  onDeleteBlock,
}: {
  hours: BookingHours[]
  blocks: BookingBlock[]
  staff: BookingStaff[]
  onSaveHours: (
    hours: { weekday: number; startMin: number; endMin: number }[],
    staffId: string | null,
  ) => Promise<void>
  onCreateBlock: (body: object) => Promise<void>
  onDeleteBlock: (id: string) => Promise<void>
}) {
  const [staffId, setStaffId] = useState<string>('')
  const [block, setBlock] = useState({ startAt: '', endAt: '', reason: '' })

  return (
    <>
      <h1 className="bk__title">Disponibilidad</h1>
      <label className="bk__field">
        Horario de
        <select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
          <option value="">Negocio</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <HoursRows
        key={staffId || 'business'}
        hours={hours}
        staffId={staffId}
        onSaveHours={onSaveHours}
      />

      <h2 className="bk__title" style={{ marginTop: '1.4rem', fontSize: '1.15rem' }}>
        Bloqueos y vacaciones
      </h2>
      <form
        className="bk__card"
        onSubmit={(e) => {
          e.preventDefault()
          void onCreateBlock({
            startAt: new Date(block.startAt).toISOString(),
            endAt: new Date(block.endAt).toISOString(),
            reason: block.reason,
            staffId: staffId || null,
          }).then(() => setBlock({ startAt: '', endAt: '', reason: '' }))
        }}
      >
        <label className="bk__field">
          Desde
          <input
            type="datetime-local"
            value={block.startAt}
            onChange={(e) => setBlock({ ...block, startAt: e.target.value })}
            required
          />
        </label>
        <label className="bk__field">
          Hasta
          <input
            type="datetime-local"
            value={block.endAt}
            onChange={(e) => setBlock({ ...block, endAt: e.target.value })}
            required
          />
        </label>
        <label className="bk__field">
          Motivo
          <input value={block.reason} onChange={(e) => setBlock({ ...block, reason: e.target.value })} />
        </label>
        <Button type="submit">Agregar bloqueo</Button>
      </form>
      {blocks.map((b) => (
        <div key={b.id} className="bk__card">
          <p>
            {new Date(b.startAt).toLocaleString('es-CO')} → {new Date(b.endAt).toLocaleString('es-CO')}
          </p>
          <p className="bk__meta">{b.reason || 'Bloqueo'}</p>
          <button type="button" className="bk__danger" onClick={() => void onDeleteBlock(b.id)}>
            Quitar
          </button>
        </div>
      ))}
    </>
  )
}

function SettingsPane({
  settings,
  onSave,
}: {
  settings: BookingSettings
  onSave: (body: Partial<BookingSettings>) => Promise<void>
}) {
  const [slug, setSlug] = useState(settings.publicSlug)
  const [welcome, setWelcome] = useState(settings.welcomeMessage ?? '')
  const [enabled, setEnabled] = useState(settings.publicEnabled)
  const preview = { ...settings, publicSlug: slug.trim() || settings.publicSlug, publicEnabled: enabled }
  return (
    <>
      <h1 className="bk__title">Enlace público</h1>
      <p className="bk__meta" style={{ marginBottom: '0.85rem' }}>
        Quien tiene el link elige un día en el calendario y solicita la cita. Tú la aceptas o la rechazas
        desde Agenda. No necesita cuenta en VOS IA.
      </p>
      <PublicBookingLinkCard settings={preview} />
      <label className="bk__check">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <span>Recibir solicitudes desde el enlace público</span>
      </label>
      <label className="bk__field">
        Slug del enlace
        <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} />
      </label>
      <label className="bk__field">
        Mensaje de bienvenida
        <input
          value={welcome}
          onChange={(e) => setWelcome(e.target.value)}
          placeholder="Agenda tu cita"
        />
      </label>
      <p className="bk__meta">Zona horaria: {settings.timezone}</p>
      <Button
        type="button"
        onClick={() =>
          void onSave({
            publicSlug: slug,
            publicEnabled: enabled,
            welcomeMessage: welcome,
          })
        }
      >
        Guardar
      </Button>
    </>
  )
}

function Composer({
  baseUrl,
  services,
  staff,
  customers,
  onClose,
  onCreated,
}: {
  baseUrl: string
  services: BookingService[]
  staff: BookingStaff[]
  customers: BookingCustomer[]
  onClose: () => void
  onCreated: () => Promise<void>
}) {
  const [step, setStep] = useState(1)
  const [customerId, setCustomerId] = useState('')
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '')
  const [staffId, setStaffId] = useState('')
  const [date, setDate] = useState(localYmd())
  const [time, setTime] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const staffForService = useMemo(
    () => staff.filter((s) => (s.serviceIds ?? []).includes(serviceId) || !(s.serviceIds ?? []).length),
    [staff, serviceId],
  )

  useEffect(() => {
    if (!serviceId || !staffId || !date) return
    void bookingApi
      .availability(baseUrl, date, serviceId, staffId)
      .then((r) => setSlots(r.slots))
      .catch(() => setSlots([]))
  }, [baseUrl, date, serviceId, staffId])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    try {
      await bookingApi.createAppointment(baseUrl, {
        customerId: customerId || undefined,
        customerName: customerId ? undefined : newName,
        customerPhone: customerId ? undefined : newPhone,
        serviceId,
        staffId,
        date,
        time,
      })
      await onCreated()
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'No se pudo crear')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bk__sheet" role="dialog" aria-label="Nueva cita">
      <button type="button" className="bk__ghost" onClick={onClose}>
        Cerrar
      </button>
      <h1>Nueva cita</h1>
      <p className="bk__meta">Paso {step} de 2</p>
      <form onSubmit={submit}>
        {step === 1 ? (
          <>
            <label className="bk__field">
              Cliente
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Crear cliente</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.phone}
                  </option>
                ))}
              </select>
            </label>
            {!customerId ? (
              <>
                <label className="bk__field">
                  Nombre
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} required />
                </label>
                <label className="bk__field">
                  Teléfono
                  <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required />
                </label>
              </>
            ) : null}
            <Button type="button" block onClick={() => setStep(2)}>
              Siguiente
            </Button>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <label className="bk__field">
              Servicio
              <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.durationMin} min
                  </option>
                ))}
              </select>
            </label>
            <label className="bk__field">
              Profesional
              <select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                <option value="">Elegir</option>
                {staffForService.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="bk__field">
              Fecha
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <p className="bk__meta">Hora</p>
            <div className="bk__slots">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`bk__slot${time === s ? ' is-on' : ''}`}
                  onClick={() => setTime(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            {err ? <p className="bk__alert">{err}</p> : null}
            <div className="bk__actions">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button type="submit" disabled={!time || saving}>
                {saving ? 'Guardando…' : 'Confirmar'}
              </Button>
            </div>
          </>
        ) : null}
      </form>
    </div>
  )
}
