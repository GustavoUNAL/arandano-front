import { Building2, Check } from 'lucide-react'
import { useState } from 'react'
import { switchCompany, type AuthUser } from '../api'
import {
  companyHint,
  companyInitial,
  roleLabel,
  canSwitchCompany,
  ownedCompanies,
} from '../lib/companySelect'

type Props = {
  baseUrl: string
  user: AuthUser
  onSwitch: (user: AuthUser) => void
  variant?: 'menu' | 'inline'
}

export function CompanySwitcher({
  baseUrl,
  user,
  onSwitch,
  variant = 'menu',
}: Props) {
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!canSwitchCompany(user)) return null

  const companies = ownedCompanies(user)

  async function handleSelect(companyId: string) {
    if (companyId === user.companyId || switchingId) return
    setError(null)
    setSwitchingId(companyId)
    try {
      const res = await switchCompany(baseUrl, companyId)
      onSwitch(res.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar de empresa.')
    } finally {
      setSwitchingId(null)
    }
  }

  return (
    <div
      className={`company-switcher company-switcher--${variant}`}
      aria-label="Cambiar de empresa"
    >
      <div className="company-switcher__head">
        <Building2 className="company-switcher__head-icon" strokeWidth={2} aria-hidden />
        <span className="company-switcher__head-label">Tus empresas</span>
      </div>

      {error ? (
        <p className="company-switcher__error" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="company-switcher__list">
        {companies.map((company) => {
          const active = company.id === user.companyId
          const busy = switchingId === company.id
          const disabled = Boolean(switchingId && !busy)
          return (
            <li key={company.id}>
              <button
                type="button"
                className={`company-switcher__item${active ? ' company-switcher__item--active' : ''}`}
                disabled={disabled || active}
                aria-current={active ? 'true' : undefined}
                aria-busy={busy}
                onClick={() => void handleSelect(company.id)}
              >
                <span className="company-switcher__avatar" aria-hidden>
                  {companyInitial(company.name)}
                </span>
                <span className="company-switcher__copy">
                  <strong>{company.name}</strong>
                  <span>{companyHint(company)}</span>
                  <small>{roleLabel(company.role)}</small>
                </span>
                <span className="company-switcher__status" aria-hidden>
                  {busy ? (
                    <span className="company-switcher__busy">…</span>
                  ) : active ? (
                    <Check className="company-switcher__check" strokeWidth={2.5} />
                  ) : (
                    <span className="company-switcher__go">Entrar</span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
