import { apiFetch, parseJsonError } from '../api'

async function dentalJson<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(`${base}/dental${path}`, init)
  if (!res.ok) throw new Error(await parseJsonError(res))
  return (await res.json()) as T
}

export type DentalSite = { id: string; name: string; address?: string | null }

export type DentalProcedure = {
  id: string
  name: string
  category: string
  unitPrice: string | number
  durationMin: number
  active: boolean
}

export type DentalAppointment = {
  id: string
  startsAt: string
  endsAt?: string | null
  kind: string
  status: string
  room?: string | null
  notes?: string | null
  procedureId?: string | null
  procedureName?: string | null
  estimatedCost?: string | number | null
  chargedAmount?: string | number | null
  durationMin?: number
  patient?: { id: string; fullName: string } | null
  procedure?: DentalProcedure | null
  incomes?: Array<{ id: string; amount: string | number; number: number }>
}

export type DentalIncome = {
  id: string
  number: number
  incomeDate: string
  amount: string | number
  paymentMethod?: string | null
  status: string
  appointmentId?: string | null
  patient?: { id: string; fullName: string } | null
  site?: DentalSite | null
  notes?: string | null
}

export type DentalPatient = {
  id: string
  fullName: string
  documentType: string
  documentNumber: string
  birthDate?: string | null
  gender?: string | null
  bloodType?: string | null
  maritalStatus?: string | null
  occupation?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  insurer?: string | null
  coverage?: string | null
  notes?: string | null
  clinicalHistory?: Record<string, unknown> | null
  odontogram?: {
    type?: string
    teeth?: Record<string, unknown>
    observations?: string[]
  } | null
  site?: DentalSite | null
  createdAt?: string
  appointments?: DentalAppointment[]
  incomes?: DentalIncome[]
}

export type DentalBudget = {
  id: string
  title: string
  status: string
  subtotal: string | number
  total: string | number
  patient?: { id: string; fullName: string } | null
  lines?: unknown
}

export type DentalFinancing = {
  id: string
  amount: string | number
  initialPayment: string | number
  installments: number
  installmentValue: string | number
  status: string
  patient?: { id: string; fullName: string } | null
  budget?: { id: string; title: string; total: string | number } | null
}

export type DentalExpense = {
  id: string
  expenseDate: string
  concept: string
  provider?: string | null
  expenseType?: string | null
  amount: string | number
  status: string
  site?: DentalSite | null
}

export type DentalOverview = {
  patientsCount: number
  upcomingAppointments: number
  cancelledYear: number
  indicators: { attended: number; notAttended: number; cancelled: number }
  incomesCount: number
  expensesCount: number
  sites: DentalSite[]
  recentPatients: DentalPatient[]
  nextAppointments: DentalAppointment[]
}

export const dentalApi = {
  overview: (base: string) => dentalJson<DentalOverview>(base, '/overview'),
  sites: (base: string) => dentalJson<DentalSite[]>(base, '/sites'),
  patients: (base: string, q?: string) =>
    dentalJson<DentalPatient[]>(base, `/patients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  patient: (base: string, id: string) => dentalJson<DentalPatient>(base, `/patients/${id}`),
  createPatient: (base: string, body: Record<string, string>) =>
    dentalJson<DentalPatient>(base, '/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  updatePatient: (base: string, id: string, body: Record<string, unknown>) =>
    dentalJson<DentalPatient>(base, `/patients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  deletePatient: (base: string, id: string) =>
    dentalJson<{ ok: boolean }>(base, `/patients/${id}`, { method: 'DELETE' }),
  appointments: (base: string, date?: string) =>
    dentalJson<DentalAppointment[]>(
      base,
      `/appointments${date ? `?date=${encodeURIComponent(date)}` : ''}`,
    ),
  createAppointment: (base: string, body: Record<string, unknown>) =>
    dentalJson<DentalAppointment>(base, '/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  updateAppointment: (base: string, id: string, body: Record<string, unknown>) =>
    dentalJson<DentalAppointment>(base, `/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  deleteAppointment: (base: string, id: string) =>
    dentalJson<{ ok: boolean }>(base, `/appointments/${id}`, { method: 'DELETE' }),
  chargeAppointment: (base: string, id: string, body: Record<string, unknown>) =>
    dentalJson<DentalIncome>(base, `/appointments/${id}/charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  incomes: (base: string, q?: string) =>
    dentalJson<DentalIncome[]>(base, `/incomes${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  createIncome: (base: string, body: Record<string, unknown>) =>
    dentalJson<DentalIncome>(base, '/incomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  deleteIncome: (base: string, id: string) =>
    dentalJson<{ ok: boolean }>(base, `/incomes/${id}`, { method: 'DELETE' }),
  expenses: (base: string, q?: string) =>
    dentalJson<DentalExpense[]>(base, `/expenses${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  createExpense: (base: string, body: Record<string, unknown>) =>
    dentalJson<DentalExpense>(base, '/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  deleteExpense: (base: string, id: string) =>
    dentalJson<{ ok: boolean }>(base, `/expenses/${id}`, { method: 'DELETE' }),
  sterilizations: (base: string) => dentalJson<unknown[]>(base, '/sterilizations'),
  createSterilization: (base: string, body: Record<string, string>) =>
    dentalJson(base, '/sterilizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  wastes: (base: string, q?: string) =>
    dentalJson<unknown[]>(base, `/wastes${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  createWaste: (base: string, body: Record<string, unknown>) =>
    dentalJson(base, '/wastes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  tempLogs: (base: string, year: number, month: number, siteId?: string) => {
    const q = new URLSearchParams({ year: String(year), month: String(month) })
    if (siteId) q.set('siteId', siteId)
    return dentalJson<unknown[]>(base, `/temp-humidity?${q}`)
  },
  createTempLog: (base: string, body: Record<string, unknown>) =>
    dentalJson(base, '/temp-humidity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  procedures: (base: string) => dentalJson<DentalProcedure[]>(base, '/procedures'),
  ensureProcedures: (base: string) =>
    dentalJson<DentalProcedure[]>(base, '/procedures/ensure-defaults', { method: 'POST' }),
  createProcedure: (base: string, body: Record<string, unknown>) =>
    dentalJson<DentalProcedure>(base, '/procedures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  budgets: (base: string, patientId?: string) =>
    dentalJson<DentalBudget[]>(
      base,
      `/budgets${patientId ? `?patientId=${encodeURIComponent(patientId)}` : ''}`,
    ),
  createBudget: (base: string, body: Record<string, unknown>) =>
    dentalJson<DentalBudget>(base, '/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  approveBudget: (base: string, id: string) =>
    dentalJson(base, `/budgets/${id}/approve`, { method: 'POST' }),
  financings: (base: string) => dentalJson<DentalFinancing[]>(base, '/financings'),
  createFinancing: (base: string, body: Record<string, unknown>) =>
    dentalJson<DentalFinancing>(base, '/financings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  updateFinancingStatus: (base: string, id: string, status: string) =>
    dentalJson(base, `/financings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),
  costsSummary: (base: string) =>
    dentalJson<{
      incomeTotal: number
      expenseTotal: number
      net: number
      estimatedPipeline: number
      chargedTotal: number
      pendingBudgets: number
      financingsByStatus: {
        en_tramite: number
        pendiente_desembolso: number
        desembolsado: number
      }
      financingAmounts: {
        en_tramite: number
        pendiente_desembolso: number
        desembolsado: number
      }
    }>(base, '/costs-summary'),
}
