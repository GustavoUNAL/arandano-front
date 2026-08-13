import { useEffect, useMemo, useRef, useState } from 'react'
import {
  dentalApi,
  type DentalAppointment,
  type DentalIncome,
  type DentalPatient,
} from './dentalApi'
import { formatMoney, initials, needsValuation } from './dentalNav'

const HC_SECTIONS = [
  ['anamnesis', 'Anamnesis'],
  ['odontogramas', 'Odontogramas'],
  ['presupuestos', 'Presupuestos'],
  ['tratamientos', 'Tratamientos'],
  ['consentimientos', 'Consentimientos'],
  ['evoluciones', 'Evoluciones'],
  ['remisiones', 'Remisiones'],
  ['formulas', 'Fórmulas'],
  ['periodontogramas', 'Periodontogramas'],
  ['incapacidades', 'Incapacidades'],
] as const

type HcKey = (typeof HC_SECTIONS)[number][0]

const TABS = [
  { id: 'hc', label: 'Historia clínica' },
  { id: 'citas', label: 'Citas' },
  { id: 'cuenta', label: 'Cuenta' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'ayudas', label: 'Ayudas' },
  { id: 'alertas', label: 'Alertas' },
  { id: 'llamadas', label: 'Llamadas' },
] as const

type TabId = (typeof TABS)[number]['id']
type ListKey = 'documentos' | 'ayudas' | 'alertas' | 'llamadas'
type ToothStatus = 'sano' | 'caries' | 'obturado' | 'ausente'

const TOOTH_CYCLE: ToothStatus[] = ['sano', 'caries', 'obturado', 'ausente']
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
const MAX_ATTACH_BYTES = 1.5 * 1024 * 1024

type HistEntry = {
  id?: string
  date?: string
  title?: string
  name?: string
  note?: string
  status?: string
  amount?: string | number
  linkSection?: string
  linkId?: string
  linkLabel?: string
  fileName?: string
  fileType?: string
  fileDataUrl?: string
  kind?: string
  result?: string
  level?: string
  outcome?: string
}

type PatientWithRelations = DentalPatient & {
  appointments?: DentalAppointment[]
  incomes?: DentalIncome[]
}

type Props = {
  baseUrl: string
  patient: PatientWithRelations
  onBack: () => void
  onEdit: () => void
  onUpdated: (p: PatientWithRelations) => void
  onSchedule?: () => void
  onNotify?: (message: string, type?: 'ok' | 'error' | 'info') => void
}

function entryLabel(row: HistEntry, fallback: string) {
  return row.title || row.name || row.note || fallback
}

async function readFileAsDataUrl(file: File): Promise<{
  fileName: string
  fileType: string
  fileDataUrl: string
}> {
  if (file.size > MAX_ATTACH_BYTES) {
    throw new Error('El archivo supera 1.5 MB. Usa uno más liviano o un enlace.')
  }
  const fileDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
  return { fileName: file.name, fileType: file.type || 'application/octet-stream', fileDataUrl }
}

function EmptyState({
  title,
  hint,
  actionLabel,
  onAction,
}: {
  title: string
  hint: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="dental-empty dental-empty--panel">
      <strong>{title}</strong>
      <p>{hint}</p>
      <button type="button" className="dental-btn dental-btn--primary" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  )
}

