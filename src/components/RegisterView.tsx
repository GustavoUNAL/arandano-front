import { useEffect, useState } from 'react'
import { fetchMe, setAccessToken, type AuthUser } from '../api'
import { BRAND_NAME } from '../lib/brand'
import {
  getLandingUrl,
  getLoginUrl,
  navigateToGoogleSignup,
  storeGoogleSignupToken,
} from '../lib/authRoutes'
import { BrandMark } from './BrandMark'
import { GoogleSignInButton } from './GoogleSignInButton'
import { LandingSalesChat } from './landing/LandingSalesChat'
import { PublicThemeSwitch } from './PublicThemeSwitch'
import { usePublicTheme } from '../hooks/usePublicTheme'
import '../public-shell.css'

type Props = {
  baseUrl: string
  onCreated: (user: AuthUser) => void
}

export function RegisterView({ baseUrl, onCreated }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { theme, toggleTheme } = usePublicTheme()

  useEffect(() => {
    document.title = `Crear cuenta · ${BRAND_NAME}`
  }, [])

  async function handleGoogleSuccess(token: string) {
    setError(null)
    setSubmitting(true)
    try {
      setAccessToken(token)
      const user = await fetchMe(baseUrl)
      onCreated(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="public-shell public-auth public-auth--simple">
      <div className="public-shell__grid-bg" aria-hidden />
      <a className="public-btn public-btn--ghost public-auth__back" href={getLandingUrl()}>
        ← Volver
      </a>
      <PublicThemeSwitch
        theme={theme}
        onToggle={toggleTheme}
        compact
        className="public-auth__theme"
      />

      <div className="public-auth__layout">
        <div className="public-auth__form-wrap">
          <div className="public-auth__form">
            <header className="public-auth__head">
              <BrandMark size="sm" />
              <h1 className="public-auth__title">Crear su cuenta</h1>
              <p className="public-auth__subtitle">
                Use Google para abrir su espacio. Si ya tiene acceso, inicie sesión.
              </p>
            </header>

            <GoogleSignInButton
              returnTo="login"
              disabled={submitting}
              onSuccess={handleGoogleSuccess}
              onSignup={(signupToken) => {
                storeGoogleSignupToken(signupToken)
                navigateToGoogleSignup(true)
              }}
              onError={(msg) => setError(msg)}
            />
            <p className="public-auth__legal-note">
              Si es la primera vez, le pediremos el nombre de su empresa y la autorización
              del tratamiento de datos.
            </p>

            {error ? (
              <div className="vos-alert vos-alert--error" role="alert">
                {error}
              </div>
            ) : null}

            <p className="public-auth__or">o</p>

            <a
              className="vos-btn vos-btn--secondary vos-btn--lg vos-btn--block"
              href={getLoginUrl()}
            >
              Iniciar sesión
            </a>
          </div>
        </div>
      </div>
      <LandingSalesChat />
    </div>
  )
}
