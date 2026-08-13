import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { AuthUser } from '../api'
import { ThemeSwitch } from '../components/ThemeSwitch'
import { dentalApi, type DentalOverview, type DentalPatient } from './dentalApi'
import {
  DENTAL_NAV,
  formatMoney,
  initials,
  needsValuation,
  type DentalView,
} from './dentalNav'
import { ScheduleBoard } from './ScheduleBoard'
import { CostsAndTreePanels } from './CostsAndTreePanels'
import { PatientChart } from './PatientChart'
import {
  DentalLoadingOverlay,
  DentalToast,
  useDentalFeedback,
} from './dentalFeedback'
import './dental.css'

type Props = {
  user: AuthUser
  baseUrl: string
  view: DentalView
  onNavigate: (view: DentalView) => void
  onLogout: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  inventorySlot?: ReactNode
  analyticsSlot?: ReactNode
}

function NavIcon({ name }: { name: string }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    className: 'dental-nav__icon',
  } as const
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      )
    case 'patients':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19c1.8-3 4-4.5 7-4.5S17.2 16 19 19" />
        </svg>
      )
    case 'agenda':
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      )
    case 'ingresos':
      return (
        <svg {...common}>
          <path d="M4 16l5-5 3 3 7-7" />
          <path d="M14 7h5v5" />
        </svg>
      )
    case 'financing':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7v10M9.5 9.5c.6-1 1.5-1.5 2.5-1.5s2 .6 2 1.8c0 2.2-4 1.6-4 3.8 0 1 .8 1.9 2 1.9s1.8-.5 2.3-1.3" />
        </svg>
      )
    case 'gastos':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      )
    case 'reportes':
      return (
        <svg {...common}>
          <path d="M8 4h8l4 4v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
          <path d="M16 4v4h4" />
        </svg>
      )
    case 'inventory':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" />
        </svg>
      )
    case 'bio':
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 4.5 2.8 7.8 7 9 4.2-1.2 7-4.5 7-9V6l-7-3Z" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      )
  }
}

