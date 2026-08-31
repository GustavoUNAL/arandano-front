import { useCallback, useEffect, useState } from 'react'
import {
  deletePlatformUser,
  enterPlatformCompany,
  fetchPlatformAccessRequests,
  fetchPlatformCompanies,
  fetchPlatformCompanyDetail,
  fetchPlatformOverview,
  fetchPlatformUserDetail,
  fetchPlatformUsers,
  patchPlatformCompanyModule,
  patchPlatformCompanyPlan,
  patchPlatformUser,
  type AuthUser,
  type PlatformCompanyDetail,
  type PlatformCompanyRow,
  type PlatformModuleToggle,
  type PlatformOverview,
  type PlatformUserDetail,
  type PlatformUserRow,
  type AccessRequestRow,
} from '../api'
import { BRAND_NAME } from '../lib/brand'
import { companyPlanLabel, type CompanyPlanId } from '../lib/plans'
import { buildCompanyViewHash, type AppView } from '../lib/companyRoutes'
import { navigateToLogin } from '../lib/authRoutes'
import { setAccessToken } from '../api'
import { BrandMark } from './BrandMark'
import { PublicThemeSwitch } from './PublicThemeSwitch'
import { Button } from './ui/button'
import { usePublicTheme } from '../hooks/usePublicTheme'
import '../public-shell.css'
import { ViewBootSplash } from './DataLoadingSplash'
import '../platform-admin.css'

