import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useEntityActionAnimation } from '../hooks/useEntityActionAnimation'
import {
  createStaffMember,
  createStaffShift,
  datetimeLocalValueToIsoUtcOrNull,
  deleteStaffMember,
  deleteStaffShift,
  fetchStaffMembers,
  fetchStaffShifts,
  fetchStaffSummary,
  isoInstantToDatetimeLocalValue,
  updateStaffMember,
  updateStaffShift,
  type StaffMemberRow,
  type StaffShiftRow,
  type StaffSummary,
} from '../api'
import { ViewBootSplash } from './DataLoadingSplash'
import type { AuthUser } from '../api'
import { canManageAllStaff } from '../lib/permissions'
import { namedCopy } from '../lib/userIdentity'
import {
  StaffProfileCard,
  formatPersonDate,
  formatStaffMoney,
  personInitials,
} from './StaffProfileCard'
import { mobileViewClass } from './mobile/mobileView'

function parseMoneyInput(v: string): number {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

function currentPeriodYm(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function periodRange(ym: string): { from: string; to: string } {
  const [y, m] = ym.split('-').map((x) => parseInt(x, 10))
  const from = `${y}-${String(m).padStart(2, '0')}-01`
  const last = new Date(y, m, 0).getDate()
  const to = `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`
  return { from, to }
}

function shiftPeriodYm(ym: string, deltaMonths: number): string {
  const [y, m] = ym.split('-').map((x) => parseInt(x, 10))
  const d = new Date(y, m - 1 + deltaMonths, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatPeriodLabel(ym: string): string {
  const [y, m] = ym.split('-').map((x) => parseInt(x, 10))
  const label = new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m - 1, 1))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatHours(v: string | number | null | undefined): string {
  const n =
    typeof v === 'number'
      ? v
      : parseFloat(String(v ?? '').replace(',', '.'))
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(2).replace(/\.?0+$/, '')
}

function formatShiftTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

const SHIFT_STATUS_LABEL: Record<StaffShiftRow['status'], string> = {
  OPEN: 'En curso',
  CLOSED: 'Cerrado',
  PAID: 'Pagado',
}

function overlay(node: ReactNode) {
  return createPortal(node, document.body)
}

type Tab = 'people' | 'shifts'

type MemberDraft = {
  name: string
  phone: string
  email: string
  idNumber: string
  defaultHourlyRate: string
  active: boolean
  notes: string
}

type ShiftDraft = {
  staffMemberId: string
  startLocal: string
  endLocal: string
  hourlyRate: string
  manualHours: string
  useManualHours: boolean
  status: StaffShiftRow['status']
  notes: string
}

function emptyMemberDraft(): MemberDraft {
  return {
    name: '',
    phone: '',
    email: '',
    idNumber: '',
    defaultHourlyRate: '',
    active: true,
    notes: '',
  }
}

function memberToDraft(m: StaffMemberRow): MemberDraft {
  return {
    name: m.name,
    phone: m.phone ?? '',
    email: m.email ?? '',
    idNumber: m.idNumber ?? '',
    defaultHourlyRate: m.defaultHourlyRate,
    active: m.active,
    notes: m.notes ?? '',
  }
}

function emptyShiftDraft(members: StaffMemberRow[]): ShiftDraft {
  const first = members.find((m) => m.active) ?? members[0]
  const now = new Date()
  now.setMinutes(0, 0, 0)
  return {
    staffMemberId: first?.id ?? '',
    startLocal: isoInstantToDatetimeLocalValue(now.toISOString()),
    endLocal: '',
    hourlyRate: first?.defaultHourlyRate ?? '',
    manualHours: '',
    useManualHours: false,
    status: 'OPEN',
    notes: '',
  }
}

export function StaffManager({
  baseUrl,
  user,
}: {
  baseUrl: string
  user?: AuthUser | null
}) {
  const { rowClass, panelClass, runPanelRemove, flashSaved } = useEntityActionAnimation()
  const [tab, setTab] = useState<Tab>('shifts')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<StaffMemberRow[]>([])
  const [shifts, setShifts] = useState<StaffShiftRow[]>([])
  const [summary, setSummary] = useState<StaffSummary | null>(null)
  const [filterMemberId, setFilterMemberId] = useState('')

  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [memberDraft, setMemberDraft] = useState<MemberDraft>(emptyMemberDraft)
  const [memberSaving, setMemberSaving] = useState(false)

  const [shiftModalOpen, setShiftModalOpen] = useState(false)
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null)
  const [shiftDraft, setShiftDraft] = useState<ShiftDraft>(() => emptyShiftDraft([]))
  const [shiftSaving, setShiftSaving] = useState(false)
  const [profileMember, setProfileMember] = useState<StaffMemberRow | null>(null)
  const [periodYm, setPeriodYm] = useState(currentPeriodYm)
  const autoPeriodSteps = useRef(0)
  const manageAll = canManageAllStaff(user)

  const ownMember = useMemo(() => {
    if (!user) return manageAll ? null : (members[0] ?? null)
    return (
      members.find((m) => m.userId && m.userId === user.sub) ||
      members.find(
        (m) => m.email?.trim().toLowerCase() === user.email.trim().toLowerCase(),
      ) ||
      members.find(
        (m) => m.name.trim().toLowerCase() === user.name.trim().toLowerCase(),
      ) ||
      (manageAll ? null : members[0] ?? null)
    )
  }, [manageAll, members, user])

  const selfMember = manageAll ? null : ownMember

  const period = useMemo(() => periodRange(periodYm), [periodYm])
  const periodLabel = useMemo(() => formatPeriodLabel(periodYm), [periodYm])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [membersRes, shiftsRes, summaryRes] = await Promise.all([
        fetchStaffMembers(baseUrl, { limit: 200, active: undefined }),
        fetchStaffShifts(baseUrl, {
          limit: 100,
          staffMemberId: filterMemberId || undefined,
          dateFrom: period.from,
          dateTo: period.to,
        }),
        fetchStaffSummary(baseUrl, { dateFrom: period.from, dateTo: period.to }),
      ])
      setMembers(membersRes.data)
      setShifts(shiftsRes.data)
      setSummary(summaryRes)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar personal')
    } finally {
      setLoading(false)
    }
  }, [baseUrl, filterMemberId, period.from, period.to])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!manageAll && tab === 'people') setTab('shifts')
  }, [manageAll, tab])

  useEffect(() => {
    if (!manageAll && selfMember && filterMemberId !== selfMember.id) {
      setFilterMemberId(selfMember.id)
    }
  }, [manageAll, selfMember, filterMemberId])

  useEffect(() => {
    if (loading || tab !== 'shifts' || autoPeriodSteps.current >= 6) return
    if ((summary?.shiftCount ?? shifts.length) > 0) {
      autoPeriodSteps.current = 6
      return
    }
    autoPeriodSteps.current += 1
    setPeriodYm((ym) => shiftPeriodYm(ym, -1))
  }, [loading, tab, shifts.length, summary?.shiftCount])

  const previewShift = useMemo(() => {
    const rate = parseMoneyInput(shiftDraft.hourlyRate)
    if (shiftDraft.useManualHours) {
      const h = parseMoneyInput(shiftDraft.manualHours)
      if (!Number.isFinite(h) || !Number.isFinite(rate)) return null
      return { hours: h, total: Math.round(h * rate) }
    }
    const start = datetimeLocalValueToIsoUtcOrNull(shiftDraft.startLocal)
    const end = shiftDraft.endLocal
      ? datetimeLocalValueToIsoUtcOrNull(shiftDraft.endLocal)
      : null
    if (!start || !end || !Number.isFinite(rate)) return null
    const ms = new Date(end).getTime() - new Date(start).getTime()
    if (ms < 0) return null
    const hours = ms / (1000 * 60 * 60)
    return { hours, total: Math.round(hours * rate) }
  }, [shiftDraft])

  const openCreateMember = () => {
    setEditingMemberId(null)
    setMemberDraft(emptyMemberDraft())
    setMemberModalOpen(true)
  }

  const openEditMember = (m: StaffMemberRow) => {
    setEditingMemberId(m.id)
    setMemberDraft(memberToDraft(m))
    setMemberModalOpen(true)
  }

  const saveMember = async () => {
    if (!memberDraft.name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    const selfEditOnly = !manageAll
    if (!selfEditOnly) {
      const rate = parseMoneyInput(memberDraft.defaultHourlyRate)
      if (!Number.isFinite(rate) || rate < 0) {
        setError('Tarifa por hora inválida.')
        return
      }
    }
    setMemberSaving(true)
    setError(null)
    try {
      if (editingMemberId) {
        const payload = selfEditOnly
          ? {
              name: memberDraft.name.trim(),
              phone: memberDraft.phone.trim(),
              email: memberDraft.email.trim(),
              idNumber: memberDraft.idNumber.trim(),
              notes: memberDraft.notes.trim(),
            }
          : {
              name: memberDraft.name.trim(),
              phone: memberDraft.phone.trim() || undefined,
              email: memberDraft.email.trim() || undefined,
              idNumber: memberDraft.idNumber.trim() || undefined,
              defaultHourlyRate: parseMoneyInput(memberDraft.defaultHourlyRate),
              active: memberDraft.active,
              notes: memberDraft.notes.trim() || undefined,
            }
        await updateStaffMember(baseUrl, editingMemberId, payload)
        flashSaved(editingMemberId)
      } else {
        await createStaffMember(baseUrl, {
          name: memberDraft.name.trim(),
          phone: memberDraft.phone.trim() || undefined,
          email: memberDraft.email.trim() || undefined,
          idNumber: memberDraft.idNumber.trim() || undefined,
          defaultHourlyRate: parseMoneyInput(memberDraft.defaultHourlyRate),
          active: memberDraft.active,
          notes: memberDraft.notes.trim() || undefined,
        })
      }
      setMemberModalOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setMemberSaving(false)
    }
  }

  const openCreateShift = () => {
    setEditingShiftId(null)
    const draft = emptyShiftDraft(members)
    if (!manageAll && selfMember) {
      draft.staffMemberId = selfMember.id
      draft.hourlyRate = selfMember.defaultHourlyRate
    }
    setShiftDraft(draft)
    setShiftModalOpen(true)
  }

  const openEditShift = (s: StaffShiftRow) => {
    setEditingShiftId(s.id)
    setShiftDraft({
      staffMemberId: s.staffMemberId,
      startLocal: isoInstantToDatetimeLocalValue(s.startAt),
      endLocal: s.endAt ? isoInstantToDatetimeLocalValue(s.endAt) : '',
      hourlyRate: s.hourlyRateCOP,
      manualHours: s.hoursWorked ?? '',
      useManualHours: Boolean(s.hoursWorked && !s.endAt),
      status: s.status,
      notes: s.notes ?? '',
    })
    setShiftModalOpen(true)
  }

  const saveShift = async () => {
    const lockedRate = !manageAll
      ? parseMoneyInput(selfMember?.defaultHourlyRate ?? shiftDraft.hourlyRate)
      : parseMoneyInput(shiftDraft.hourlyRate)
    const rate = lockedRate
    if (!shiftDraft.staffMemberId) {
      setError('Seleccione una persona.')
      return
    }
    if (!Number.isFinite(rate) || rate < 0) {
      setError('Tarifa por hora inválida.')
      return
    }
    const startIso = datetimeLocalValueToIsoUtcOrNull(shiftDraft.startLocal)
    if (!startIso) {
      setError('Hora de entrada inválida.')
      return
    }
    const endIso = shiftDraft.endLocal
      ? datetimeLocalValueToIsoUtcOrNull(shiftDraft.endLocal) ?? undefined
      : undefined

    setShiftSaving(true)
    setError(null)
    try {
      if (editingShiftId) {
        await updateStaffShift(baseUrl, editingShiftId, {
          startAt: startIso,
          endAt: endIso ?? null,
          hourlyRateCOP: rate,
          hoursWorked: shiftDraft.useManualHours
            ? parseMoneyInput(shiftDraft.manualHours)
            : null,
          status: shiftDraft.status,
          notes: shiftDraft.notes.trim() || undefined,
        })
        flashSaved(editingShiftId)
      } else {
        await createStaffShift(baseUrl, {
          staffMemberId: shiftDraft.staffMemberId,
          startAt: startIso,
          endAt: endIso,
          hourlyRateCOP: rate,
          hoursWorked: shiftDraft.useManualHours
            ? parseMoneyInput(shiftDraft.manualHours)
            : undefined,
          status: shiftDraft.status,
          notes: shiftDraft.notes.trim() || undefined,
        })
      }
      setShiftModalOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el turno')
    } finally {
      setShiftSaving(false)
    }
  }

  const closeShiftNow = async (s: StaffShiftRow) => {
    setError(null)
    try {
      await updateStaffShift(baseUrl, s.id, {
        endAt: new Date().toISOString(),
        status: 'CLOSED',
      })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cerrar el turno')
    }
  }

  const markShiftPaid = async (s: StaffShiftRow) => {
    setError(null)
    try {
      await updateStaffShift(baseUrl, s.id, { status: 'PAID' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo marcar como pagado')
    }
  }

  return (
    <div className={mobileViewClass('staff', 'staff-manager page-pane')}>
      <header className="staff-manager__head">
        <div>
          <h1 className="staff-manager__title">Personal</h1>
          <p className="muted staff-manager__lead">
            {manageAll
              ? namedCopy(
                  user?.name,
                  '{name}, aquí puede consultar turnos y fichas del equipo.',
                  'Turnos y fichas de personal.',
                )
              : namedCopy(
                  user?.name,
                  '{name}, estos son sus turnos.',
                  'Sus turnos de atención.',
                )}
          </p>
        </div>
        {manageAll ? (
        <div className="view-toggle module-view-toggle" role="tablist" aria-label="Vista personal">
          <button
            type="button"
            role="tab"
            className={tab === 'shifts' ? 'active' : ''}
            aria-selected={tab === 'shifts'}
            onClick={() => setTab('shifts')}
          >
            Turnos
          </button>
          <button
            type="button"
            role="tab"
            className={tab === 'people' ? 'active' : ''}
            aria-selected={tab === 'people'}
            onClick={() => setTab('people')}
          >
            Personas
          </button>
        </div>
        ) : null}
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {tab === 'shifts' ? (
        <>
      <section className="staff-manager__period-bar" aria-label="Periodo de consulta">
        <button
          type="button"
          className="btn-secondary btn-compact staff-manager__period-btn"
          aria-label="Mes anterior"
          onClick={() => setPeriodYm((ym) => shiftPeriodYm(ym, -1))}
        >
          ←
        </button>
        <span className="staff-manager__period-label">{periodLabel}</span>
        <button
          type="button"
          className="btn-secondary btn-compact staff-manager__period-btn"
          aria-label="Mes siguiente"
          onClick={() => setPeriodYm((ym) => shiftPeriodYm(ym, 1))}
        >
          →
        </button>
      </section>

      <section className="staff-manager__kpi-grid" aria-label="Resumen del periodo">
        <article className="staff-manager__kpi">
          <span className="staff-manager__kpi-label">Turnos</span>
          <strong>{loading ? '…' : (summary?.shiftCount ?? 0)}</strong>
        </article>
        <article className="staff-manager__kpi">
          <span className="staff-manager__kpi-label">Horas</span>
          <strong>{loading ? '…' : formatHours(summary?.totalHours ?? 0)}</strong>
        </article>
        <article className="staff-manager__kpi">
          <span className="staff-manager__kpi-label">A pagar</span>
          <strong>{loading ? '…' : formatStaffMoney(summary?.totalPayCOP ?? 0)}</strong>
        </article>
        <article className="staff-manager__kpi">
          <span className="staff-manager__kpi-label">En curso</span>
          <strong>{loading ? '…' : (summary?.openShifts ?? 0)}</strong>
        </article>
      </section>
        </>
      ) : null}

      {tab === 'people' ? (
        <section className="staff-manager__panel">
          <div className="staff-manager__panel-head">
            <h2>Personas</h2>
            <button type="button" className="btn-primary btn-compact" onClick={openCreateMember}>
              + Persona
            </button>
          </div>
          {loading ? (
            <p className="muted">Cargando…</p>
          ) : members.length === 0 ? (
            <p className="muted">No hay personal registrado. Agrega la primera persona.</p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table data-table-striped">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th className="num">$/hora</th>
                    <th>Contacto</th>
                    <th>Alta</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className={rowClass(m.id)}>
                      <td data-label="Nombre">
                        <strong>{m.name}</strong>
                        {m.idNumber?.trim() ? (
                          <span className="muted small"> · {m.idNumber}</span>
                        ) : null}
                      </td>
                      <td className="num mono" data-label="$/hora">{formatStaffMoney(m.defaultHourlyRate)}</td>
                      <td className="muted small" data-label="Contacto">
                        {[m.phone, m.email].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="muted small" data-label="Alta">{formatPersonDate(m.createdAt, 'medium')}</td>
                      <td data-label="Estado">
                        {m.active ? (
                          <span className="badge badge-ok">Activo</span>
                        ) : (
                          <span className="badge badge-muted">Inactivo</span>
                        )}
                      </td>
                      <td className="staff-manager__row-actions" data-label="">
                        <button
                          type="button"
                          className="btn-secondary btn-compact"
                          onClick={() => setProfileMember(m)}
                        >
                          Perfil
                        </button>
                        <button
                          type="button"
                          className="btn-secondary btn-compact"
                          onClick={() => openEditMember(m)}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="staff-manager__panel">
          <div className="staff-manager__panel-head">
            <h2>{manageAll ? `Turnos · ${periodLabel}` : `Mis turnos · ${periodLabel}`}</h2>
            <div className="staff-manager__panel-actions">
              {manageAll ? (
              <label className="inventory-filter">
                <span className="inventory-filter__label">Persona</span>
                <select
                  className="inventory-filter__input"
                  value={filterMemberId}
                  onChange={(e) => setFilterMemberId(e.target.value)}
                >
                  <option value="">Todas</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              ) : null}
              <button type="button" className="btn-primary btn-compact" onClick={openCreateShift}>
                + Turno
              </button>
            </div>
          </div>
          {loading ? (
            <p className="muted">Cargando turnos…</p>
          ) : shifts.length === 0 ? (
            <p className="muted">
              Sin turnos en {periodLabel.toLowerCase()}. Use ← para consultar meses anteriores.
            </p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table data-table-striped">
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th className="num">Horas</th>
                    <th className="num">$/hora</th>
                    <th className="num">Total</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((s) => (
                    <tr key={s.id} className={rowClass(s.id)}>
                      <td data-label="Persona">{s.staffMemberName}</td>
                      <td className="small" data-label="Entrada">{formatShiftTime(s.startAt)}</td>
                      <td className="small" data-label="Salida">{formatShiftTime(s.endAt)}</td>
                      <td className="num mono" data-label="Horas">{formatHours(s.hoursWorked)}</td>
                      <td className="num mono" data-label="$/hora">{formatStaffMoney(s.hourlyRateCOP)}</td>
                      <td className="num mono" data-label="Total">{formatStaffMoney(s.totalPayCOP)}</td>
                      <td data-label="Estado">
                        <span
                          className={`badge ${
                            s.status === 'OPEN'
                              ? 'badge-warn'
                              : s.status === 'PAID'
                                ? 'badge-ok'
                                : 'badge-muted'
                          }`}
                        >
                          {SHIFT_STATUS_LABEL[s.status]}
                        </span>
                      </td>
                      <td className="staff-manager__row-actions" data-label="">
                        {s.status === 'OPEN' && (
                          <button
                            type="button"
                            className="btn-secondary btn-compact"
                            onClick={() => void closeShiftNow(s)}
                          >
                            Cerrar
                          </button>
                        )}
                        {s.status === 'CLOSED' && manageAll && (
                          <button
                            type="button"
                            className="btn-secondary btn-compact"
                            onClick={() => void markShiftPaid(s)}
                          >
                            Pagado
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-secondary btn-compact"
                          onClick={() => openEditShift(s)}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {memberModalOpen && overlay(
        <div
          className="modal-backdrop modal-backdrop--config"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !memberSaving) setMemberModalOpen(false)
          }}
        >
          <section
            className={panelClass('modal', 'modal--config', 'modal--config-lg')}
            role="dialog"
            aria-modal="true"
          >
            <header className="modal-head modal-head--config">
              <h2>
                {editingMemberId
                  ? !manageAll || editingMemberId === ownMember?.id
                    ? 'Editar perfil'
                    : 'Editar persona'
                  : 'Nueva persona'}
              </h2>
              <button
                type="button"
                className="modal-close"
                disabled={memberSaving}
                onClick={() => setMemberModalOpen(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </header>
            <div className="modal-body modal-body--config">
              <label className="field-stack">
                <span>Nombre</span>
                <input
                  value={memberDraft.name}
                  onChange={(e) => setMemberDraft({ ...memberDraft, name: e.target.value })}
                />
              </label>
              {manageAll ? (
              <label className="field-stack">
                <span>Tarifa por hora (COP)</span>
                <input
                  inputMode="decimal"
                  value={memberDraft.defaultHourlyRate}
                  onChange={(e) =>
                    setMemberDraft({ ...memberDraft, defaultHourlyRate: e.target.value })
                  }
                />
              </label>
              ) : null}
              <label className="field-stack">
                <span>Teléfono</span>
                <input
                  value={memberDraft.phone}
                  onChange={(e) => setMemberDraft({ ...memberDraft, phone: e.target.value })}
                />
              </label>
              <label className="field-stack">
                <span>Correo</span>
                <input
                  type="email"
                  value={memberDraft.email}
                  onChange={(e) => setMemberDraft({ ...memberDraft, email: e.target.value })}
                />
              </label>
              <label className="field-stack">
                <span>Documento</span>
                <input
                  value={memberDraft.idNumber}
                  onChange={(e) => setMemberDraft({ ...memberDraft, idNumber: e.target.value })}
                />
              </label>
              <label className="field-stack">
                <span>Notas</span>
                <textarea
                  rows={2}
                  value={memberDraft.notes}
                  onChange={(e) => setMemberDraft({ ...memberDraft, notes: e.target.value })}
                />
              </label>
              {manageAll ? (
              <label className="field-check">
                <input
                  type="checkbox"
                  checked={memberDraft.active}
                  onChange={(e) => setMemberDraft({ ...memberDraft, active: e.target.checked })}
                />
                Activo en turnos
              </label>
              ) : null}
            </div>
            <footer className="modal-foot modal-foot--config">
              {editingMemberId && manageAll && (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={memberSaving}
                  onClick={() => {
                    if (!window.confirm('¿Eliminar esta persona? Se borrarán sus turnos.')) return
                    void (async () => {
                      setMemberSaving(true)
                      try {
                        await runPanelRemove(async () => {
                          await deleteStaffMember(baseUrl, editingMemberId)
                          setMemberModalOpen(false)
                          await load()
                        })
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'No se pudo eliminar')
                      } finally {
                        setMemberSaving(false)
                      }
                    })()
                  }}
                >
                  Eliminar
                </button>
              )}
              <button
                type="button"
                className="btn-secondary"
                disabled={memberSaving}
                onClick={() => setMemberModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={memberSaving}
                onClick={() => void saveMember()}
              >
                {memberSaving ? 'Guardando…' : 'Guardar'}
              </button>
            </footer>
          </section>
        </div>
      )}

      {shiftModalOpen && overlay(
        <div
          className="modal-backdrop modal-backdrop--config"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !shiftSaving) setShiftModalOpen(false)
          }}
        >
          <section
            className={panelClass('modal', 'modal--config', 'modal--shift')}
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-shift-title"
          >
            <header className="modal-head modal-head--config">
              <div>
                <p className="staff-shift-modal__kicker">
                  {editingShiftId ? 'Turno' : 'Nuevo registro'}
                </p>
                <h2 id="staff-shift-title">
                  {editingShiftId ? 'Editar turno' : 'Registrar turno'}
                </h2>
              </div>
              <button
                type="button"
                className="modal-close"
                disabled={shiftSaving}
                onClick={() => setShiftModalOpen(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </header>
            <div className="modal-body modal-body--config staff-shift-modal__body">
              {(() => {
                const person =
                  members.find((m) => m.id === shiftDraft.staffMemberId) ??
                  selfMember ??
                  null
                const lockPerson = !manageAll || Boolean(editingShiftId)
                return (
                  <>
                    {lockPerson && person ? (
                      <div className="staff-shift-who">
                        <span className="staff-shift-who__avatar" aria-hidden>
                          {personInitials(person.name)}
                        </span>
                        <div className="staff-shift-who__copy">
                          <strong>{person.name}</strong>
                          <span>
                            {formatStaffMoney(shiftDraft.hourlyRate || person.defaultHourlyRate)}{' '}
                            / hora
                          </span>
                        </div>
                      </div>
                    ) : (
                      <label className="field-stack">
                        <span>Persona</span>
                        <select
                          value={shiftDraft.staffMemberId}
                          onChange={(e) => {
                            const id = e.target.value
                            const m = members.find((x) => x.id === id)
                            setShiftDraft({
                              ...shiftDraft,
                              staffMemberId: id,
                              hourlyRate: m?.defaultHourlyRate ?? shiftDraft.hourlyRate,
                            })
                          }}
                        >
                          <option value="">Seleccione una persona</option>
                          {members
                            .filter((m) => m.active)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                        </select>
                      </label>
                    )}

                    <div className="staff-shift-times">
                      <label className="field-stack">
                        <span>Entrada</span>
                        <input
                          type="datetime-local"
                          value={shiftDraft.startLocal}
                          onChange={(e) =>
                            setShiftDraft({ ...shiftDraft, startLocal: e.target.value })
                          }
                        />
                      </label>
                      <label className="field-stack">
                        <span>Salida</span>
                        <input
                          type="datetime-local"
                          value={shiftDraft.endLocal}
                          onChange={(e) =>
                            setShiftDraft({ ...shiftDraft, endLocal: e.target.value })
                          }
                        />
                        <em className="staff-shift-times__hint">
                          Deje vacío si el turno sigue en curso
                        </em>
                      </label>
                    </div>

                    {manageAll ? (
                      <label className="field-stack">
                        <span>Tarifa por hora (COP)</span>
                        <input
                          inputMode="decimal"
                          value={shiftDraft.hourlyRate}
                          onChange={(e) =>
                            setShiftDraft({ ...shiftDraft, hourlyRate: e.target.value })
                          }
                        />
                      </label>
                    ) : null}

                    <div className="staff-shift-status" role="group" aria-label="Estado del turno">
                      {(
                        [
                          ['OPEN', 'En curso'],
                          ['CLOSED', 'Cerrado'],
                          ...(manageAll ? ([['PAID', 'Pagado']] as const) : []),
                        ] as Array<[StaffShiftRow['status'], string]>
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={`staff-shift-status__btn${
                            shiftDraft.status === value ? ' is-on' : ''
                          }`}
                          onClick={() => setShiftDraft({ ...shiftDraft, status: value })}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <label className="staff-shift-toggle">
                      <input
                        type="checkbox"
                        checked={shiftDraft.useManualHours}
                        onChange={(e) =>
                          setShiftDraft({ ...shiftDraft, useManualHours: e.target.checked })
                        }
                      />
                      <span>Registrar horas a mano</span>
                    </label>
                    {shiftDraft.useManualHours ? (
                      <label className="field-stack">
                        <span>Horas trabajadas</span>
                        <input
                          inputMode="decimal"
                          value={shiftDraft.manualHours}
                          onChange={(e) =>
                            setShiftDraft({ ...shiftDraft, manualHours: e.target.value })
                          }
                        />
                      </label>
                    ) : null}

                    {previewShift ? (
                      <div className="staff-shift-preview">
                        <span>Total estimado</span>
                        <strong>
                          {formatHours(previewShift.hours)} h ·{' '}
                          {formatStaffMoney(previewShift.total)}
                        </strong>
                      </div>
                    ) : null}

                    <label className="field-stack">
                      <span>Notas</span>
                      <textarea
                        rows={2}
                        placeholder="Opcional"
                        value={shiftDraft.notes}
                        onChange={(e) =>
                          setShiftDraft({ ...shiftDraft, notes: e.target.value })
                        }
                      />
                    </label>
                  </>
                )
              })()}
            </div>
            <footer className="modal-foot modal-foot--config">
              {editingShiftId && manageAll && (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={shiftSaving}
                  onClick={() => {
                    if (!window.confirm('¿Eliminar este turno?')) return
                    void (async () => {
                      setShiftSaving(true)
                      try {
                        await runPanelRemove(async () => {
                          await deleteStaffShift(baseUrl, editingShiftId)
                          setShiftModalOpen(false)
                          await load()
                        })
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'No se pudo eliminar')
                      } finally {
                        setShiftSaving(false)
                      }
                    })()
                  }}
                >
                  Eliminar
                </button>
              )}
              <button
                type="button"
                className="btn-secondary"
                disabled={shiftSaving}
                onClick={() => setShiftModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={shiftSaving}
                onClick={() => void saveShift()}
              >
                {shiftSaving ? 'Guardando…' : 'Guardar turno'}
              </button>
            </footer>
          </section>
        </div>
      )}

      {profileMember
        ? overlay(
        <div
          className="modal-backdrop modal-backdrop--config"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setProfileMember(null)
          }}
        >
          <section
            className={panelClass('modal', 'modal--config', 'modal--config-lg')}
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-profile-title"
          >
            <header className="modal-head modal-head--config">
              <h2 id="staff-profile-title">Perfil</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setProfileMember(null)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </header>
            <div className="modal-body modal-body--config">
              <StaffProfileCard member={profileMember} compact />
            </div>
            <footer className="modal-foot modal-foot--config">
              {manageAll ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const m = profileMember
                    if (!m) return
                    setProfileMember(null)
                    openEditMember(m)
                  }}
                >
                  Editar
                </button>
              ) : null}
              <button
                type="button"
                className="btn-primary"
                onClick={() => setProfileMember(null)}
              >
                Cerrar
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      <ViewBootSplash ready={!loading} label="Cargando personal…" />
    </div>
  )
}