function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string
  subtitle: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="dental-card dental-empty">
      <strong>{title}</strong>
      <p>{subtitle}</p>
      {actionLabel && onAction ? (
        <button type="button" className="dental-btn dental-btn--primary" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="dental-modal-backdrop" role="dialog" aria-modal="true">
      <div className="dental-modal">
        <h2>{title}</h2>
        {children}
        <div className="dental-modal__actions">
          <button type="button" className="dental-btn dental-btn--ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}


export function DentalClinicApp({
  user,
  baseUrl,
  view,
  onNavigate,
  onLogout,
  theme,
  onToggleTheme,
  inventorySlot,
  analyticsSlot,
}: Props) {
  const [bioOpen, setBioOpen] = useState(
    view.startsWith('bio-') || view === 'bio-temp',
  )
  const [overview, setOverview] = useState<DentalOverview | null>(null)
  const [patients, setPatients] = useState<DentalPatient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [patientDetail, setPatientDetail] = useState<DentalPatient | null>(null)
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<string | null>(null)
  const [agendaDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [, setAppointments] = useState<
    Awaited<ReturnType<typeof dentalApi.appointments>>
  >([])
  const [incomes, setIncomes] = useState<Awaited<ReturnType<typeof dentalApi.incomes>>>([])
  const [expenses, setExpenses] = useState<Awaited<ReturnType<typeof dentalApi.expenses>>>([])
  const [sterilizations, setSterilizations] = useState<unknown[]>([])
  const [wastes, setWastes] = useState<unknown[]>([])
  const [tempLogs, setTempLogs] = useState<unknown[]>([])
  const [form, setForm] = useState<Record<string, string>>({})
  const [allPatients, setAllPatients] = useState<DentalPatient[]>([])
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { loading, setLoading, toast, setToast, notify, withLoading } =
    useDentalFeedback()

  const siteName = overview?.sites[0]?.name ?? user.companyName

  useEffect(() => {
    if (!userMenuOpen) return
    const onPointer = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest('.dental-app__user-wrap')) return
      setUserMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [userMenuOpen])

  useEffect(() => {
    if (view === 'dental-config') onNavigate('home')
  }, [view, onNavigate])

  const refreshOverview = useCallback(async () => {
    try {
      setOverview(await dentalApi.overview(baseUrl))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar resumen')
    }
  }, [baseUrl])

  const refreshPatientsList = useCallback(async () => {
    try {
      const rows = await dentalApi.patients(baseUrl)
      setAllPatients(rows)
      return rows
    } catch {
      return [] as DentalPatient[]
    }
  }, [baseUrl])

  useEffect(() => {
    void withLoading(async () => {
      await Promise.all([refreshOverview(), refreshPatientsList()])
    })
  }, [refreshOverview, refreshPatientsList, withLoading])

  useEffect(() => {
    if (view.startsWith('bio-')) setBioOpen(true)
  }, [view])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError(null)
      setLoading(true)
      try {
        if (view === 'patients') {
          const rows = await dentalApi.patients(baseUrl, q || undefined)
          if (!cancelled) setPatients(rows)
        }
        if (view === 'ingresos') {
          const rows = await dentalApi.incomes(baseUrl, q || undefined)
          if (!cancelled) setIncomes(rows)
        }
        if (view === 'gastos') {
          const rows = await dentalApi.expenses(baseUrl, q || undefined)
          if (!cancelled) setExpenses(rows)
        }
        if (view === 'bio-sterilization') {
          const rows = await dentalApi.sterilizations(baseUrl)
          if (!cancelled) setSterilizations(rows)
        }
        if (view === 'bio-waste') {
          const rows = await dentalApi.wastes(baseUrl, q || undefined)
          if (!cancelled) setWastes(rows)
        }
        if (view === 'bio-temp') {
          const now = new Date()
          const rows = await dentalApi.tempLogs(
            baseUrl,
            now.getFullYear(),
            now.getMonth() + 1,
          )
          if (!cancelled) setTempLogs(rows)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar datos')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [view, baseUrl, q, agendaDate, setLoading])

  useEffect(() => {
    if (!selectedPatientId) {
      setPatientDetail(null)
      return
    }
    let cancelled = false
    setLoading(true)
    dentalApi
      .patient(baseUrl, selectedPatientId)
      .then((p) => {
        if (!cancelled) setPatientDetail(p)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedPatientId, baseUrl, setLoading])

  async function submitPatient() {
    try {
      await withLoading(async () => {
        await dentalApi.createPatient(baseUrl, {
          fullName: form.fullName || '',
          documentNumber: form.documentNumber || '',
          documentType: form.documentType || 'cc',
          phone: form.phone || '',
          email: form.email || '',
          city: form.city || 'Pasto',
          occupation: form.occupation || '',
          notes: form.notes || '',
          siteId: overview?.sites[0]?.id || '',
        })
        setPatients(await dentalApi.patients(baseUrl, q || undefined))
        await refreshPatientsList()
        await refreshOverview()
      })
      setModal(null)
      setForm({})
      notify('Paciente creado correctamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear')
      notify(err instanceof Error ? err.message : 'No se pudo crear', 'error')
    }
  }

  async function submitEditPatient() {
    if (!selectedPatientId) return
    try {
      await withLoading(async () => {
        await dentalApi.updatePatient(baseUrl, selectedPatientId, {
          fullName: form.fullName || '',
          documentNumber: form.documentNumber || '',
          documentType: form.documentType || 'cc',
          phone: form.phone || '',
          email: form.email || '',
          city: form.city || '',
          occupation: form.occupation || '',
          notes: form.notes || '',
          gender: form.gender || '',
          siteId: overview?.sites[0]?.id,
        })
        setPatientDetail(await dentalApi.patient(baseUrl, selectedPatientId))
        setPatients(await dentalApi.patients(baseUrl, q || undefined))
        await refreshPatientsList()
      })
      setModal(null)
      setForm({})
      notify('Paciente actualizado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar')
      notify(err instanceof Error ? err.message : 'No se pudo actualizar', 'error')
    }
  }

  async function submitIncome() {
    try {
      await dentalApi.createIncome(baseUrl, {
        incomeDate: form.incomeDate || new Date().toISOString().slice(0, 10),
        amount: Number(form.amount || 0),
        patientId: form.patientId || undefined,
        paymentMethod: form.paymentMethod || undefined,
        notes: form.notes || undefined,
        siteId: overview?.sites[0]?.id,
      })
      setModal(null)
      setForm({})
      notify('Ingreso registrado')
      setIncomes(await dentalApi.incomes(baseUrl))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear')
      notify(err instanceof Error ? err.message : 'No se pudo crear', 'error')
    }
  }

  async function submitExpense() {
    try {
      await dentalApi.createExpense(baseUrl, {
        expenseDate: form.expenseDate || new Date().toISOString().slice(0, 10),
        concept: form.concept || '',
        amount: Number(form.amount || 0),
        provider: form.provider || undefined,
        expenseType: form.expenseType || undefined,
        siteId: overview?.sites[0]?.id,
      })
      setModal(null)
      setForm({})
      notify('Gasto registrado')
      setExpenses(await dentalApi.expenses(baseUrl))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear')
      notify(err instanceof Error ? err.message : 'No se pudo crear', 'error')
    }
  }

  async function submitAppointment() {
    try {
      const date = form.date || agendaDate
      const time = form.time || '09:00'
      await dentalApi.createAppointment(baseUrl, {
        startsAt: new Date(`${date}T${time}:00`).toISOString(),
        patientId: form.patientId || undefined,
        kind: form.kind || 'tratamiento',
        status: 'confirmada',
        siteId: overview?.sites[0]?.id || '',
      })
      setModal(null)
      setForm({})
      notify('Cita agendada')
      setAppointments(await dentalApi.appointments(baseUrl, agendaDate))
      void refreshOverview()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear')
      notify(err instanceof Error ? err.message : 'No se pudo crear', 'error')
    }
  }

  async function submitSterilization() {
    try {
      await dentalApi.createSterilization(baseUrl, {
        loadDate: form.loadDate || new Date().toISOString(),
        equipment: form.equipment || '',
        cycle: form.cycle || '',
        notes: form.notes || '',
        siteId: overview?.sites[0]?.id || '',
      })
      setModal(null)
      setForm({})
      notify('Esterilización registrada')
      setSterilizations(await dentalApi.sterilizations(baseUrl))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear')
      notify(err instanceof Error ? err.message : 'No se pudo crear', 'error')
    }
  }

  async function submitWaste() {
    try {
      await dentalApi.createWaste(baseUrl, {
        wasteDate: form.wasteDate || new Date().toISOString().slice(0, 10),
        wasteType: form.wasteType || '',
        classification: form.classification || undefined,
        bagColor: form.bagColor || undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        siteId: overview?.sites[0]?.id,
      })
      setModal(null)
      setForm({})
      notify('Residuo registrado')
      setWastes(await dentalApi.wastes(baseUrl))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear')
      notify(err instanceof Error ? err.message : 'No se pudo crear', 'error')
    }
  }

  async function submitTemp() {
    try {
      await dentalApi.createTempLog(baseUrl, {
        logDate: form.logDate || new Date().toISOString().slice(0, 10),
        deviceName: form.deviceName || undefined,
        temperatureC: form.temperatureC ? Number(form.temperatureC) : undefined,
        humidityPct: form.humidityPct ? Number(form.humidityPct) : undefined,
        observations: form.observations || undefined,
        siteId: overview?.sites[0]?.id,
      })
      setModal(null)
      setForm({})
      notify('Temperatura/humedad guardada')
      const now = new Date()
      setTempLogs(await dentalApi.tempLogs(baseUrl, now.getFullYear(), now.getMonth() + 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear')
      notify(err instanceof Error ? err.message : 'No se pudo crear', 'error')
    }
  }


  function renderMain() {
    if (view === 'home') {
      const pendingVal = allPatients.filter(needsValuation).length
      const upcoming = overview?.upcomingAppointments ?? 0
      const attended = overview?.indicators.attended ?? 0
      const notAttended = overview?.indicators.notAttended ?? 0
      const cancelled = overview?.indicators.cancelled ?? 0
      const indTotal = Math.max(attended + notAttended + cancelled, 1)
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setHours(12, 0, 0, 0)
        d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + i) // lunes → domingo
        const key = d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
        const todayKey = new Date().toLocaleDateString('en-CA', {
          timeZone: 'America/Bogota',
        })
        const count =
          overview?.nextAppointments.filter((a) => {
            const ak = new Date(a.startsAt).toLocaleDateString('en-CA', {
              timeZone: 'America/Bogota',
            })
            return ak === key
          }).length ?? 0
        return { d, key, count, isToday: key === todayKey }
      })
      const aiTips: string[] = []
      if (pendingVal > 0) {
        aiTips.push(
          `${pendingVal} paciente${pendingVal > 1 ? 's' : ''} con valoración pendiente — prioriza agenda de primera vez.`,
        )
      }
      if (upcoming > 0) {
        aiTips.push(
          `Hay ${upcoming} cita${upcoming > 1 ? 's' : ''} próxima${upcoming > 1 ? 's' : ''}. Revisa confirmaciones y salas.`,
        )
      }
      if (cancelled > attended && cancelled > 0) {
        aiTips.push(
          'Las cancelaciones superan a las atendidas este año. Activa recordatorios 24h antes.',
        )
      }
      if (aiTips.length === 0) {
        aiTips.push(
          'Clínica al día. Usa la agenda para llenar huecos y el odontograma en cada valoración.',
        )
      }

      return (
        <div className="dental-home">
          <div className="dental-home__ai">
            <div className="dental-home__ai-badge">vos ia</div>
            <div className="dental-home__ai-body">
              <strong>Asistente clínico</strong>
              <ul>
                {aiTips.slice(0, 2).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="dental-home__ai-actions">
              <button
                type="button"
                className="dental-btn dental-btn--ghost"
                onClick={() => onNavigate('agenda')}
              >
                Agenda
              </button>
              <button
                type="button"
                className="dental-btn dental-btn--primary"
                onClick={() => onNavigate('patients')}
              >
                Pacientes
              </button>
            </div>
          </div>

          <div className="dental-home__kpis">
            <button type="button" className="dental-kpi" onClick={() => onNavigate('patients')}>
              <strong>{overview?.patientsCount ?? 0}</strong>
              <span>Pacientes</span>
            </button>
            <button type="button" className="dental-kpi" onClick={() => onNavigate('agenda')}>
              <strong>{upcoming}</strong>
              <span>Citas próximas</span>
            </button>
            <button type="button" className="dental-kpi" onClick={() => onNavigate('ingresos')}>
              <strong>{overview?.incomesCount ?? 0}</strong>
              <span>Ingresos</span>
            </button>
            <button type="button" className="dental-kpi dental-kpi--warn" onClick={() => onNavigate('patients')}>
              <strong>{pendingVal}</strong>
              <span>Valoraciones</span>
            </button>
          </div>

          <div className="dental-home__grid">
            <section className="dental-card dental-home__panel">
              <div className="dental-home__panel-head">
                <h3>Semana</h3>
                <button type="button" className="dental-link" onClick={() => onNavigate('agenda')}>
                  Abrir agenda
                </button>
              </div>
              <div className="dental-week">
                {weekDays.map(({ d, key, count, isToday }) => (
                  <div
                    key={key}
                    className={`dental-week__day${isToday ? ' dental-week__day--today' : ''}${count ? ' dental-week__day--busy' : ''}`}
                  >
                    <span className="dental-week__dow">
                      {d.toLocaleDateString('es-CO', { weekday: 'short' })}
                    </span>
                    <strong>{d.getDate()}</strong>
                    <span className="dental-week__dots" aria-label={`${count} citas`}>
                      {count > 0 ? '●'.repeat(Math.min(count, 3)) : '·'}
                    </span>
                  </div>
                ))}
              </div>
              <ul className="dental-home__appt-list">
                {(overview?.nextAppointments ?? []).slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <time>
                      {new Date(a.startsAt).toLocaleString('es-CO', {
                        timeZone: 'America/Bogota',
                        weekday: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                    <span>{a.patient?.fullName ?? 'Sin paciente'}</span>
                  </li>
                ))}
                {(overview?.nextAppointments.length ?? 0) === 0 ? (
                  <li className="dental-muted">Sin citas programadas</li>
                ) : null}
              </ul>
            </section>

            <section className="dental-card dental-home__panel">
              <div className="dental-home__panel-head">
                <h3>Citas {new Date().getFullYear()}</h3>
              </div>
              <div className="dental-bars">
                {[
                  { label: 'Atendidas', value: attended, tone: 'ok' },
                  { label: 'No atendidas', value: notAttended, tone: 'warn' },
                  { label: 'Canceladas', value: cancelled, tone: 'danger' },
                ].map((row) => (
                  <div key={row.label} className="dental-bars__row">
                    <div className="dental-bars__meta">
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                    <div className="dental-bars__track">
                      <div
                        className={`dental-bars__fill dental-bars__fill--${row.tone}`}
                        style={{ width: `${Math.round((row.value / indTotal) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="dental-home__mini-stats">
                <div>
                  <strong>{overview?.expensesCount ?? 0}</strong>
                  <span>Gastos reg.</span>
                </div>
                <div>
                  <strong>{siteName}</strong>
                  <span>Sede</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      )
    }

    if (view === 'patients') {
      if (patientDetail) {
        return (
          <PatientChart
            baseUrl={baseUrl}
            patient={patientDetail}
            onNotify={notify}
            onBack={() => setSelectedPatientId(null)}
            onEdit={() => {
              setForm({
                fullName: patientDetail.fullName,
                documentNumber: patientDetail.documentNumber,
                documentType: patientDetail.documentType,
                phone: patientDetail.phone || '',
                email: patientDetail.email || '',
                occupation: patientDetail.occupation || '',
                city: patientDetail.city || '',
                notes: patientDetail.notes || '',
                gender: patientDetail.gender || '',
              })
              setModal('edit-patient')
            }}
            onUpdated={(p) => setPatientDetail(p)}
            onSchedule={() => onNavigate('agenda')}
          />
        )
      }

      return (
        <>
          <div className="dental-page__head">
            <div>
              <h1>Pacientes</h1>
              <p>Historia clínica, odontogramas y presupuestos.</p>
            </div>
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() => {
                setForm({})
                setModal('patient')
              }}
            >
              + Nuevo paciente
            </button>
          </div>
          <div className="dental-filters">
            <div className="dental-field">
              <label>Buscar</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre, documento, email..."
              />
            </div>
          </div>
          {patients.length === 0 ? (
            <EmptyState
              title="Sin pacientes"
              subtitle="Crea el primer paciente para comenzar la historia clínica."
              actionLabel="Nuevo paciente"
              onAction={() => setModal('patient')}
            />
          ) : (
            <div className="dental-card dental-table-wrap">
              <table className="dental-table">
                <thead>
                  <tr>
                    <th>NOMBRE</th>
                    <th>DOCUMENTO</th>
                    <th>CELULAR</th>
                    <th>CIUDAD</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <button
                          type="button"
                          className="dental-link"
                          onClick={() => setSelectedPatientId(p.id)}
                        >
                          {p.fullName}
                        </button>
                      </td>
                      <td>
                        {p.documentType} {p.documentNumber}
                      </td>
                      <td>{p.phone || '—'}</td>
                      <td>{p.city || '—'}</td>
                      <td>
                        {needsValuation(p) ? (
                          <span className="dental-badge dental-badge--warn">
                            Valoración pendiente
                          </span>
                        ) : (
                          <span className="dental-badge dental-badge--ok">
                            Activo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )
    }

    if (view === 'agenda') {
      return (
        <ScheduleBoard
          baseUrl={baseUrl}
          siteId={overview?.sites[0]?.id}
          siteName={siteName}
          patients={allPatients}
          onNotify={notify}
          onLoading={setLoading}
          onChanged={() => {
            void refreshOverview()
            void refreshPatientsList()
          }}
        />
      )
    }

    if (view === 'ingresos') {
      return (
        <>
          <div className="dental-page__head">
            <div>
              <h1>Ingresos</h1>
              <p>Facturas y recibos emitidos a pacientes</p>
            </div>
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() => {
                setForm({
                  incomeDate: new Date().toISOString().slice(0, 10),
                  amount: '',
                })
                setModal('income')
              }}
            >
              + Nuevo Ingreso
            </button>
          </div>
          <div className="dental-filters">
            <div className="dental-field">
              <label>Buscar</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por número, cliente o NIT"
              />
            </div>
          </div>
          {incomes.length === 0 ? (
            <EmptyState
              title="Sin ingresos"
              subtitle="Registra el primer ingreso del consultorio."
              actionLabel="Nuevo Ingreso"
              onAction={() => setModal('income')}
            />
          ) : (
            <div className="dental-card dental-table-wrap">
              <table className="dental-table">
                <thead>
                  <tr>
                    <th>NÚMERO</th>
                    <th>FECHA</th>
                    <th>PACIENTE</th>
                    <th>VALOR</th>
                    <th>FORMA DE PAGO</th>
                    <th>SEDE</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((row) => (
                    <tr key={row.id}>
                      <td>{row.number}</td>
                      <td>
                        {new Date(row.incomeDate).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td>{row.patient?.fullName ?? '—'}</td>
                      <td>{formatMoney(row.amount)}</td>
                      <td>{row.paymentMethod || '—'}</td>
                      <td>{row.site?.name || siteName}</td>
                      <td>
                        <span className="dental-badge dental-badge--ok">
                          {row.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="dental-btn dental-btn--danger"
                          onClick={() =>
                            void dentalApi
                              .deleteIncome(baseUrl, row.id)
                              .then(async () =>
                                setIncomes(await dentalApi.incomes(baseUrl)),
                              )
                          }
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )
    }

    if (view === 'financiamiento') {
      return (
        <CostsAndTreePanels
          baseUrl={baseUrl}
          patients={allPatients}
          onNotify={notify}
          onLoading={setLoading}
          mode="financing"
        />
      )
    }

    if (view === 'gastos') {
      return (
        <>
          <div className="dental-page__head">
            <div>
              <h1>Gastos</h1>
              <p>Comprobantes de egreso y gastos operativos</p>
            </div>
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() => {
                setForm({
                  expenseDate: new Date().toISOString().slice(0, 10),
                  concept: '',
                  amount: '',
                })
                setModal('expense')
              }}
            >
              + Nuevo Gasto
            </button>
          </div>
          <div className="dental-filters">
            <div className="dental-field">
              <label>Buscar</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por número, concepto, proveedor o sede..."
              />
            </div>
          </div>
          {expenses.length === 0 ? (
            <EmptyState
              title="Sin gastos"
              subtitle="No hay gastos registrados para este consultorio."
              actionLabel="Registrar primer gasto"
              onAction={() => setModal('expense')}
            />
          ) : (
            <div className="dental-card dental-table-wrap">
              <table className="dental-table">
                <thead>
                  <tr>
                    <th>FECHA</th>
                    <th>CONCEPTO</th>
                    <th>PROVEEDOR</th>
                    <th>TIPO</th>
                    <th>VALOR</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {new Date(row.expenseDate).toLocaleDateString('es-CO')}
                      </td>
                      <td>{row.concept}</td>
                      <td>{row.provider || '—'}</td>
                      <td>{row.expenseType || '—'}</td>
                      <td>{formatMoney(row.amount)}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )
    }

    if (view === 'reportes') {
      return (
        <CostsAndTreePanels
          baseUrl={baseUrl}
          patients={allPatients}
          onNotify={notify}
          onLoading={setLoading}
          mode="reports"
          onNavigate={(v) => onNavigate(v)}
        />
      )
    }

    if (view === 'inventory') {
      return (
        <>
          <div className="dental-page__head">
            <div>
              <h1>Inventario</h1>
              <p>Control de medicamentos, dispositivos e insumos médicos</p>
            </div>
          </div>
          <div className="dental-legend">
            <span className="exp-soon">Vencimiento: 0-3 meses</span>
            <span className="exp-mid">Vencimiento: 3-6 meses</span>
            <span className="exp-ok">Vencimiento: 6 meses o más</span>
          </div>
          <div className="dental-inventory-embed">{inventorySlot}</div>
        </>
      )
    }

    if (view === 'analytics') {
      return (
        <>
          <div className="dental-page__head">
            <div>
              <h1>Finanzas</h1>
              <p>Análisis de entradas, salidas y utilidad del consultorio.</p>
            </div>
          </div>
          <div className="dental-inventory-embed">{analyticsSlot}</div>
        </>
      )
    }

    if (view === 'bio-temp') {
      const monthLabel = new Date().toLocaleDateString('es-CO', {
        month: 'long',
        year: 'numeric',
      })
      return (
        <>
          <div className="dental-page__head">
            <div>
              <h1>Temperatura y Humedad</h1>
              <p>
                Control mensual por sede y termohigrómetro con registro,
                observaciones y gráficas.
              </p>
            </div>
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() => {
                setForm({ logDate: new Date().toISOString().slice(0, 10) })
                setModal('temp')
              }}
            >
              + Nuevo registro
            </button>
          </div>
          <div className="dental-card">
            <h3 style={{ marginTop: 0 }}>
              Control de Temperatura y Humedad {monthLabel}
            </h3>
            <div className="dental-filters" style={{ background: 'transparent', padding: 0 }}>
              <div className="dental-field">
                <label>Sede</label>
                <select defaultValue="">
                  <option value="">Seleccionar sede</option>
                  {overview?.sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dental-field">
                <label>Termohigrómetro</label>
                <select defaultValue="">
                  <option value="">No hay termohigrómetros</option>
                </select>
              </div>
            </div>
            {tempLogs.length === 0 ? (
              <EmptyState
                title="Sin registros"
                subtitle="Registra temperatura y humedad para el mes actual."
                actionLabel="Nuevo registro"
                onAction={() => setModal('temp')}
              />
            ) : (
              <ul>
                {tempLogs.map((row) => {
                  const r = row as {
                    id: string
                    logDate: string
                    temperatureC?: string
                    humidityPct?: string
                  }
                  return (
                    <li key={r.id}>
                      {new Date(r.logDate).toLocaleDateString()} — {r.temperatureC ?? '—'}
                      °C / {r.humidityPct ?? '—'}%
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )
    }

    if (view === 'bio-sterilization') {
      return (
        <>
          <div className="dental-page__head">
            <div>
              <h1>Esterilizaciones</h1>
              <p>Listado de cargas de esterilización registradas.</p>
            </div>
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() => {
                setForm({ loadDate: new Date().toISOString() })
                setModal('sterilization')
              }}
            >
              + Nueva esterilización
            </button>
          </div>
          {sterilizations.length === 0 ? (
            <EmptyState
              title="No hay esterilizaciones"
              subtitle="Crea la primera carga de esterilización."
              actionLabel="Nueva esterilización"
              onAction={() => setModal('sterilization')}
            />
          ) : (
            <div className="dental-card">
              <ul>
                {sterilizations.map((row) => {
                  const r = row as {
                    id: string
                    loadDate: string
                    equipment?: string
                    result?: string
                  }
                  return (
                    <li key={r.id}>
                      {new Date(r.loadDate).toLocaleString()} — {r.equipment || 'Equipo'} —{' '}
                      {r.result}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </>
      )
    }

    if (view === 'bio-waste') {
      return (
        <>
          <div className="dental-page__head">
            <div>
              <h1>Residuos</h1>
              <p>Gestión de manejo y disposición de residuos del consultorio.</p>
            </div>
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() => {
                setForm({ wasteDate: new Date().toISOString().slice(0, 10) })
                setModal('waste')
              }}
            >
              + Nuevo residuo
            </button>
          </div>
          <div className="dental-filters">
            <div className="dental-field">
              <label>Buscar</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tipo, clasificación, bolsa, peso, sede..."
              />
            </div>
          </div>
          {wastes.length === 0 ? (
            <EmptyState
              title="No hay residuos registrados"
              subtitle="Crea un registro de residuo para comenzar el control de bioseguridad."
              actionLabel="Nuevo residuo"
              onAction={() => setModal('waste')}
            />
          ) : (
            <div className="dental-card">
              <ul>
                {wastes.map((row) => {
                  const r = row as {
                    id: string
                    wasteDate: string
                    wasteType: string
                    bagColor?: string
                  }
                  return (
                    <li key={r.id}>
                      {new Date(r.wasteDate).toLocaleDateString()} — {r.wasteType} —{' '}
                      {r.bagColor || '—'}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </>
      )
    }

    if (view === 'dental-config') {
      return null
    }

    return null
  }

  return (
    <div className="dental-app">
      <DentalLoadingOverlay show={loading} />
      <DentalToast toast={toast} onClose={() => setToast(null)} />
      <aside className="dental-app__sidebar">
        <nav className="dental-app__nav" aria-label="Módulos clínicos">
          {DENTAL_NAV.map((item) => {
            const active =
              item.children?.some((c) => c.view === view) || item.view === view
            if (item.children) {
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    className={`dental-nav__btn${active ? ' dental-nav__btn--active' : ''}`}
                    onClick={() => setBioOpen((v) => !v)}
                  >
                    <NavIcon name={item.icon} />
                    {item.label}
                  </button>
                  {bioOpen ? (
                    <div className="dental-nav__children">
                      {item.children.map((child) => (
                        <button
                          key={child.view}
                          type="button"
                          className={`dental-nav__child${
                            view === child.view ? ' dental-nav__child--active' : ''
                          }`}
                          onClick={() => onNavigate(child.view)}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            }
            return (
              <button
                key={item.view}
                type="button"
                className={`dental-nav__btn${view === item.view ? ' dental-nav__btn--active' : ''}`}
                onClick={() => onNavigate(item.view)}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="dental-app__main">
        <header className="dental-app__topbar">
          <input
            className="dental-app__search"
            placeholder="Buscar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="dental-app__topbar-actions">
            <div className="dental-app__user-wrap">
              <button
                type="button"
                className="dental-app__user"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                <div className="dental-app__avatar">{initials(user.name)}</div>
                <span>{user.name}</span>
              </button>
              {userMenuOpen ? (
                <div className="dental-app__user-menu" role="menu">
                  <div className="dental-app__user-menu-profile">
                    <div className="dental-app__avatar dental-app__avatar--lg">
                      {initials(user.name)}
                    </div>
                    <div>
                      <strong>Perfil</strong>
                      <p>{user.name}</p>
                      <p>{user.email}</p>
                      <p>{user.companyName}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    className="dental-app__user-menu-item dental-app__user-menu-item--danger"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onLogout()
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : null}
            </div>
            <ThemeSwitch theme={theme} onToggle={onToggleTheme} compact />
          </div>
        </header>
        <main className="dental-app__content" id="main-content">
          {error ? (
            <div className="dental-card" style={{ marginBottom: '1rem', color: 'var(--dental-danger)' }}>
              {error}
            </div>
          ) : null}
          {renderMain()}
        </main>
      </div>

      {modal === 'patient' ? (
        <Modal title="Nuevo paciente" onClose={() => setModal(null)}>
          <div className="dental-grid" style={{ gap: '0.75rem' }}>
            {[
              ['fullName', 'Nombre completo'],
              ['documentNumber', 'Documento'],
              ['phone', 'Celular'],
              ['email', 'Email'],
              ['occupation', 'Ocupación'],
              ['city', 'Ciudad'],
            ].map(([key, label]) => (
              <div key={key} className="dental-field">
                <label>{label}</label>
                <input
                  value={form[key] || ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() => void submitPatient()}
            >
              Guardar
            </button>
          </div>
        </Modal>
      ) : null}

      {modal === 'edit-patient' ? (
        <Modal title="Editar paciente" onClose={() => setModal(null)}>
          <div className="dental-grid" style={{ gap: '0.75rem' }}>
            {[
              ['fullName', 'Nombre completo'],
              ['documentNumber', 'Documento'],
              ['phone', 'Celular'],
              ['email', 'Email'],
              ['occupation', 'Ocupación'],
              ['city', 'Ciudad'],
              ['notes', 'Notas / motivo'],
            ].map(([key, label]) => (
              <div key={key} className="dental-field">
                <label>{label}</label>
                <input
                  value={form[key] || ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() => void submitEditPatient()}
            >
              Guardar cambios
            </button>
          </div>
        </Modal>
      ) : null}

      {modal === 'income' ? (
        <Modal title="Nuevo ingreso" onClose={() => setModal(null)}>
          <div className="dental-grid" style={{ gap: '0.75rem' }}>
            <div className="dental-field">
              <label>Fecha</label>
              <input
                type="date"
                value={form.incomeDate || ''}
                onChange={(e) => setForm((f) => ({ ...f, incomeDate: e.target.value }))}
              />
            </div>
            <div className="dental-field">
              <label>Valor</label>
              <input
                type="number"
                value={form.amount || ''}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="dental-field">
              <label>Paciente</label>
              <select
                value={form.patientId || ''}
                onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
              >
                <option value="">Sin paciente</option>
                {allPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() => void submitIncome()}
            >
              Guardar
            </button>
          </div>
        </Modal>
      ) : null}

      {modal === 'expense' ? (
        <Modal title="Nuevo gasto" onClose={() => setModal(null)}>
          <div className="dental-grid" style={{ gap: '0.75rem' }}>
            <div className="dental-field">
              <label>Fecha</label>
              <input
                type="date"
                value={form.expenseDate || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expenseDate: e.target.value }))
                }
              />
            </div>
            <div className="dental-field">
              <label>Concepto</label>
              <input
                value={form.concept || ''}
                onChange={(e) => setForm((f) => ({ ...f, concept: e.target.value }))}
              />
            </div>
            <div className="dental-field">
              <label>Valor</label>
              <input
                type="number"
                value={form.amount || ''}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() => void submitExpense()}
            >
              Guardar
            </button>
          </div>
        </Modal>
      ) : null}

      {modal === 'appointment' ? (
        <Modal title="Nueva cita" onClose={() => setModal(null)}>
          <div className="dental-grid" style={{ gap: '0.75rem' }}>
            <div className="dental-field">
              <label>Fecha</label>
              <input
                type="date"
                value={form.date || ''}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="dental-field">
              <label>Hora</label>
              <input
                type="time"
                value={form.time || ''}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              />
            </div>
            <div className="dental-field">
              <label>Tipo</label>
              <select
                value={form.kind || 'tratamiento'}
                onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
              >
                <option value="primera_vez">Primera vez</option>
                <option value="tratamiento">Tratamiento</option>
                <option value="urgencia">Urgencia</option>
                <option value="control">Control</option>
              </select>
            </div>
            <div className="dental-field">
              <label>Paciente</label>
              <select
                value={form.patientId || ''}
                onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
              >
                <option value="">Sin paciente</option>
                {allPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() => void submitAppointment()}
            >
              Guardar
            </button>
          </div>
        </Modal>
      ) : null}

      {modal === 'sterilization' ? (
        <Modal title="Nueva esterilización" onClose={() => setModal(null)}>
          <div className="dental-grid" style={{ gap: '0.75rem' }}>
            <div className="dental-field">
              <label>Equipo</label>
              <input
                value={form.equipment || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, equipment: e.target.value }))
                }
              />
            </div>
            <div className="dental-field">
              <label>Ciclo</label>
              <input
                value={form.cycle || ''}
                onChange={(e) => setForm((f) => ({ ...f, cycle: e.target.value }))}
              />
            </div>
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() => void submitSterilization()}
            >
              Guardar
            </button>
          </div>
        </Modal>
      ) : null}

      {modal === 'waste' ? (
        <Modal title="Nuevo residuo" onClose={() => setModal(null)}>
          <div className="dental-grid" style={{ gap: '0.75rem' }}>
            <div className="dental-field">
              <label>Tipo</label>
              <input
                value={form.wasteType || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, wasteType: e.target.value }))
                }
              />
            </div>
            <div className="dental-field">
              <label>Clasificación</label>
              <input
                value={form.classification || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, classification: e.target.value }))
                }
              />
            </div>
            <div className="dental-field">
              <label>Bolsa</label>
              <input
                value={form.bagColor || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bagColor: e.target.value }))
                }
              />
            </div>
            <div className="dental-field">
              <label>Peso (kg)</label>
              <input
                type="number"
                value={form.weightKg || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, weightKg: e.target.value }))
                }
              />
            </div>
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() => void submitWaste()}
            >
              Guardar
            </button>
          </div>
        </Modal>
      ) : null}

      {modal === 'temp' ? (
        <Modal title="Registro temperatura / humedad" onClose={() => setModal(null)}>
          <div className="dental-grid" style={{ gap: '0.75rem' }}>
            <div className="dental-field">
              <label>Fecha</label>
              <input
                type="date"
                value={form.logDate || ''}
                onChange={(e) => setForm((f) => ({ ...f, logDate: e.target.value }))}
              />
            </div>
            <div className="dental-field">
              <label>Temperatura (°C)</label>
              <input
                type="number"
                value={form.temperatureC || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, temperatureC: e.target.value }))
                }
              />
            </div>
            <div className="dental-field">
              <label>Humedad (%)</label>
              <input
                type="number"
                value={form.humidityPct || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, humidityPct: e.target.value }))
                }
              />
            </div>
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() => void submitTemp()}
            >
              Guardar
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