type Tab = 'overview' | 'companies' | 'users' | 'requests'

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = n
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${value < 10 && i > 0 ? value.toFixed(1) : Math.round(value)} ${units[i]}`
}

function formatWhen(iso?: string | null): string {
  if (!iso) return 'Sin actividad'
  return new Date(iso).toLocaleString('es-CO')
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

function taskKindLabel(kind: PlatformUserDetail['recentTasks'][number]['kind']): string {
  if (kind === 'assigned') return 'Asignada'
  if (kind === 'created_assigned') return 'Creó y tiene asignada'
  return 'Creó'
}

function auditLabel(action: string, tableName: string): string {
  return `${action} · ${tableName}`
}

function isUnlimitedPlan(plan?: string | null): boolean {
  return plan === 'PRO' || plan === 'BUSINESS'
}

function StorageBar({
  used,
  limit,
  unlimited,
}: {
  used: number
  limit: number
  unlimited?: boolean
}) {
  if (unlimited || limit <= 0) {
    return (
      <div className="platform-admin__storage">
        <div className="platform-admin__storage-meta">
          <span>{formatBytes(used)} usados</span>
          <span>Sin tope</span>
        </div>
        <div className="platform-admin__storage-track platform-admin__storage-track--free">
          <span style={{ width: '14%' }} />
        </div>
      </div>
    )
  }
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const left = Math.max(0, limit - used)
  const tone = pct >= 90 ? 'is-full' : pct >= 70 ? 'is-warn' : ''
  return (
    <div className="platform-admin__storage">
      <div className="platform-admin__storage-meta">
        <span>
          {formatBytes(used)} de {formatBytes(limit)}
        </span>
        <span>Quedan {formatBytes(left)}</span>
      </div>
      <div className="platform-admin__storage-track">
        <span className={tone} style={{ width: `${Math.max(pct, 3)}%` }} />
      </div>
    </div>
  )
}

function ModuleToggles({
  modules,
  busy,
  onToggle,
}: {
  modules: PlatformModuleToggle[]
  busy: boolean
  onToggle: (slug: string, enabled: boolean) => void
}) {
  const core = modules.filter((m) => m.core)
  const extra = modules.filter((m) => !m.core)
  return (
    <div className="platform-admin__mods">
      <p className="platform-admin__mods-label">Principales</p>
      <div className="platform-admin__mod-toggles">
        {core.map((m) => (
          <label
            key={m.slug}
            className={`platform-admin__mod-toggle${m.enabled ? ' is-on' : ''}${m.slug === 'booking' ? ' is-booking' : ''}`}
          >
            <input
              type="checkbox"
              checked={m.enabled}
              disabled={busy}
              onChange={() => onToggle(m.slug, !m.enabled)}
            />
            {m.name}
          </label>
        ))}
      </div>
      {extra.length ? (
        <>
          <p className="platform-admin__mods-label">Más módulos</p>
          <div className="platform-admin__mod-toggles">
            {extra.map((m) => (
              <label key={m.slug} className={`platform-admin__mod-toggle${m.enabled ? ' is-on' : ''}`}>
                <input
                  type="checkbox"
                  checked={m.enabled}
                  disabled={busy}
                  onChange={() => onToggle(m.slug, !m.enabled)}
                />
                {m.name}
              </label>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

const EXTRA_MODULE_VIEWS: Array<{ view: AppView; label: string }> = [
  { view: 'home', label: 'Inicio' },
  { view: 'pos', label: 'Punto de venta' },
  { view: 'shop', label: 'Tienda online' },
]

const MODULE_VIEW: Record<string, AppView> = {
  products: 'products',
  inventory: 'inventory',
  sales: 'sales',
  purchases: 'purchases',
  staff: 'staff',
  finance: 'analytics',
  booking: 'booking',
  tasks: 'tasks',
  projects: 'projects',
}

type Props = {
  baseUrl: string
  user: AuthUser
  onEnterCompany: (user: AuthUser, view: AppView) => void
  onLogout: () => void
}

export function PlatformAdminView({ baseUrl, user, onEnterCompany, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<PlatformOverview | null>(null)
  const [companies, setCompanies] = useState<PlatformCompanyRow[]>([])
  const [users, setUsers] = useState<PlatformUserRow[]>([])
  const [requests, setRequests] = useState<AccessRequestRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<PlatformCompanyDetail | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userDetail, setUserDetail] = useState<PlatformUserDetail | null>(null)
  const [userBusy, setUserBusy] = useState(false)
  const [moduleBusy, setModuleBusy] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [entering, setEntering] = useState(false)
  const [userQuery, setUserQuery] = useState('')
  const [planBusyId, setPlanBusyId] = useState<string | null>(null)
  const { theme, toggleTheme } = usePublicTheme()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ov, co, us, req] = await Promise.all([
        fetchPlatformOverview(baseUrl),
        fetchPlatformCompanies(baseUrl),
        fetchPlatformUsers(baseUrl),
        fetchPlatformAccessRequests(baseUrl, 'PENDING'),
      ])
      setOverview(ov)
      setCompanies(co)
      setUsers(us)
      setRequests(req)
      setSelectedId((prev) => prev ?? co[0]?.id ?? null)
      setSelectedUserId((prev) => prev ?? us[0]?.id ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el panel')
    } finally {
      setLoading(false)
    }
  }, [baseUrl])

  useEffect(() => {
    document.title = `Admin · ${BRAND_NAME}`
    void load()
  }, [load])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    let cancelled = false
    fetchPlatformCompanyDetail(baseUrl, selectedId)
      .then((d) => {
        if (!cancelled) setDetail(d)
      })
      .catch(() => {
        if (!cancelled) setDetail(null)
      })
    return () => {
      cancelled = true
    }
  }, [baseUrl, selectedId])

  useEffect(() => {
    if (!selectedUserId) {
      setUserDetail(null)
      return
    }
    let cancelled = false
    fetchPlatformUserDetail(baseUrl, selectedUserId)
      .then((d) => {
        if (!cancelled) {
          setUserDetail(d)
          setEditName(d.name)
          setEditEmail(d.email)
        }
      })
      .catch(() => {
        if (!cancelled) setUserDetail(null)
      })
    return () => {
      cancelled = true
    }
  }, [baseUrl, selectedUserId])

  async function openModule(view: AppView) {
    if (!detail || entering) return
    setEntering(true)
    setError(null)
    try {
      const res = await enterPlatformCompany(baseUrl, detail.id)
      onEnterCompany(res.user, view)
      window.location.hash = buildCompanyViewHash(detail.slug, view)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la empresa')
    } finally {
      setEntering(false)
    }
  }

  async function setCompanyPlan(companyId: string, plan: CompanyPlanId) {
    setPlanBusyId(companyId)
    setError(null)
    try {
      await patchPlatformCompanyPlan(baseUrl, companyId, plan)
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, plan } : c)),
      )
      setUsers((prev) =>
        prev.map((u) => ({
          ...u,
          companies: u.companies.map((c) => (c.id === companyId ? { ...c, plan } : c)),
        })),
      )
      setOverview((ov) =>
        ov
          ? {
              ...ov,
              companyStats: ov.companyStats?.map((c) =>
                c.id === companyId ? { ...c, plan } : c,
              ),
            }
          : ov,
      )
      setDetail((d) => (d && d.id === companyId ? { ...d, plan } : d))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el plan')
    } finally {
      setPlanBusyId(null)
    }
  }

  async function saveUser() {
    if (!userDetail) return
    setUserBusy(true)
    setError(null)
    try {
      const updated = await patchPlatformUser(baseUrl, userDetail.id, {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
      })
      setUserDetail(updated)
      setEditName(updated.name)
      setEditEmail(updated.email)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === updated.id
            ? {
                ...u,
                name: updated.name,
                email: updated.email,
                active: updated.active,
              }
            : u,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el usuario')
    } finally {
      setUserBusy(false)
    }
  }

  async function setUserActive(userId: string, active: boolean) {
    setUserBusy(true)
    setError(null)
    try {
      const updated = await patchPlatformUser(baseUrl, userId, { active })
      setUserDetail(updated)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                active: updated.active,
                lastLoginAt: updated.lastLoginAt,
                lastActivityAt: updated.lastActivityAt,
                storageUsedBytes: updated.storageUsedBytes,
              }
            : u,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el usuario')
    } finally {
      setUserBusy(false)
    }
  }

  async function removeUser(userId: string) {
    if (
      !window.confirm(
        '¿Eliminar esta cuenta? Se quita el acceso. Las empresas y sus datos siguen en la plataforma.',
      )
    ) {
      return
    }
    setUserBusy(true)
    setError(null)
    try {
      await deletePlatformUser(baseUrl, userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setSelectedUserId((prev) => (prev === userId ? null : prev))
      setUserDetail(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario')
    } finally {
      setUserBusy(false)
    }
  }

  async function toggleCompanyModule(companyId: string, slug: string, enabled: boolean) {
    setModuleBusy(true)
    setError(null)
    try {
      const res = await patchPlatformCompanyModule(baseUrl, companyId, slug, enabled)
      setUserDetail((prev) =>
        prev
          ? {
              ...prev,
              companies: prev.companies.map((c) =>
                c.id === companyId ? { ...c, modules: res.modules } : c,
              ),
            }
          : prev,
      )
      setDetail((d) =>
        d && d.id === companyId
          ? {
              ...d,
              allModules: res.modules,
              modules: res.modules.filter((m) => m.enabled).map((m) => ({ slug: m.slug, name: m.name })),
            }
          : d,
      )
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === companyId
            ? {
                ...c,
                modules: res.modules
                  .filter((m) => m.enabled)
                  .map((m) => ({ slug: m.slug, name: m.name })),
              }
            : c,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el módulo')
    } finally {
      setModuleBusy(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = userQuery.trim().toLowerCase()
    if (!q) return true
    const hay = [
      u.name,
      u.email,
      u.isPlatformAdmin ? 'admin plataforma' : '',
      ...u.companies.map((c) => `${c.name} ${c.slug} ${c.plan ?? ''}`),
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })

  function handleLogout() {
    setAccessToken(null)
    onLogout()
    navigateToLogin()
  }

  return (
    <div className="platform-admin">
      <header className="platform-admin__topbar">
        <BrandMark size="sm" />
        <div className="platform-admin__topbar-meta">
          <span className="platform-admin__badge">Administrador de plataforma</span>
          <span>{user.name}</span>
          <span className="platform-admin__email">{user.email}</span>
        </div>
        <PublicThemeSwitch theme={theme} onToggle={toggleTheme} compact />
        <Button type="button" variant="secondary" size="sm" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </header>

      <nav className="platform-admin__tabs" aria-label="Secciones del panel">
        {(
          [
            ['overview', 'Resumen'],
            ['companies', 'Empresas'],
            ['users', 'Usuarios'],
            ['requests', 'Solicitudes'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`platform-admin__tab${tab === id ? ' platform-admin__tab--active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
            {id === 'users' ? ` (${users.length})` : ''}
            {id === 'requests' && overview?.pendingRequests
              ? ` (${overview.pendingRequests})`
              : ''}
          </button>
        ))}
      </nav>

      {error ? (
        <div className="platform-admin__error" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="platform-admin__loading">Cargando panel…</p>
      ) : (
        <div className="platform-admin__body">
          {tab === 'overview' && overview ? (
            <section className="platform-admin__panel">
              <h1>Resumen de la plataforma</h1>
              <div className="platform-admin__stats">
                <article className="platform-admin__stat">
                  <strong>{overview.companiesCount}</strong>
                  <span>Empresas</span>
                </article>
                <article className="platform-admin__stat">
                  <strong>{overview.activeCompanies}</strong>
                  <span>Activas</span>
                </article>
                <article className="platform-admin__stat">
                  <strong>{overview.usersCount}</strong>
                  <span>Usuarios</span>
                </article>
                <article className="platform-admin__stat">
                  <strong>{overview.pendingRequests}</strong>
                  <span>Solicitudes pendientes</span>
                </article>
              </div>

              {overview.companyStats && overview.companyStats.length > 0 ? (
                <>
                  <h2>Actividad por empresa</h2>
                  <div className="platform-admin__table-wrap">
                    <table className="platform-admin__table">
                      <thead>
                        <tr>
                          <th>Empresa</th>
                          <th>Plan</th>
                          <th>Usuarios</th>
                          <th>Productos</th>
                          <th>Ventas</th>
                          <th>Inventario</th>
                          <th>Módulos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.companyStats.map((c) => (
                          <tr key={c.id}>
                            <td>{c.name}</td>
                            <td>{companyPlanLabel(c.plan)}</td>
                            <td>{c.membersCount}</td>
                            <td>{c.productsCount}</td>
                            <td>{c.salesCount}</td>
                            <td>{c.inventoryCount}</td>
                            <td>{c.modules.join(', ') || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}

              {overview.recentUsers && overview.recentUsers.length > 0 ? (
                <>
                  <h2>Usuarios recientes</h2>
                  <div className="platform-admin__table-wrap">
                    <table className="platform-admin__table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Email</th>
                          <th>Empresas</th>
                          <th>Alta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.recentUsers.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <button
                                type="button"
                                className="platform-admin__link-btn"
                                onClick={() => {
                                  setSelectedUserId(u.id)
                                  setTab('users')
                                }}
                              >
                                {u.name}
                                {u.isPlatformAdmin ? ' · Admin' : ''}
                              </button>
                            </td>
                            <td>{u.email}</td>
                            <td>
                              {u.companies.length > 0
                                ? u.companies
                                    .map((c) => `${c.name} (${c.role})`)
                                    .join(', ')
                                : '—'}
                            </td>
                            <td>{new Date(u.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}

              {overview.recentRequests.length > 0 ? (
                <>
                  <h2>Solicitudes recientes</h2>
                  <div className="platform-admin__table-wrap">
                    <table className="platform-admin__table">
                      <thead>
                        <tr>
                          <th>Empresa</th>
                          <th>Contacto</th>
                          <th>Email</th>
                          <th>Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.recentRequests.map((r) => (
                          <tr key={r.id}>
                            <td>{r.companyName}</td>
                            <td>{r.contactName}</td>
                            <td>{r.email}</td>
                            <td>{new Date(r.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </section>
          ) : null}

          {tab === 'companies' ? (
            <section className="platform-admin__split">
              <div className="platform-admin__list">
                <h1>Empresas</h1>
                <ul className="platform-admin__company-list">
                  {companies.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`platform-admin__company-btn${
                          selectedId === c.id ? ' platform-admin__company-btn--active' : ''
                        }`}
                        onClick={() => setSelectedId(c.id)}
                      >
                        <strong>{c.name}</strong>
                        <span>
                          /{c.slug} · {companyPlanLabel(c.plan)}
                        </span>
                        <small>
                          {c.productsCount} prod · {c.salesCount} ventas · {c.membersCount} usuarios
                        </small>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="platform-admin__detail">
                {detail ? (
                  <>
                    <header className="platform-admin__detail-head">
                      <div>
                        <h2>{detail.name}</h2>
                        <p>
                          Plan {companyPlanLabel(detail.plan)} · Tenant{' '}
                          <code>#/e/{detail.slug}/…</code>
                          {detail.shopSlug ? (
                            <>
                              {' '}
                              · Tienda <code>#/tienda/{detail.shopSlug}</code>
                            </>
                          ) : null}
                        </p>
                      </div>
                      <div className="platform-admin__detail-actions">
                        <Button
                          type="button"
                          disabled={entering}
                          onClick={() => openModule('home')}
                        >
                          Abrir panel completo
                        </Button>
                        <label className="platform-admin__plan-select">
                          <span className="sr-only">Plan</span>
                          <select
                            value={detail.plan === 'BUSINESS' || detail.plan === 'PRO' ? detail.plan : 'TRIAL'}
                            disabled={planBusyId === detail.id}
                            onChange={(e) =>
                              void setCompanyPlan(detail.id, e.target.value as CompanyPlanId)
                            }
                          >
                            <option value="TRIAL">Free</option>
                            <option value="PRO">Pro</option>
                            <option value="BUSINESS">Empresa</option>
                          </select>
                        </label>
                      </div>
                    </header>

                    <div className="platform-admin__counts">
                      <span>{detail.counts.products} productos</span>
                      <span>{detail.counts.inventoryItems} inventario</span>
                      <span>{detail.counts.sales} ventas</span>
                      <span>{detail.counts.purchaseLots} compras</span>
                      <span>{detail.counts.staffMembers} personal</span>
                      <span>{detail.counts.shopOrders} pedidos web</span>
                    </div>

                    <h3>Módulos de la empresa</h3>
                    <p className="platform-admin__hint">
                      Activá lo que el negocio necesita. Los tres principales son Ventas, Inventario y
                      Agenda de citas.
                    </p>
                    <ModuleToggles
                      modules={detail.allModules ?? []}
                      busy={moduleBusy}
                      onToggle={(slug, enabled) => void toggleCompanyModule(detail.id, slug, enabled)}
                    />

                    <h3>Abrir módulos</h3>
                    <div className="platform-admin__modules">
                      {detail.modules.map((m) => {
                        const view = MODULE_VIEW[m.slug]
                        if (!view) return null
                        return (
                          <button
                            key={m.slug}
                            type="button"
                            className="platform-admin__module"
                            disabled={entering}
                            onClick={() => openModule(view)}
                          >
                            <strong>{m.name}</strong>
                            <span>Abrir {view}</span>
                          </button>
                        )
                      })}
                      {EXTRA_MODULE_VIEWS.map((m) => (
                        <button
                          key={m.view}
                          type="button"
                          className="platform-admin__module platform-admin__module--extra"
                          disabled={entering}
                          onClick={() => openModule(m.view)}
                        >
                          <strong>{m.label}</strong>
                          <span>Abrir módulo</span>
                        </button>
                      ))}
                    </div>

                    <h3>Usuarios de la empresa</h3>
                    <ul className="platform-admin__members">
                      {detail.members.map((m) => (
                        <li key={m.id}>
                          <strong>{m.name}</strong> — {m.email}
                          <span>{m.roles.join(', ')}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>Seleccione una empresa.</p>
                )}
              </div>
            </section>
          ) : null}

          {tab === 'users' ? (
            <section className="platform-admin__split">
              <div className="platform-admin__list">
                <h1>Usuarios</h1>
                <p className="platform-admin__hint">
                  {users.length} cuenta{users.length === 1 ? '' : 's'} registradas. Actividad,
                  espacio usado y empresas de cada una.
                </p>
                <label className="platform-admin__search">
                  <span className="sr-only">Buscar usuarios</span>
                  <input
                    type="search"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Buscar por nombre, email o empresa…"
                  />
                </label>
                <ul className="platform-admin__company-list">
                  {filteredUsers.length === 0 ? (
                    <li className="platform-admin__hint">No hay usuarios con ese criterio.</li>
                  ) : (
                    filteredUsers.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          className={`platform-admin__company-btn${
                            selectedUserId === u.id ? ' platform-admin__company-btn--active' : ''
                          }`}
                          onClick={() => setSelectedUserId(u.id)}
                        >
                          <strong>
                            {u.name}
                            {u.isPlatformAdmin ? ' · Admin' : ''}
                          </strong>
                          <span>{u.email}</span>
                          <small>
                            {u.active ? 'Activo' : 'Inactivo'} · {formatWhen(u.lastActivityAt)}
                          </small>
                          <StorageBar
                            used={u.storageUsedBytes ?? 0}
                            limit={u.storageLimitBytes ?? 0}
                            unlimited={u.storageUnlimited}
                          />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="platform-admin__detail">
                {userDetail ? (
                  <>
                    <header className="platform-admin__detail-head">
                      <div>
                        <h2>{userDetail.name}</h2>
                        <p>
                          {userDetail.email}
                          {userDetail.isPlatformAdmin ? ' · Administrador de plataforma' : ''}
                          {' · '}
                          {userDetail.active ? 'Cuenta activa' : 'Cuenta inactiva'}
                        </p>
                      </div>
                      <div className="platform-admin__detail-actions">
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={userBusy || userDetail.isPlatformAdmin}
                          onClick={() => void setUserActive(userDetail.id, !userDetail.active)}
                        >
                          {userDetail.active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={userBusy || userDetail.isPlatformAdmin || userDetail.id === user.sub}
                          onClick={() => void removeUser(userDetail.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </header>

                    <form
                      className="platform-admin__edit"
                      onSubmit={(e) => {
                        e.preventDefault()
                        void saveUser()
                      }}
                    >
                      <label>
                        Nombre
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoComplete="name"
                          disabled={userBusy}
                        />
                      </label>
                      <label>
                        Email
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          autoComplete="email"
                          disabled={userBusy || userDetail.isPlatformAdmin}
                        />
                      </label>
                      <Button type="submit" size="sm" disabled={userBusy}>
                        Guardar
                      </Button>
                    </form>

                    <div className="platform-admin__counts">
                      <span>Alta {formatWhen(userDetail.createdAt)}</span>
                      <span>Último acceso {formatWhen(userDetail.lastLoginAt)}</span>
                      <span>Última actividad {formatWhen(userDetail.lastActivityAt)}</span>
                      <span>{userDetail.salesCount ?? 0} ventas</span>
                      <span>{userDetail.tasksCount ?? 0} tareas</span>
                      <span>{userDetail.cashClosesCount ?? 0} cierres</span>
                      <span>{userDetail.auditCount ?? 0} eventos</span>
                    </div>

                    <h3>Espacio y módulos</h3>
                    {userDetail.companies.length ? (
                      <div className="platform-admin__company-cards">
                        {userDetail.companies.map((c) => {
                          const used = c.usage?.storageUsedBytes ?? c.storageUsedBytes ?? 0
                          const unlimited = isUnlimitedPlan(c.plan)
                          const limit = unlimited
                            ? 0
                            : c.usage?.storageLimitBytes || c.storageLimitBytes || 0
                          return (
                            <article key={c.id} className="platform-admin__company-card">
                              <header>
                                <div>
                                  <strong>{c.name}</strong>
                                  <span>
                                    {c.role} · {companyPlanLabel(c.plan)}
                                  </span>
                                </div>
                                {c.plan !== 'PRO' && c.plan !== 'BUSINESS' ? (
                                  <button
                                    type="button"
                                    className="platform-admin__link-btn"
                                    disabled={planBusyId === c.id}
                                    onClick={() => void setCompanyPlan(c.id, 'PRO')}
                                  >
                                    Pasar a Pro
                                  </button>
                                ) : null}
                              </header>
                              <StorageBar used={used} limit={limit} unlimited={unlimited} />
                              {c.usage ? (
                                <p className="platform-admin__hint">
                                  {c.usage.products} prod · {c.usage.sales} ventas · {c.usage.purchases}{' '}
                                  compras · {c.usage.inventory} inv · {c.usage.appointments} citas
                                </p>
                              ) : null}
                              <ModuleToggles
                                modules={c.modules ?? []}
                                busy={moduleBusy}
                                onToggle={(slug, enabled) =>
                                  void toggleCompanyModule(c.id, slug, enabled)
                                }
                              />
                            </article>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="platform-admin__hint">Este usuario no tiene empresas.</p>
                    )}

                    <h3>Ventas registradas</h3>
                    {userDetail.recentSales.length ? (
                      <div className="platform-admin__table-wrap">
                        <table className="platform-admin__table">
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>Empresa</th>
                              <th>Código</th>
                              <th>Total</th>
                              <th>Pago</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetail.recentSales.map((s) => (
                              <tr key={s.id}>
                                <td>{formatWhen(s.saleDate)}</td>
                                <td>{s.companyName}</td>
                                <td>{s.code ?? '—'}</td>
                                <td>{formatMoney(s.total)}</td>
                                <td>{s.paymentMethod ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="platform-admin__hint">Todavía no registró ventas.</p>
                    )}

                    <h3>Tareas</h3>
                    {userDetail.recentTasks.length ? (
                      <ul className="platform-admin__activity">
                        {userDetail.recentTasks.map((t) => (
                          <li key={t.id}>
                            <strong>{t.title}</strong>
                            <span>
                              {t.companyName} · {taskKindLabel(t.kind)} · {t.taskDate}
                              {t.completed ? ' · Hecha' : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="platform-admin__hint">Sin tareas creadas o asignadas.</p>
                    )}

                    <h3>Cierres de caja</h3>
                    {userDetail.recentCashCloses.length ? (
                      <ul className="platform-admin__activity">
                        {userDetail.recentCashCloses.map((c) => (
                          <li key={c.id}>
                            <strong>{c.companyName}</strong>
                            <span>
                              {formatWhen(c.closedAt ?? c.closeDate)} · {c.status} ·{' '}
                              {formatMoney(c.salesTotalCOP)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="platform-admin__hint">Sin cierres de caja.</p>
                    )}

                    <h3>Eventos recientes</h3>
                    {userDetail.recentLogs.length ? (
                      <ul className="platform-admin__activity">
                        {userDetail.recentLogs.map((l) => (
                          <li key={l.id}>
                            <strong>{auditLabel(l.action, l.tableName)}</strong>
                            <span>
                              {l.companyName ?? 'Plataforma'} · {formatWhen(l.createdAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="platform-admin__hint">Sin eventos de auditoría.</p>
                    )}
                  </>
                ) : (
                  <p>Seleccione un usuario.</p>
                )}
              </div>
            </section>
          ) : null}

          {tab === 'requests' ? (
            <section className="platform-admin__panel">
              <h1>Solicitudes y planes</h1>
              <p className="platform-admin__hint">
                Aquí llegan los registros y los pedidos de Pro o Empresa. También le avisamos por Telegram
                si el bot está vinculado.
              </p>
              <div className="platform-admin__table-wrap">
                <table className="platform-admin__table">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Contacto</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Mensaje</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id}>
                        <td>{r.companyName}</td>
                        <td>{r.contactName}</td>
                        <td>{r.email}</td>
                        <td>{r.phone ?? '—'}</td>
                        <td>{r.message ?? '—'}</td>
                        <td>{new Date(r.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      )}

      <ViewBootSplash ready={!loading} label="Cargando panel de administración…" />
    </div>
  )
}
