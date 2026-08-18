import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { BrandMark } from '../components/BrandMark'
import { Button } from '../components/ui/button'
import { PublicThemeSwitch } from '../components/PublicThemeSwitch'
import { usePublicTheme } from '../hooks/usePublicTheme'
import {
  createPublicAppointment,
  fetchPublicAvailability,
  fetchPublicCatalog,
  formatCOP,
  getPublicBookingSlug,
  hhmm,
  type BookingAppointment,
} from './bookingApi'
import { addDays, localYmd, WEEKDAYS } from './bookingNav'
import '../public-shell.css'
import './booking.css'

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

type Catalog = Awaited<ReturnType<typeof fetchPublicCatalog>>

function monthCells(year: number, month: number): Array<string | null> {
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells: Array<string | null> = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= days; d++) {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    cells.push(`${year}-${mm}-${dd}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function firstOpenYmd(today: string, openWeekdays: Set<number>) {
  for (let i = 0; i < 21; i++) {
    const ymd = addDays(today, i)
    const wd = new Date(`${ymd}T12:00:00`).getDay()
    if (openWeekdays.has(wd)) return ymd
  }
  return today
}

export function PublicBookingApp() {
  const slug = getPublicBookingSlug()
  const { theme, toggleTheme } = usePublicTheme()
  const today = localYmd()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [serviceId, setServiceId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [cursor, setCursor] = useState(() => {
    const n = new Date()
    return { y: n.getFullYear(), m: n.getMonth() }
  })
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [done, setDone] = useState<BookingAppointment | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!slug) {
      setError('Enlace inválido')
      setLoading(false)
      return
    }
    void fetchPublicCatalog(slug)
      .then((c) => {
        setCatalog(c)
        const firstService = c.services[0]?.id ?? ''
        setServiceId(firstService)
        const staffFor = c.staff.filter((s) =>
          firstService ? s.serviceIds.includes(firstService) : true,
        )
        setStaffId(staffFor[0]?.id ?? c.staff[0]?.id ?? '')
        const open = new Set((c.hours ?? []).map((h) => h.weekday))
        const start = firstOpenYmd(today, open.size ? open : new Set([1, 2, 3, 4, 5, 6]))
        setDate(start)
        const [y, m] = start.split('-').map(Number)
        setCursor({ y, m: m - 1 })
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'No disponible'))
      .finally(() => setLoading(false))
  }, [slug])

  const staffOpts = useMemo(() => {
    const all = catalog?.staff ?? []
    const matched = all.filter((s) => s.serviceIds.includes(serviceId))
    return matched.length ? matched : all
  }, [catalog, serviceId])

  const openWeekdays = useMemo(() => {
    const set = new Set((catalog?.hours ?? []).map((h) => h.weekday))
    return set.size ? set : new Set([1, 2, 3, 4, 5, 6])
  }, [catalog])

  const cells = useMemo(() => monthCells(cursor.y, cursor.m), [cursor])

  useEffect(() => {
    if (!slug || !serviceId || !staffId || !date) {
      setSlots([])
      return
    }
    setSlotsLoading(true)
    void fetchPublicAvailability(slug, date, serviceId, staffId)
      .then((r) => {
        setSlots(r.slots)
        setTime((prev) => (r.slots.includes(prev) ? prev : ''))
      })
      .catch(() => {
        setSlots([])
        setTime('')
      })
      .finally(() => setSlotsLoading(false))
  }, [slug, serviceId, staffId, date])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!slug || saving || !date || !time) return
    setError(null)
    setSaving(true)
    try {
      const appt = await createPublicAppointment(slug, {
        serviceId: serviceId || undefined,
        staffId: staffId || undefined,
        date,
        time,
        name,
        phone,
        email: email || undefined,
        notes: note || undefined,
      })
      setDone(appt)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : 'No se pudo enviar la solicitud.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="public-shell bk-public">
        <div className="bk-public__card">
          <p className="bk__meta">Cargando agenda…</p>
        </div>
      </div>
    )
  }
  if (!catalog) {
    return (
      <div className="public-shell bk-public">
        <div className="bk-public__card">
          <BrandMark size="sm" />
          <h1>Agenda no disponible</h1>
          <p className="bk__meta">{error || 'Este enlace no está activo.'}</p>
        </div>
      </div>
    )
  }

  const service = catalog.services.find((s) => s.id === serviceId)
  const staff = catalog.staff.find((s) => s.id === staffId)

  if (done) {
    return (
      <div className="public-shell bk-public">
        <PublicThemeSwitch theme={theme} onToggle={toggleTheme} compact className="bk-public__theme" />
        <div className="bk-public__card bk-public__ok">
          <p className="bk-public__kicker">Solicitud enviada</p>
          <h1>Quedó pendiente</h1>
          <p className="bk__meta">
            {catalog.business.name} revisa tu pedido y te confirma si acepta la cita.
          </p>
          <div className="bk-public__summary">
            <strong>{done.date}</strong>
            <span>{hhmm(done.startAt)}</span>
            {done.service?.name ? <span>{done.service.name}</span> : null}
            {done.staff?.name ? <span>{done.staff.name}</span> : null}
          </div>
        </div>
      </div>
    )
  }

  const showServices = catalog.services.length > 1
  const showStaff = staffOpts.length > 1

  return (
    <div className="public-shell bk-public">
      <PublicThemeSwitch theme={theme} onToggle={toggleTheme} compact className="bk-public__theme" />
      <form className="bk-public__card" onSubmit={submit}>
        <header className="bk-public__head">
          <p className="bk-public__kicker">{catalog.business.name}</p>
          <h1>Elige el día</h1>
          <p className="bk__meta">
            {catalog.business.welcomeMessage ||
              'Selecciona una fecha y un horario. El negocio acepta o rechaza tu solicitud.'}
          </p>
        </header>

        {error ? (
          <p className="bk__alert" role="alert">
            {error}
          </p>
        ) : null}

        {showServices ? (
          <fieldset className="bk-public__fieldset">
            <legend>Servicio</legend>
            <div className="bk-public__chips">
              {catalog.services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`bk-public__chip${serviceId === s.id ? ' is-on' : ''}`}
                  onClick={() => {
                    setServiceId(s.id)
                    const next = catalog.staff.filter((st) => st.serviceIds.includes(s.id))
                    setStaffId(next[0]?.id ?? '')
                    setTime('')
                  }}
                >
                  {s.name}
                  {Number(s.price) > 0 ? ` · ${formatCOP(s.price)}` : ''}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {showStaff ? (
          <fieldset className="bk-public__fieldset">
            <legend>Con quién</legend>
            <div className="bk-public__chips">
              {staffOpts.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`bk-public__chip${staffId === s.id ? ' is-on' : ''}`}
                  onClick={() => {
                    setStaffId(s.id)
                    setTime('')
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        <fieldset className="bk-public__fieldset">
          <legend>Día</legend>
          <div className="bk-cal">
            <div className="bk-cal__nav">
              <button
                type="button"
                className="bk-cal__nav-btn"
                onClick={() =>
                  setCursor((c) =>
                    c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 },
                  )
                }
                aria-label="Mes anterior"
              >
                ‹
              </button>
              <strong>
                {MONTHS[cursor.m]} {cursor.y}
              </strong>
              <button
                type="button"
                className="bk-cal__nav-btn"
                onClick={() =>
                  setCursor((c) =>
                    c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 },
                  )
                }
                aria-label="Mes siguiente"
              >
                ›
              </button>
            </div>
            <div className="bk-cal__grid" role="grid" aria-label="Calendario">
              {WEEKDAYS.map((d) => (
                <span key={d} className="bk-cal__dow">
                  {d}
                </span>
              ))}
              {cells.map((ymd, i) => {
                if (!ymd) return <span key={`e-${i}`} className="bk-cal__day is-empty" />
                const wd = new Date(`${ymd}T12:00:00`).getDay()
                const past = ymd < today
                const closed = !openWeekdays.has(wd)
                const disabled = past || closed
                const isToday = ymd === today
                return (
                  <button
                    key={ymd}
                    type="button"
                    disabled={disabled}
                    className={`bk-cal__day${date === ymd ? ' is-on' : ''}${closed ? ' is-closed' : ''}${isToday ? ' is-today' : ''}`}
                    onClick={() => {
                      setDate(ymd)
                      setTime('')
                    }}
                  >
                    {Number(ymd.slice(8))}
                  </button>
                )
              })}
            </div>
          </div>
        </fieldset>

        <fieldset className="bk-public__fieldset">
          <legend>Horario</legend>
          {slotsLoading ? <p className="bk__meta">Buscando horarios…</p> : null}
          {!slotsLoading && slots.length === 0 ? (
            <p className="bk__meta">No hay horarios libres ese día. Prueba otra fecha.</p>
          ) : (
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
          )}
        </fieldset>

        <fieldset className="bk-public__fieldset">
          <legend>Tus datos</legend>
          <label className="bk__field">
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </label>
          <label className="bk__field">
            Teléfono
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              inputMode="tel"
              placeholder="300 000 0000"
            />
          </label>
          <label className="bk__field">
            Email (opcional)
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label className="bk__field">
            Comentario (opcional)
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={400} />
          </label>
        </fieldset>

        {date && time ? (
          <p className="bk-public__pick">
            {date} · {time}
            {service ? ` · ${service.name}` : ''}
            {staff && showStaff ? ` · ${staff.name}` : ''}
            {service ? ` · ${service.durationMin} min` : ''}
          </p>
        ) : null}

        <Button type="submit" size="lg" block disabled={!time || saving}>
          {saving ? 'Enviando…' : 'Solicitar cita'}
        </Button>
        <p className="bk-public__hint">La cita no queda confirmada hasta que el negocio la acepte.</p>
      </form>
      <p className="bk-public__foot">
        <BrandMark size="sm" />
      </p>
    </div>
  )
}
