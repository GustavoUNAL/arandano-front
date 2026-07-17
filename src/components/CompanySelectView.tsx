import { useEffect, useState } from 'react'
import { switchCompany, type AuthUser } from '../api'
import { BRAND_NAME } from '../lib/brand'
import {
  companyHint,
  companyInitial,
  roleLabel,
  ownedCompanies,
} from '../lib/companySelect'
import { BrandMark } from './BrandMark'
import { PublicThemeSwitch } from './PublicThemeSwitch'
import { usePublicTheme } from '../hooks/usePublicTheme'
import '../public-shell.css'

type Props = {
  baseUrl: string
  user: AuthUser
  onSelect: (user: AuthUser) => void
  onLogout: () => void
  onCancel?: () => void
}

export function CompanySelectView({ baseUrl, user, onSelect, onLogout, onCancel }: Props) {
  const [selectingId, setSelectingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { theme, toggleTheme } = usePublicTheme()

  useEffect(() => {
    document.title = `Elegir empresa · ${BRAND_NAME}`
  }, [])

  async function handleSelect(companyId: string) {
    if (selectingId) return
    setError(null)
    setSelectingId(companyId)
    try {
      const res = await switchCompany(baseUrl, companyId)
      onSelect(res.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la empresa.')
    } finally {
      setSelectingId(null)
    }
  }

  const companies = ownedCompanies(user)

  return (
    <div className="public-shell public-auth public-company-select">
      <div className="public-shell__grid-bg" aria-hidden />
      <PublicThemeSwitch
        theme={theme}
        onToggle={toggleTheme}
        compact
        className="public-auth__theme"
      />

      <div className="public-company-select__wrap">
        <header className="public-company-select__head">
          <BrandMark size="md" />
          <div>
            <h1>Elegí tu empresa</h1>
            <p>
              Hola, <strong>{user.name || user.email}</strong>. Tenés acceso a{' '}
              {companies.length} empresas. Seleccioná una para continuar.
            </p>
          </div>
        </header>

        {error ? (
          <div className="vos-alert vos-alert--error public-company-select__alert" role="alert">
            {error}
          </div>
        ) : null}

        <div className="public-company-select__grid" role="list">
          {companies.map((company) => {
            const busy = selectingId === company.id
            const disabled = Boolean(selectingId && !busy)
            return (
              <button
                key={company.id}
                type="button"
                role="listitem"
                className="public-company-select__card vos-card"
                disabled={disabled}
                aria-busy={busy}
                onClick={() => void handleSelect(company.id)}
              >
                <span className="public-company-select__avatar" aria-hidden>
                  {companyInitial(company.name)}
                </span>
                <span className="public-company-select__body">
                  <strong>{company.name}</strong>
                  <span>{companyHint(company)}</span>
                  <small>
                    {roleLabel(company.role)} · {company.modules.length} módulos
                  </small>
                </span>
                <span className="public-company-select__action">
                  {busy ? 'Abriendo…' : 'Entrar →'}
                </span>
              </button>
            )
          })}
        </div>

        <footer className="public-company-select__foot">
          {onCancel ? (
            <button type="button" className="public-btn public-btn--ghost" onClick={onCancel}>
              Volver al panel
            </button>
          ) : null}
          <button type="button" className="public-btn public-btn--ghost" onClick={onLogout}>
            Cerrar sesión
          </button>
        </footer>
      </div>
    </div>
  )
}