function AttachField({
  fileName,
  onPick,
  onClear,
}: {
  fileName?: string
  onPick: (file: File) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="dental-field">
      <label>Adjuntar archivo</label>
      <div className="dental-attach">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,image/*,application/pdf"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onPick(f)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          className="dental-btn dental-btn--ghost"
          onClick={() => inputRef.current?.click()}
        >
          {fileName ? 'Cambiar archivo' : 'Elegir archivo'}
        </button>
        {fileName ? (
          <>
            <span className="dental-muted dental-attach__name">{fileName}</span>
            <button type="button" className="dental-link" onClick={onClear}>
              Quitar
            </button>
          </>
        ) : (
          <span className="dental-muted">PDF o imagen · máx. 1.5 MB</span>
        )}
      </div>
    </div>
  )
}

function OdontogramBlock({
  teeth,
  observations,
  busy,
  onToggleTooth,
  onSaveObservations,
}: {
  teeth: Record<string, ToothStatus>
  observations?: string[] | null
  busy?: boolean
  onToggleTooth: (n: number) => void
  onSaveObservations: (text: string) => void
}) {
  const initialObs = (observations && observations.length > 0 ? observations : ['']).join('\n')
  const [obsDraft, setObsDraft] = useState(initialObs)
  useEffect(() => {
    setObsDraft(initialObs)
  }, [initialObs])
  return (
    <div className="dental-odontogram dental-odontogram--embedded">
      <div className="dental-odontogram__head">
        <div>
          <strong>Odontograma permanente</strong>
          <div className="dental-muted">Clic en un diente para marcar estado</div>
        </div>
        <div className="dental-odontogram__legend">
          <span data-s="sano">Sano</span>
          <span data-s="caries">Caries</span>
          <span data-s="obturado">Obturado</span>
          <span data-s="ausente">Ausente</span>
        </div>
      </div>
      <div className="dental-odontogram__arch">
        <div className="dental-odontogram__row">
          {UPPER.map((n) => {
            const status = teeth[String(n)] ?? 'sano'
            return (
              <button
                key={n}
                type="button"
                className={`dental-tooth dental-tooth--${status}`}
                disabled={busy}
                title={`${n} · ${status}`}
                onClick={() => onToggleTooth(n)}
              >
                <div className="dental-tooth__face" />
                <span>{n}</span>
              </button>
            )
          })}
        </div>
        <div className="dental-odontogram__row">
          {LOWER.map((n) => {
            const status = teeth[String(n)] ?? 'sano'
            return (
              <button
                key={n}
                type="button"
                className={`dental-tooth dental-tooth--${status}`}
                disabled={busy}
                title={`${n} · ${status}`}
                onClick={() => onToggleTooth(n)}
              >
                <div className="dental-tooth__face" />
                <span>{n}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="dental-odontogram__notes">
        <div className="dental-field">
          <label>Observaciones del odontograma</label>
          <textarea
            rows={3}
            value={obsDraft}
            onChange={(e) => setObsDraft(e.target.value)}
            placeholder="Hallazgos, plan, notas…"
          />
        </div>
        <button
          type="button"
          className="dental-btn dental-btn--primary"
          disabled={busy}
          onClick={() =>
            onSaveObservations(
              obsDraft
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean)
                .join('\n'),
            )
          }
        >
          Guardar observaciones
        </button>
      </div>
    </div>
  )
}

export function PatientChart({
  baseUrl,
  patient,
  onBack,
  onEdit,
  onUpdated,
  onSchedule,
  onNotify,
}: Props) {
  const [tab, setTab] = useState<TabId>('hc')
  const [expandedHc, setExpandedHc] = useState<HcKey | null>('odontogramas')
  const [addingHc, setAddingHc] = useState(false)
  const [addingList, setAddingList] = useState(false)
  const [hcForm, setHcForm] = useState({
    title: '',
    note: '',
    status: 'pendiente',
    amount: '',
    linkSection: '',
    linkId: '',
    fileName: '',
    fileType: '',
    fileDataUrl: '',
  })
  const [listForm, setListForm] = useState({
    name: '',
    note: '',
    kind: 'general',
    result: '',
    level: 'media',
    outcome: 'contestada',
    fileName: '',
    fileType: '',
    fileDataUrl: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hist = useMemo(() => {
    const raw = (patient.clinicalHistory ?? {}) as Record<string, unknown[]>
    const base: Record<string, HistEntry[]> = {}
    for (const [key] of HC_SECTIONS) {
      base[key] = (Array.isArray(raw[key]) ? raw[key] : []) as HistEntry[]
    }
    for (const key of ['documentos', 'ayudas', 'alertas', 'llamadas'] as const) {
      base[key] = (Array.isArray(raw[key]) ? raw[key] : []) as HistEntry[]
    }
    return base
  }, [patient.clinicalHistory])

  const teethMap = useMemo(() => {
    const raw = (patient.odontogram?.teeth ?? {}) as Record<string, unknown>
    const out: Record<string, ToothStatus> = {}
    for (const [k, v] of Object.entries(raw)) {
      const s = typeof v === 'string' ? v : (v as { status?: string })?.status
      if (s && TOOTH_CYCLE.includes(s as ToothStatus)) out[k] = s as ToothStatus
    }
    return out
  }, [patient.odontogram])

  const appointments = patient.appointments ?? []
  const incomes = patient.incomes ?? []
  const charged = incomes.reduce((s, i) => s + Number(i.amount || 0), 0)
  const estimated = appointments.reduce(
    (s, a) => s + Number(a.estimatedCost || 0),
    0,
  )
  const balance = estimated - charged

  const linkOptions = useMemo(() => {
    const opts: Array<{ section: string; id: string; label: string }> = []
    for (const [key, label] of HC_SECTIONS) {
      for (const row of hist[key] ?? []) {
        if (!row.id) continue
        opts.push({
          section: key,
          id: row.id,
          label: `${label}: ${entryLabel(row, 'Registro')}`,
        })
      }
    }
    for (const a of appointments) {
      opts.push({
        section: 'citas',
        id: a.id,
        label: `Cita: ${a.procedureName || a.kind} · ${new Date(a.startsAt).toLocaleDateString('es-CO')}`,
      })
    }
    return opts
  }, [hist, appointments])

  async function patchHistory(next: Record<string, HistEntry[]>) {
    setBusy(true)
    setError(null)
    try {
      const updated = await dentalApi.updatePatient(baseUrl, patient.id, {
        clinicalHistory: next,
      })
      onUpdated({ ...patient, ...updated, appointments, incomes })
      setAddingHc(false)
      setAddingList(false)
      onNotify?.('Historia clínica actualizada')
      setHcForm({
        title: '',
        note: '',
        status: 'pendiente',
        amount: '',
        linkSection: '',
        linkId: '',
        fileName: '',
        fileType: '',
        fileDataUrl: '',
      })
      setListForm({
        name: '',
        note: '',
        kind: 'general',
        result: '',
        level: 'media',
        outcome: 'contestada',
        fileName: '',
        fileType: '',
        fileDataUrl: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setBusy(false)
    }
  }

  async function saveOdontogram(nextTeeth: Record<string, ToothStatus>, observations: string[]) {
    setBusy(true)
    setError(null)
    try {
      const updated = await dentalApi.updatePatient(baseUrl, patient.id, {
        odontogram: {
          type: patient.odontogram?.type ?? 'permanente',
          teeth: nextTeeth,
          observations,
        },
      })
      onUpdated({ ...patient, ...updated, appointments, incomes })
      onNotify?.('Odontograma guardado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar odontograma')
      onNotify?.(
        err instanceof Error ? err.message : 'No se pudo guardar odontograma',
        'error',
      )
    } finally {
      setBusy(false)
    }
  }

  async function toggleTooth(n: number) {
    const key = String(n)
    const cur = teethMap[key] ?? 'sano'
    const nextStatus = TOOTH_CYCLE[(TOOTH_CYCLE.indexOf(cur) + 1) % TOOTH_CYCLE.length]
    await saveOdontogram(
      { ...teethMap, [key]: nextStatus },
      patient.odontogram?.observations ?? [],
    )
  }

  async function addHcEntry(section: HcKey) {
    if (!hcForm.note.trim() && !hcForm.title.trim() && !hcForm.fileDataUrl) return
    const link = linkOptions.find(
      (o) => o.section === hcForm.linkSection && o.id === hcForm.linkId,
    )
    const entry: HistEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      title: hcForm.title.trim() || undefined,
      note: hcForm.note.trim() || undefined,
      status: section === 'tratamientos' || section === 'presupuestos' ? hcForm.status : undefined,
      amount: hcForm.amount.trim() || undefined,
      linkSection: link?.section,
      linkId: link?.id,
      linkLabel: link?.label,
      fileName: hcForm.fileName || undefined,
      fileType: hcForm.fileType || undefined,
      fileDataUrl: hcForm.fileDataUrl || undefined,
    }
    await patchHistory({
      ...hist,
      [section]: [...(hist[section] ?? []), entry],
    })
  }

  async function addListEntry(section: ListKey) {
    if (!listForm.name.trim() && !listForm.note.trim() && !listForm.fileDataUrl) return
    const entry: HistEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      name: listForm.name.trim() || undefined,
      note: listForm.note.trim() || undefined,
      kind: section === 'documentos' ? listForm.kind : undefined,
      result: section === 'ayudas' ? listForm.result : undefined,
      level: section === 'alertas' ? listForm.level : undefined,
      outcome: section === 'llamadas' ? listForm.outcome : undefined,
      fileName: listForm.fileName || undefined,
      fileType: listForm.fileType || undefined,
      fileDataUrl: listForm.fileDataUrl || undefined,
    }
    await patchHistory({
      ...hist,
      [section]: [...(hist[section] ?? []), entry],
    })
  }

  function openHcSection(key: HcKey, withForm = false) {
    setExpandedHc(key)
    setAddingHc(withForm)
    setHcForm({
      title: '',
      note: '',
      status: 'pendiente',
      amount: '',
      linkSection: '',
      linkId: '',
      fileName: '',
      fileType: '',
      fileDataUrl: '',
    })
    requestAnimationFrame(() => {
      document.getElementById(`hc-section-${key}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  function jumpToLinked(section?: string, id?: string) {
    if (!section || !id) return
    if (section === 'citas') {
      setTab('citas')
      return
    }
    if ((HC_SECTIONS as readonly [string, string][]).some(([k]) => k === section)) {
      setTab('hc')
      openHcSection(section as HcKey, false)
    }
  }

  function printHc() {
    const w = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900')
    if (!w) return
    w.document.write(`<!doctype html><html><head><title>HC ${patient.fullName}</title>
      <style>body{font-family:system-ui;padding:24px;color:#0f172a} h1{font-size:1.4rem} .m{color:#64748b}</style>
      </head><body>
      <h1>Historia clínica</h1>
      <p><strong>${patient.fullName}</strong></p>
      <p class="m">${patient.documentType} ${patient.documentNumber} · ${patient.city || ''}</p>
      <p>${patient.notes || ''}</p>
      <hr/>
      ${HC_SECTIONS.map(([key, label]) => {
        const items = hist[key] ?? []
        return `<h3>${label} (${items.length})</h3><ul>${items
          .map((row) => {
            return `<li>${row.date ? new Date(row.date).toLocaleString('es-CO') : ''} — ${entryLabel(row, '')} ${row.note || ''}${row.linkLabel ? ` · Vinculo: ${row.linkLabel}` : ''}</li>`
          })
          .join('')}</ul>`
      }).join('')}
      </body></html>`)
    w.document.close()
    w.focus()
    w.print()
  }

  function renderEntry(row: HistEntry, fallback: string) {
    return (
      <li key={row.id || `${fallback}-${row.date}`}>
        <strong>
          {entryLabel(row, fallback)}
          {row.status ? ` · ${row.status}` : ''}
          {row.amount ? ` · ${formatMoney(row.amount)}` : ''}
        </strong>
        <div className="dental-muted">
          {row.date ? new Date(row.date).toLocaleString('es-CO') : ''}
        </div>
        {row.note ? <div>{row.note}</div> : null}
        {row.linkLabel ? (
          <button
            type="button"
            className="dental-link"
            onClick={() => jumpToLinked(row.linkSection, row.linkId)}
          >
            Vínculo: {row.linkLabel}
          </button>
        ) : null}
        {row.fileDataUrl ? (
          <a className="dental-link" href={row.fileDataUrl} download={row.fileName || 'adjunto'}>
            Descargar {row.fileName || 'adjunto'}
          </a>
        ) : null}
      </li>
    )
  }

  function renderListTab(section: ListKey, title: string, addLabel: string) {
    const items = hist[section] ?? []
    return (
      <div className="dental-card dental-scroll-card">
        <div className="dental-hc-panel__head">
          <h3>{title}</h3>
          {items.length > 0 ? (
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() => setAddingList(true)}
            >
              {addLabel}
            </button>
          ) : null}
        </div>

        {items.length === 0 && !addingList ? (
          <EmptyState
            title="No hay registros"
            hint={`Aún no hay ${title.toLowerCase()} para este paciente.`}
            actionLabel={addLabel}
            onAction={() => setAddingList(true)}
          />
        ) : null}

        {items.length > 0 ? (
          <ul className="dental-list">{items.map((row) => renderEntry(row, title))}</ul>
        ) : null}

        {addingList ? (
          <div className="dental-hc-form">
            <div className="dental-field">
              <label>{section === 'llamadas' || section === 'alertas' ? 'Detalle' : 'Nombre'}</label>
              <input
                value={section === 'alertas' || section === 'llamadas' ? listForm.note : listForm.name}
                onChange={(e) =>
                  setListForm((f) =>
                    section === 'alertas' || section === 'llamadas'
                      ? { ...f, note: e.target.value }
                      : { ...f, name: e.target.value },
                  )
                }
                placeholder={title}
              />
            </div>
            {section === 'documentos' ? (
              <div className="dental-field">
                <label>Tipo</label>
                <input
                  value={listForm.kind}
                  onChange={(e) => setListForm((f) => ({ ...f, kind: e.target.value }))}
                  placeholder="consentimiento, rx, laboratorio…"
                />
              </div>
            ) : null}
            {section === 'ayudas' ? (
              <div className="dental-field">
                <label>Resultado</label>
                <textarea
                  rows={2}
                  value={listForm.result}
                  onChange={(e) => setListForm((f) => ({ ...f, result: e.target.value }))}
                />
              </div>
            ) : null}
            {section === 'alertas' ? (
              <div className="dental-field">
                <label>Nivel</label>
                <select
                  value={listForm.level}
                  onChange={(e) => setListForm((f) => ({ ...f, level: e.target.value }))}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            ) : null}
            {section === 'llamadas' ? (
              <div className="dental-field">
                <label>Resultado</label>
                <select
                  value={listForm.outcome}
                  onChange={(e) => setListForm((f) => ({ ...f, outcome: e.target.value }))}
                >
                  <option value="contestada">Contestada</option>
                  <option value="no_contesta">No contesta</option>
                  <option value="reprogramar">Reprogramar</option>
                </select>
              </div>
            ) : null}
            {section === 'documentos' || section === 'ayudas' ? (
              <AttachField
                fileName={listForm.fileName || undefined}
                onPick={(file) => {
                  void readFileAsDataUrl(file)
                    .then((att) => setListForm((f) => ({ ...f, ...att })))
                    .catch((err) =>
                      setError(err instanceof Error ? err.message : 'No se pudo adjuntar'),
                    )
                }}
                onClear={() =>
                  setListForm((f) => ({
                    ...f,
                    fileName: '',
                    fileType: '',
                    fileDataUrl: '',
                  }))
                }
              />
            ) : null}
            <div className="dental-form-actions">
              <button
                type="button"
                className="dental-btn dental-btn--ghost"
                onClick={() => setAddingList(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="dental-btn dental-btn--primary"
                disabled={busy}
                onClick={() => void addListEntry(section)}
              >
                Guardar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="dental-chart">
      <div className="dental-chart__toolbar">
        <button type="button" className="dental-btn dental-btn--ghost" onClick={onBack}>
          ← Volver
        </button>
        <div className="dental-chart__title">
          <h1>{patient.fullName}</h1>
          <p className="dental-muted">
            {patient.documentType.toUpperCase()} {patient.documentNumber}
            {patient.phone ? ` · ${patient.phone}` : ''}
          </p>
        </div>
        <div className="dental-chart__actions">
          {needsValuation(patient) ? (
            <span className="dental-badge dental-badge--warn">Valoración</span>
          ) : (
            <span className="dental-badge dental-badge--ok">Activo</span>
          )}
          {onSchedule ? (
            <button type="button" className="dental-btn dental-btn--ghost" onClick={onSchedule}>
              Agendar
            </button>
          ) : null}
          <button type="button" className="dental-btn dental-btn--ghost" onClick={onEdit}>
            Editar
          </button>
          <button type="button" className="dental-btn dental-btn--primary" onClick={printHc}>
            Imprimir HC
          </button>
        </div>
      </div>

      <div className="dental-profile-strip dental-card">
        <div className="dental-profile-strip__avatar">{initials(patient.fullName)}</div>
        <div className="dental-profile-strip__grid">
          <div>
            <span>Ocupación</span>
            <strong>{patient.occupation || '—'}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{patient.email || '—'}</strong>
          </div>
          <div>
            <span>Ciudad</span>
            <strong>{patient.city || '—'}</strong>
          </div>
          <div>
            <span>Aseguradora</span>
            <strong>{patient.insurer || '—'}</strong>
          </div>
          <div className="dental-profile-strip__notes">
            <span>Notas</span>
            <strong>{patient.notes || '—'}</strong>
          </div>
        </div>
      </div>

      <div className="dental-tabs" role="tablist" aria-label="Secciones del paciente">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => {
              setTab(t.id)
              setAddingList(false)
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <div className="dental-alert">{error}</div> : null}

      {tab === 'hc' ? (
        <section className="dental-card dental-hc-panel">
          <div className="dental-hc-panel__head">
            <h3>Historia clínica</h3>
            <span className="dental-muted">Secciones con vínculos y adjuntos</span>
          </div>
          <nav className="dental-hc-jump" aria-label="Ir a sección">
            {HC_SECTIONS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`dental-hc-jump__btn${expandedHc === key ? ' is-active' : ''}`}
                onClick={() => openHcSection(key)}
              >
                {label}
                <em>{hist[key]?.length ?? 0}</em>
              </button>
            ))}
          </nav>
          <div className="dental-hc-panel__scroll">
            {HC_SECTIONS.map(([key, label]) => {
              const items = hist[key] ?? []
              const open = expandedHc === key
              return (
                <div key={key} id={`hc-section-${key}`} className="dental-hc-block">
                  <div className="dental-hc-row">
                    <button
                      type="button"
                      className="dental-hc-row__title"
                      onClick={() => setExpandedHc(open ? null : key)}
                    >
                      <strong>
                        {label} ({items.length})
                      </strong>
                      <span className="dental-muted">{open ? 'Ocultar' : 'Ver'}</span>
                    </button>
                    <button
                      type="button"
                      className="dental-btn dental-btn--ghost"
                      disabled={busy}
                      onClick={() => openHcSection(key, true)}
                    >
                      + Nuevo
                    </button>
                  </div>
                  {open ? (
                    <div className="dental-hc-block__body">
                      {key === 'odontogramas' ? (
                        <OdontogramBlock
                          teeth={teethMap}
                          observations={patient.odontogram?.observations}
                          busy={busy}
                          onToggleTooth={(n) => void toggleTooth(n)}
                          onSaveObservations={(text) =>
                            void saveOdontogram(
                              teethMap,
                              text ? text.split('\n') : [],
                            )
                          }
                        />
                      ) : null}

                      {items.length === 0 && !addingHc && key !== 'odontogramas' ? (
                        <EmptyState
                          title="No hay registros"
                          hint={`No hay entradas en ${label.toLowerCase()}.`}
                          actionLabel={`Agregar ${label.toLowerCase()}`}
                          onAction={() => openHcSection(key, true)}
                        />
                      ) : null}

                      {key === 'odontogramas' && items.length === 0 && !addingHc ? (
                        <div className="dental-hc-odontogram-cta">
                          <p className="dental-muted">
                            Marca dientes arriba o agrega una nota de odontograma.
                          </p>
                          <button
                            type="button"
                            className="dental-btn dental-btn--ghost"
                            onClick={() => openHcSection(key, true)}
                          >
                            + Nota de odontograma
                          </button>
                        </div>
                      ) : null}

                      {items.length > 0 ? (
                        <ul className="dental-list">
                          {items.map((row) => renderEntry(row, label))}
                        </ul>
                      ) : null}

                      {addingHc && expandedHc === key ? (
                        <div className="dental-hc-form">
                          <div className="dental-field">
                            <label>Título</label>
                            <input
                              value={hcForm.title}
                              onChange={(e) =>
                                setHcForm((f) => ({ ...f, title: e.target.value }))
                              }
                              placeholder={`Nuevo ${label.toLowerCase()}`}
                            />
                          </div>
                          <div className="dental-field">
                            <label>Nota</label>
                            <textarea
                              rows={3}
                              value={hcForm.note}
                              onChange={(e) =>
                                setHcForm((f) => ({ ...f, note: e.target.value }))
                              }
                              placeholder="Detalle clínico…"
                            />
                          </div>
                          {key === 'presupuestos' || key === 'tratamientos' ? (
                            <div className="dental-grid dental-grid--2">
                              <div className="dental-field">
                                <label>Estado</label>
                                <select
                                  value={hcForm.status}
                                  onChange={(e) =>
                                    setHcForm((f) => ({ ...f, status: e.target.value }))
                                  }
                                >
                                  <option value="pendiente">Pendiente</option>
                                  <option value="en_curso">En curso</option>
                                  <option value="aprobado">Aprobado</option>
                                  <option value="completado">Completado</option>
                                </select>
                              </div>
                              {key === 'presupuestos' ? (
                                <div className="dental-field">
                                  <label>Monto</label>
                                  <input
                                    inputMode="numeric"
                                    value={hcForm.amount}
                                    onChange={(e) =>
                                      setHcForm((f) => ({ ...f, amount: e.target.value }))
                                    }
                                    placeholder="0"
                                  />
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                          <div className="dental-field">
                            <label>Vincular a</label>
                            <select
                              value={
                                hcForm.linkSection && hcForm.linkId
                                  ? `${hcForm.linkSection}::${hcForm.linkId}`
                                  : ''
                              }
                              onChange={(e) => {
                                const [linkSection, linkId] = e.target.value.split('::')
                                setHcForm((f) => ({
                                  ...f,
                                  linkSection: linkSection || '',
                                  linkId: linkId || '',
                                }))
                              }}
                            >
                              <option value="">Sin vínculo</option>
                              {linkOptions
                                .filter((o) => o.section !== key)
                                .map((o) => (
                                  <option
                                    key={`${o.section}-${o.id}`}
                                    value={`${o.section}::${o.id}`}
                                  >
                                    {o.label}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <AttachField
                            fileName={hcForm.fileName || undefined}
                            onPick={(file) => {
                              void readFileAsDataUrl(file)
                                .then((att) => setHcForm((f) => ({ ...f, ...att })))
                                .catch((err) =>
                                  setError(
                                    err instanceof Error ? err.message : 'No se pudo adjuntar',
                                  ),
                                )
                            }}
                            onClear={() =>
                              setHcForm((f) => ({
                                ...f,
                                fileName: '',
                                fileType: '',
                                fileDataUrl: '',
                              }))
                            }
                          />
                          <div className="dental-form-actions">
                            <button
                              type="button"
                              className="dental-btn dental-btn--ghost"
                              onClick={() => setAddingHc(false)}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="dental-btn dental-btn--primary"
                              disabled={busy}
                              onClick={() => void addHcEntry(key)}
                            >
                              Guardar en {label}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {tab === 'citas' ? (
        <div className="dental-card dental-scroll-card">
          <div className="dental-hc-panel__head">
            <h3>Historial de citas</h3>
            {onSchedule ? (
              <button type="button" className="dental-btn dental-btn--primary" onClick={onSchedule}>
                + Nueva cita
              </button>
            ) : null}
          </div>
          {appointments.length === 0 ? (
            onSchedule ? (
              <EmptyState
                title="No hay registros"
                hint="Este paciente aún no tiene citas."
                actionLabel="Agendar cita"
                onAction={() => onSchedule()}
              />
            ) : (
              <div className="dental-empty dental-empty--panel">
                <strong>No hay registros</strong>
                <p>Este paciente aún no tiene citas.</p>
              </div>
            )
          ) : (
            <div className="dental-table-wrap">
              <table className="dental-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Procedimiento</th>
                    <th>Estado</th>
                    <th>Costo</th>
                    <th>Cobrado</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {new Date(a.startsAt).toLocaleString('es-CO', {
                          timeZone: 'America/Bogota',
                        })}
                      </td>
                      <td>{a.procedureName || a.kind}</td>
                      <td>
                        <span className="dental-badge dental-badge--info">{a.status}</span>
                      </td>
                      <td>{formatMoney(a.estimatedCost ?? 0)}</td>
                      <td>{formatMoney(a.chargedAmount ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === 'cuenta' ? (
        <div className="dental-card dental-scroll-card">
          <div className="dental-stat-row" style={{ marginBottom: '1rem' }}>
            <div className="dental-stat">
              <strong>{formatMoney(estimated)}</strong>
              <span>Estimado citas</span>
            </div>
            <div className="dental-stat">
              <strong>{formatMoney(charged)}</strong>
              <span>Cobrado</span>
            </div>
            <div className="dental-stat">
              <strong>{formatMoney(balance)}</strong>
              <span>Saldo</span>
            </div>
          </div>
          {incomes.length === 0 ? (
            <div className="dental-empty dental-empty--panel">
              <strong>No hay registros</strong>
              <p>Sin ingresos vinculados a este paciente.</p>
            </div>
          ) : (
            <div className="dental-table-wrap">
              <table className="dental-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>#</th>
                    <th>Método</th>
                    <th>Estado</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((i) => (
                    <tr key={i.id}>
                      <td>{new Date(i.incomeDate).toLocaleDateString('es-CO')}</td>
                      <td>{i.number}</td>
                      <td>{i.paymentMethod || '—'}</td>
                      <td>
                        <span className="dental-badge dental-badge--ok">{i.status}</span>
                      </td>
                      <td>{formatMoney(i.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === 'documentos'
        ? renderListTab('documentos', 'Documentos', 'Agregar documento')
        : null}
      {tab === 'ayudas' ? renderListTab('ayudas', 'Ayudas diagnósticas', 'Agregar ayuda') : null}
      {tab === 'alertas' ? renderListTab('alertas', 'Alertas', 'Agregar alerta') : null}
      {tab === 'llamadas' ? renderListTab('llamadas', 'Llamadas', 'Registrar llamada') : null}
    </div>
  )
}
