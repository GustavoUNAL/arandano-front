import { useEffect, useState } from 'react'
import { submitBusinessSetup, type AuthUser } from '../api'
import { BRAND_NAME } from '../lib/brand'
import {
  BUSINESS_TYPES,
  type BusinessTypeOptionId,
} from '../lib/businessTypes'
import { BrandMark } from './BrandMark'
import { PublicThemeSwitch } from './PublicThemeSwitch'
import { Button } from './ui/button'
import { usePublicTheme } from '../hooks/usePublicTheme'
import '../public-shell.css'
import './business-setup.css'

type Props = {
  baseUrl: string
  user: AuthUser
  onDone: (user: AuthUser) => void
  onLogout: () => void
}

export function BusinessSetupView({ baseUrl, user, onDone, onLogout }: Props) {
  const [selected, setSelected] = useState<BusinessTypeOptionId | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { theme, toggleTheme } = usePublicTheme()
  const companyName =
    user.companies?.find((c) => c.id === user.companyId)?.name ||
    user.companyName ||
    'su empresa'

  useEffect(() => {
    document.title = `Tipo de negocio · ${BRAND_NAME}`
  }, [])

  async function handleContinue() {
    if (!selected || submitting) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await submitBusinessSetup(baseUrl, selected)
      onDone(res.user)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar el tipo de negocio.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const preview = BUSINESS_TYPES.find((t) => t.id === selected)

  return (
    <div className="public-shell public-auth business-setup">
      <div className="public-shell__grid-bg" aria-hidden />
      <PublicThemeSwitch
        theme={theme}
        onToggle={toggleTheme}
        className="public-auth__theme"
      />

      <div className="business-setup__card">
        <header className="business-setup__head">
          <BrandMark size="sm" />
          <p className="business-setup__kicker">Configuración inicial</p>
          <h1>¿Qué tipo de negocio es {companyName}?</h1>
          <p className="business-setup__lead">
            Activamos solo las apps que necesita. Puede ajustar módulos después
            desde el panel.
          </p>
        </header>

        <div className="business-setup__grid" role="listbox" aria-label="Tipos de negocio">
          {BUSINESS_TYPES.map((type) => {
            const active = selected === type.id
            return (
              <button
                key={type.id}
                type="button"
                role="option"
                aria-selected={active}
                className={`business-setup__option${active ? ' is-active' : ''}`}
                onClick={() => setSelected(type.id)}
              >
                <strong>{type.name}</strong>
                <span>{type.blurb}</span>
              </button>
            )
          })}
        </div>

        {preview ? (
          <p className="business-setup__preview">
            Se habilitarán: {preview.modules.join(' · ')}
          </p>
        ) : (
          <p className="business-setup__preview business-setup__preview--muted">
            Elija un tipo para ver las apps que se activan.
          </p>
        )}

        {error ? (
          <p className="business-setup__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="business-setup__actions">
          <Button
            type="button"
            disabled={!selected || submitting}
            onClick={() => void handleContinue()}
          >
            {submitting ? 'Activando…' : 'Continuar'}
          </Button>
          <Button type="button" variant="secondary" onClick={onLogout}>
            Salir
          </Button>
        </div>
      </div>
    </div>
  )
}
