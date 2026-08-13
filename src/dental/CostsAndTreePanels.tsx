import { useCallback, useEffect, useState } from 'react'
import {
  dentalApi,
  type DentalBudget,
  type DentalFinancing,
  type DentalPatient,
  type DentalProcedure,
} from './dentalApi'
import { formatMoney } from './dentalNav'

type CostsSummary = Awaited<ReturnType<typeof dentalApi.costsSummary>>

type Props = {
  baseUrl: string
  patients: DentalPatient[]
  mode: 'financing' | 'config' | 'reports'
  onNavigate?: (view: 'ingresos' | 'gastos' | 'agenda' | 'inventory' | 'patients' | 'bio-waste' | 'analytics') => void
  onNotify?: (message: string, type?: 'ok' | 'error' | 'info') => void
  onLoading?: (v: boolean) => void
}

export function CostsAndTreePanels({
  baseUrl,
  patients,
  mode,
  onNavigate,
  onNotify,
  onLoading,
}: Props) {
  const [summary, setSummary] = useState<CostsSummary | null>(null)
  const [financings, setFinancings] = useState<DentalFinancing[]>([])
  const [budgets, setBudgets] = useState<DentalBudget[]>([])
  const [procedures, setProcedures] = useState<DentalProcedure[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    patientId: '',
    amount: '',
    initialPayment: '0',
    installments: '3',
    notes: '',
  })
  const [procForm, setProcForm] = useState({
    name: '',
    category: 'general',
    unitPrice: '',
    durationMin: '30',
  })
  const [budgetForm, setBudgetForm] = useState({
    patientId: '',
    title: 'Plan de tratamiento',
    procedureId: '',
    quantity: '1',
  })

  const load = useCallback(async () => {
    setError(null)
    onLoading?.(true)
    try {
      const [s, f, b, p] = await Promise.all([
        dentalApi.costsSummary(baseUrl),
        dentalApi.financings(baseUrl),
        dentalApi.budgets(baseUrl),
        dentalApi.ensureProcedures(baseUrl),
      ])
      setSummary(s)
      setFinancings(f)
      setBudgets(b)
      setProcedures(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      onLoading?.(false)
    }
  }, [baseUrl, onLoading])

  useEffect(() => {
    void load()
  }, [load])

  if (mode === 'financing') {
    return (
      <>
        <div className="dental-page__head">
          <div>
            <h1>Financiamiento</h1>
            <p>Solicitudes vinculadas a presupuestos y costos de tratamiento.</p>
          </div>
          <button
            type="button"
            className="dental-btn dental-btn--primary"
            onClick={async () => {
              try {
                await dentalApi.createFinancing(baseUrl, {
                  patientId: form.patientId || patients[0]?.id,
                  amount: Number(form.amount || 0),
                  initialPayment: Number(form.initialPayment || 0),
                  installments: Number(form.installments || 0),
                  notes: form.notes || undefined,
                  status: 'en_tramite',
                })
                setForm({ patientId: '', amount: '', initialPayment: '0', installments: '3', notes: '' })
                await load()
                onNotify?.('Solicitud de financiamiento creada')
              } catch (err) {
                setError(err instanceof Error ? err.message : 'No se pudo crear')
                onNotify?.(err instanceof Error ? err.message : 'No se pudo crear', 'error')
              }
            }}
          >
            + Nueva solicitud
          </button>
        </div>
        {error ? <div className="dental-alert">{error}</div> : null}
        <div className="dental-grid dental-grid--2" style={{ marginBottom: '1rem' }}>
          {[
            ['En trámite', summary?.financingsByStatus.en_tramite ?? 0, summary?.financingAmounts.en_tramite ?? 0],
            ['Pendiente desembolso', summary?.financingsByStatus.pendiente_desembolso ?? 0, summary?.financingAmounts.pendiente_desembolso ?? 0],
            ['Desembolsado', summary?.financingsByStatus.desembolsado ?? 0, summary?.financingAmounts.desembolsado ?? 0],
          ].map(([label, count, amount]) => (
            <div key={String(label)} className="dental-card dental-stat">
              <span>{label}</span>
              <strong>
                {count} / {formatMoney(amount as number)}
              </strong>
            </div>
          ))}
        </div>
        <div className="dental-card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Crear financiamiento</h3>
          <div className="dental-filters" style={{ background: 'transparent', padding: 0 }}>
            <div className="dental-field">
              <label>Paciente</label>
              <select
                value={form.patientId}
                onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
              >
                <option value="">Seleccionar</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="dental-field">
              <label>Monto</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="dental-field">
              <label>Cuota inicial</label>
              <input
                type="number"
                value={form.initialPayment}
                onChange={(e) => setForm((f) => ({ ...f, initialPayment: e.target.value }))}
              />
            </div>
            <div className="dental-field">
              <label>Nº cuotas</label>
              <input
                type="number"
                value={form.installments}
                onChange={(e) => setForm((f) => ({ ...f, installments: e.target.value }))}
              />
            </div>
          </div>
        </div>
        {financings.length === 0 ? (
          <div className="dental-card dental-empty">
            <strong>Sin solicitudes</strong>
            <p>0 solicitudes requieren gestión comercial.</p>
          </div>
        ) : (
          <div className="dental-card dental-table-wrap">
            <table className="dental-table">
              <thead>
                <tr>
                  <th>PACIENTE</th>
                  <th>MONTO</th>
                  <th>INICIAL</th>
                  <th>CUOTAS</th>
                  <th>ESTADO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {financings.map((f) => (
                  <tr key={f.id}>
                    <td>{f.patient?.fullName ?? '—'}</td>
                    <td>{formatMoney(f.amount)}</td>
                    <td>{formatMoney(f.initialPayment)}</td>
                    <td>
                      {f.installments} × {formatMoney(f.installmentValue)}
                    </td>
                    <td>
                      <span className="dental-badge dental-badge--info">{f.status}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="dental-btn dental-btn--ghost"
                        onClick={() =>
                          void dentalApi
                            .updateFinancingStatus(baseUrl, f.id, 'desembolsado')
                            .then(load)
                        }
                      >
                        Desembolsar
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

  if (mode === 'reports') {
    const groups = [
      {
        title: 'Financieros',
        items: [
          ['Ingresos', 'ingresos'],
          ['Gastos', 'gastos'],
          ['Cuadre de caja', 'analytics'],
          ['Cartera / financiamiento', 'ingresos'],
        ] as const,
      },
      {
        title: 'Operativos',
        items: [
          ['Citas', 'agenda'],
          ['Pacientes', 'patients'],
          ['Residuos', 'bio-waste'],
        ] as const,
      },
      {
        title: 'Inventarios',
        items: [['Inventarios', 'inventory']] as const,
      },
      {
        title: 'Costos vivos',
        items: [] as const,
      },
    ]
    return (
      <>
        <div className="dental-page__head">
          <div>
            <h1>Centro de reportes</h1>
            <p>Resumen operativo y financiero del consultorio.</p>
          </div>
        </div>
        <div className="dental-grid dental-grid--2" style={{ marginBottom: '1rem' }}>
          <div className="dental-card dental-stat">
            <span>Ingresos</span>
            <strong>{formatMoney(summary?.incomeTotal ?? 0)}</strong>
          </div>
          <div className="dental-card dental-stat">
            <span>Gastos</span>
            <strong>{formatMoney(summary?.expenseTotal ?? 0)}</strong>
          </div>
          <div className="dental-card dental-stat">
            <span>Utilidad</span>
            <strong>{formatMoney(summary?.net ?? 0)}</strong>
          </div>
          <div className="dental-card dental-stat">
            <span>Pipeline citas (estimado)</span>
            <strong>{formatMoney(summary?.estimatedPipeline ?? 0)}</strong>
          </div>
        </div>
        <div className="dental-report-grid">
          {groups.slice(0, 3).map((g) => (
            <div key={g.title} className="dental-card dental-report-card">
              <h3>{g.title}</h3>
              {g.items.map(([label, target]) => (
                <button key={label} type="button" onClick={() => onNavigate?.(target)}>
                  {label}
                </button>
              ))}
            </div>
          ))}
          <div className="dental-card dental-report-card">
            <h3>Presupuestos</h3>
            <p style={{ color: 'var(--dental-muted)' }}>
              Pendientes: {summary?.pendingBudgets ?? 0} · Total presupuestos:{' '}
              {budgets.length}
            </p>
            {budgets.slice(0, 5).map((b) => (
              <button key={b.id} type="button" onClick={() => onNavigate?.('patients')}>
                {b.title} · {b.patient?.fullName} · {formatMoney(b.total)} ({b.status})
              </button>
            ))}
          </div>
        </div>
      </>
    )
  }

  // config
  return (
    <>
      <div className="dental-page__head">
        <div>
          <h1>Centro de configuración</h1>
          <p>Procedimientos, precios y presupuestos del consultorio.</p>
        </div>
      </div>
      {error ? <div className="dental-alert">{error}</div> : null}
      <div className="dental-report-grid">
        <div className="dental-card">
          <h3 style={{ marginTop: 0 }}>Procedimientos y precios</h3>
          <div className="dental-grid" style={{ gap: '0.6rem', marginBottom: '0.75rem' }}>
            <div className="dental-field">
              <label>Nombre</label>
              <input
                value={procForm.name}
                onChange={(e) => setProcForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="dental-field">
              <label>Categoría</label>
              <input
                value={procForm.category}
                onChange={(e) => setProcForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="dental-field">
              <label>Precio</label>
              <input
                type="number"
                value={procForm.unitPrice}
                onChange={(e) => setProcForm((f) => ({ ...f, unitPrice: e.target.value }))}
              />
            </div>
            <div className="dental-field">
              <label>Duración (min)</label>
              <input
                type="number"
                value={procForm.durationMin}
                onChange={(e) => setProcForm((f) => ({ ...f, durationMin: e.target.value }))}
              />
            </div>
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={() =>
                void dentalApi
                  .createProcedure(baseUrl, {
                    name: procForm.name,
                    category: procForm.category,
                    unitPrice: Number(procForm.unitPrice || 0),
                    durationMin: Number(procForm.durationMin || 30),
                  })
                  .then(async () => {
                    setProcForm({ name: '', category: 'general', unitPrice: '', durationMin: '30' })
                    await load()
                  })
              }
            >
              Agregar procedimiento
            </button>
          </div>
          <ul>
            {procedures.map((p) => (
              <li key={p.id}>
                {p.name} · {formatMoney(p.unitPrice)} · {p.durationMin} min
              </li>
            ))}
          </ul>
        </div>

        <div className="dental-card">
          <h3 style={{ marginTop: 0 }}>Presupuesto rápido</h3>
          <div className="dental-grid" style={{ gap: '0.6rem' }}>
            <div className="dental-field">
              <label>Paciente</label>
              <select
                value={budgetForm.patientId}
                onChange={(e) => setBudgetForm((f) => ({ ...f, patientId: e.target.value }))}
              >
                <option value="">Seleccionar</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="dental-field">
              <label>Título</label>
              <input
                value={budgetForm.title}
                onChange={(e) => setBudgetForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="dental-field">
              <label>Procedimiento</label>
              <select
                value={budgetForm.procedureId}
                onChange={(e) => setBudgetForm((f) => ({ ...f, procedureId: e.target.value }))}
              >
                <option value="">Seleccionar</option>
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {formatMoney(p.unitPrice)}
                  </option>
                ))}
              </select>
            </div>
            <div className="dental-field">
              <label>Cantidad</label>
              <input
                type="number"
                value={budgetForm.quantity}
                onChange={(e) => setBudgetForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <button
              type="button"
              className="dental-btn dental-btn--primary"
              onClick={async () => {
                const proc = procedures.find((p) => p.id === budgetForm.procedureId)
                if (!budgetForm.patientId || !proc) {
                  setError('Selecciona paciente y procedimiento')
                  return
                }
                try {
                  await dentalApi.createBudget(baseUrl, {
                    patientId: budgetForm.patientId,
                    title: budgetForm.title,
                    lines: [
                      {
                        name: proc.name,
                        quantity: Number(budgetForm.quantity || 1),
                        unitPrice: Number(proc.unitPrice),
                      },
                    ],
                  })
                  await load()
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Error')
                }
              }}
            >
              Crear presupuesto
            </button>
          </div>
          <ul style={{ marginTop: '1rem' }}>
            {budgets.map((b) => (
              <li key={b.id}>
                {b.title} · {b.patient?.fullName} · {formatMoney(b.total)} · {b.status}{' '}
                {b.status === 'Pendiente' ? (
                  <button
                    type="button"
                    className="dental-link"
                    onClick={() => void dentalApi.approveBudget(baseUrl, b.id).then(load)}
                  >
                    Aprobar
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
