import { useState } from 'react'
import { getApiBase, submitAccessRequest, type AuthUser, type CompanyUsage } from '../api'

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

type BannerProps = {
  user: AuthUser
  onUpgrade: () => void
}

export function TrialQuotaBanner({ user, onUpgrade }: BannerProps) {
  const usage = user.usage
  if (!usage || usage.plan !== 'TRIAL' || (!usage.offerPro && !usage.overLimit)) {
    return null
  }

  return (
    <div
      className={`app-banner app-banner--trial${usage.overLimit ? ' app-banner--trial-over' : ''}`}
      role="status"
    >
      <span>
        {usage.overLimit
          ? `Llegaste al límite de Free${usage.limitLabel ? ` (${usage.limitLabel})` : ''}. Pasate a Pro para seguir cargando datos.`
          : `Estás usando el ${usage.percent}% del cupo Free (${formatBytes(usage.storageUsedBytes)} de ${formatBytes(usage.storageLimitBytes)}).`}
      </span>
      <button type="button" className="btn btn-primary btn-sm" onClick={onUpgrade}>
        Ver VOS IA Pro
      </button>
    </div>
  )
}

type PaywallProps = {
  user: AuthUser
  usage?: CompanyUsage | null
  onClose: () => void
}

export function TrialPaywallModal({ user, usage, onClose }: PaywallProps) {
  const u = usage ?? user.usage
  const [sending, setSending] = useState<'PRO' | 'BUSINESS' | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function alertAdmin(plan: 'PRO' | 'BUSINESS') {
    if (sending) return
    setError(null)
    setSending(plan)
    try {
      const res = await submitAccessRequest(getApiBase(), {
        companyName: user.companyName?.trim() || 'Sin empresa',
        contactName: user.name,
        email: user.email,
        message: `Upgrade desde la app. Empresa id: ${user.companyId}`,
        plan,
      })
      setSent(res.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo avisar al administrador.')
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="trial-paywall" role="dialog" aria-modal="true" aria-labelledby="trial-paywall-title">
      <button type="button" className="trial-paywall__backdrop" aria-label="Cerrar" onClick={onClose} />
      <div className="trial-paywall__card">
        <p className="trial-paywall__kicker">Versión de prueba</p>
        <h2 id="trial-paywall-title">Pasate a VOS IA Pro</h2>
        <p>
          {u?.overLimit
            ? `Ya usaste el cupo Free${u.limitLabel ? ` de ${u.limitLabel}` : ''}. Con Pro o Empresa seguís cargando datos sin tope.`
            : 'Free alcanza para conocer Arándano. Pro deja el negocio funcionando sin límites; Empresa es para varios locales.'}
        </p>
        {u ? (
          <ul className="trial-paywall__usage">
            <li>
              Espacio {formatBytes(u.storageUsedBytes)}
              {u.storageLimitBytes > 0 ? ` / ${formatBytes(u.storageLimitBytes)}` : ''}
            </li>
            <li>Productos {u.products}</li>
            <li>Ventas {u.sales}</li>
            <li>Citas {u.appointments}</li>
          </ul>
        ) : null}
        {sent ? (
          <p className="trial-paywall__hint" role="status">
            {sent}
          </p>
        ) : null}
        {error ? (
          <p className="trial-paywall__hint" role="alert">
            {error}
          </p>
        ) : null}
        <div className="trial-paywall__actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={Boolean(sending) || Boolean(sent)}
            onClick={() => void alertAdmin('PRO')}
          >
            {sending === 'PRO' ? 'Avisando…' : 'Quiero Pro'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={Boolean(sending) || Boolean(sent)}
            onClick={() => void alertAdmin('BUSINESS')}
          >
            {sending === 'BUSINESS' ? 'Avisando…' : 'Quiero Empresa'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Seguir explorando
          </button>
        </div>
      </div>
    </div>
  )
}
