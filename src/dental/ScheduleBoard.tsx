import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  dentalApi,
  type DentalAppointment,
  type DentalPatient,
  type DentalProcedure,
} from './dentalApi'
import { formatMoney } from './dentalNav'

type Props = {
  baseUrl: string
  siteId?: string
  siteName?: string
  patients: DentalPatient[]
  onChanged?: () => void
  onNotify?: (message: string, type?: 'ok' | 'error' | 'info') => void
  onLoading?: (v: boolean) => void
}

function toLocalDateInput(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Convierte fecha+hora Colombia (UTC-5) a ISO UTC. */
function cotToIso(date: string, time: string) {
  return new Date(`${date}T${time}:00-05:00`).toISOString()
}

export function ScheduleBoard({
  baseUrl,
  siteId,
  siteName,
  patients,
  onChanged,
  onNotify,
  onLoading,
}: Props) {
  const [agendaDate, setAgendaDate] = useState(toLocalDateInput)
  const [appointments, setAppointments] = useState<DentalAppointment[]>([])
  const [procedures, setProcedures] = useState<DentalProcedure[]>([])
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({
    patientId: '',
    procedureId: '',
    date: toLocalDateInput(),
    time: '10:00',
    kind: 'primera_vez',
    notes: '',
    estimatedCost: '',
    durationMin: '30',
  })

  const load = useCallback(async () => {
    setError(null)
    onLoading?.(true)
    try {
      const [appts, procs] = await Promise.all([
        dentalApi.appointments(baseUrl, agendaDate),
        dentalApi.ensureProcedures(baseUrl),
      ])
      setAppointments(appts)
      setProcedures(procs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar agenda')
    } finally {
      onLoading?.(false)
    }
  }, [baseUrl, agendaDate, onLoading])

  useEffect(() => {
    void load()
  }, [load])

  const hours = useMemo(
    () => Array.from({ length: 28 }, (_, i) => 7 + i * 0.5),
    [],
  )

  function onProcedureChange(procedureId: string) {
    const p = procedures.find((x) => x.id === procedureId)
    setForm((f) => ({
      ...f,
      procedureId,
      estimatedCost: p ? String(Number(p.unitPrice)) : f.estimatedCost,
      durationMin: p ? String(p.durationMin) : f.durationMin,
      kind:
        p?.name.toLowerCase().includes('valoraci') ||
        p?.category === 'consulta'
          ? 'primera_vez'
          : f.kind,
    }))
  }

  async function submit() {
    try {
      const proc = procedures.find((p) => p.id === form.procedureId)
      await dentalApi.createAppointment(baseUrl, {
        patientId: form.patientId || undefined,
        siteId: siteId || undefined,
        startsAt: cotToIso(form.date, form.time),
        kind: form.kind,
        status: 'confirmada',
        notes: form.notes || undefined,
        procedureId: form.procedureId || undefined,
        procedureName: proc?.name,
        estimatedCost: form.estimatedCost
          ? Number(form.estimatedCost)
          : undefined,
        durationMin: form.durationMin ? Number(form.durationMin) : 30,
        room: 'CONSULTORIO 1',
      })
      setFormOpen(false)
      setAgendaDate(form.date)
      await load()
      onChanged?.()
      onNotify?.('Cita agendada correctamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agendar')
      onNotify?.(err instanceof Error ? err.message : 'No se pudo agendar', 'error')
    }
  }

  async function charge(appt: DentalAppointment) {
    try {
      await dentalApi.chargeAppointment(baseUrl, appt.id, {
        amount: Number(appt.estimatedCost ?? appt.chargedAmount ?? 0),
        paymentMethod: 'Efectivo',
      })
      await load()
      onChanged?.()
      onNotify?.('Cobro registrado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cobrar')
      onNotify?.(err instanceof Error ? err.message : 'No se pudo cobrar', 'error')
    }
  }

  return (
    <>
      <div className="dental-page__head">
        <div>
          <h1>Agenda</h1>
          <p>{siteName || 'Consultorio'} · Citas con costo asociado</p>
        </div>
        <button
          type="button"
          className="dental-btn dental-btn--primary"
          onClick={() => {
            setForm({
              patientId: patients[0]?.id || '',
              procedureId: procedures[0]?.id || '',
              date: agendaDate,
              time: '10:00',
              kind: 'primera_vez',
              notes: '',
              estimatedCost: procedures[0]
                ? String(Number(procedures[0].unitPrice))
                : '60000',
              durationMin: String(procedures[0]?.durationMin ?? 30),
            })
            setFormOpen(true)
          }}
        >
          + Nueva cita
        </button>
      </div>

      {error ? (
        <div className="dental-alert" style={{ color: 'var(--dental-danger)' }}>
          {error}
        </div>
      ) : null}

      <div className="dental-agenda-toolbar">
        <input
          type="date"
          value={agendaDate}
          onChange={(e) => setAgendaDate(e.target.value)}
        />
        <button
          type="button"
          className="dental-btn dental-btn--ghost"
          onClick={() => setAgendaDate(toLocalDateInput())}
        >
          Hoy
        </button>
        <div className="dental-legend">
          <span className="exp-ok">Confirmada</span>
          <span className="exp-mid">Atendida / cobrada</span>
          <span className="exp-soon">Cancelada</span>
        </div>
      </div>

      <div className="dental-card">
        <strong>CONSULTORIO 1</strong>
        <div className="dental-agenda-grid" style={{ marginTop: '0.75rem' }}>
          <div className="dental-agenda-times">
            {hours.map((h) => {
              const hh = Math.floor(h)
              const mm = h % 1 ? '30' : '00'
              const suffix = hh >= 12 ? 'pm' : 'am'
              const display = `${((hh + 11) % 12) + 1}:${mm} ${suffix}`
              return <div key={h}>{display}</div>
            })}
          </div>
          <div className="dental-agenda-slots">
            {appointments.length === 0 ? (
              <div className="dental-empty" style={{ paddingTop: '4rem' }}>
                <strong>Sin citas para este día</strong>
                <p>Agenda la primera cita con procedimiento y valor.</p>
                <button
                  type="button"
                  className="dental-btn dental-btn--primary"
                  onClick={() => setFormOpen(true)}
                >
                  Nueva cita
                </button>
              </div>
            ) : (
              appointments.map((a) => {
                const paid = (a.incomes?.length ?? 0) > 0 || Number(a.chargedAmount ?? 0) > 0
                return (
                  <div key={a.id} className="dental-appt-chip">
                    <div>
                      <strong>
                        {new Date(a.startsAt).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'America/Bogota',
                        })}
                      </strong>{' '}
                      · {a.patient?.fullName ?? 'Sin paciente'}
                    </div>
                    <div>
                      {a.procedureName || a.kind} · {a.durationMin ?? 30} min ·{' '}
                      {formatMoney(a.estimatedCost ?? 0)}
                      {paid ? (
                        <span className="dental-badge dental-badge--ok" style={{ marginLeft: 8 }}>
                          Cobrado {formatMoney(a.chargedAmount ?? a.estimatedCost ?? 0)}
                        </span>
                      ) : (
                        <span className="dental-badge dental-badge--warn" style={{ marginLeft: 8 }}>
                          Por cobrar
                        </span>
                      )}
                    </div>
                    {a.notes ? <div style={{ opacity: 0.85 }}>{a.notes}</div> : null}
                    <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {!paid ? (
                        <button
                          type="button"
                          className="dental-btn dental-btn--primary"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                          onClick={() => void charge(a)}
                        >
                          Cobrar cita
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="dental-btn dental-btn--ghost"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                        onClick={() =>
                          void dentalApi
                            .updateAppointment(baseUrl, a.id, { status: 'atendida' })
                            .then(load)
                        }
                      >
                        Atendida
                      </button>
                      <button
                        type="button"
                        className="dental-btn dental-btn--danger"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                        onClick={() =>
                          void dentalApi.deleteAppointment(baseUrl, a.id).then(async () => {
                            await load()
                            onChanged?.()
                          })
                        }
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {formOpen ? (
        <div className="dental-modal-backdrop" role="dialog" aria-modal="true">
          <div className="dental-modal">
            <h2>Agendar cita</h2>
            <div className="dental-grid" style={{ gap: '0.75rem' }}>
              <div className="dental-field">
                <label>Paciente</label>
                <select
                  value={form.patientId}
                  onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
                >
                  <option value="">Seleccionar paciente</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} · {p.documentNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dental-field">
                <label>Procedimiento / servicio</label>
                <select
                  value={form.procedureId}
                  onChange={(e) => onProcedureChange(e.target.value)}
                >
                  <option value="">Sin procedimiento</option>
                  {procedures.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {formatMoney(p.unitPrice)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dental-field">
                <label>Fecha</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="dental-field">
                <label>Hora</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                />
              </div>
              <div className="dental-field">
                <label>Duración (min)</label>
                <input
                  type="number"
                  value={form.durationMin}
                  onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))}
                />
              </div>
              <div className="dental-field">
                <label>Costo estimado</label>
                <input
                  type="number"
                  value={form.estimatedCost}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, estimatedCost: e.target.value }))
                  }
                />
              </div>
              <div className="dental-field">
                <label>Tipo</label>
                <select
                  value={form.kind}
                  onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
                >
                  <option value="primera_vez">Primera vez</option>
                  <option value="tratamiento">Tratamiento</option>
                  <option value="urgencia">Urgencia</option>
                  <option value="control">Control</option>
                </select>
              </div>
              <div className="dental-field">
                <label>Notas</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej. Valoración odontológica"
                />
              </div>
            </div>
            <div className="dental-modal__actions">
              <button
                type="button"
                className="dental-btn dental-btn--ghost"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="dental-btn dental-btn--primary"
                onClick={() => void submit()}
              >
                Guardar cita
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
