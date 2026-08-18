import { useEffect, useState, type FormEvent } from 'react'
import { completeGoogleSignup, type AuthUser } from '../api'
import { BRAND_NAME } from '../lib/brand'
import {
  decodeGoogleSignupToken,
  getLandingUrl,
  getLoginUrl,
  navigateToRegister,
  readGoogleSignupToken,
  storeGoogleSignupToken,
} from '../lib/authRoutes'
import { BrandMark } from './BrandMark'
import { PublicLegalConsent } from './PublicLegalConsent'
import { PublicThemeSwitch } from './PublicThemeSwitch'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { usePublicTheme } from '../hooks/usePublicTheme'
import '../public-shell.css'

type Props = {
  baseUrl: string
  onCreated: (user: AuthUser) => void
}

export function GoogleSignupView({ baseUrl, onCreated }: Props) {
  const [companyName, setCompanyName] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { theme, toggleTheme } = usePublicTheme()
  const token = readGoogleSignupToken()
  const profile = token ? decodeGoogleSignupToken(token) : null

  useEffect(() => {
    document.title = `Crear cuenta · ${BRAND_NAME}`
    const stored = readGoogleSignupToken()
    if (!stored || !decodeGoogleSignupToken(stored)) {
      navigateToRegister(true)
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token || submitting) return
    if (!companyName.trim()) {
      setError('Ingresá el nombre de tu empresa o negocio.')
      return
    }
    if (!acceptTerms || !acceptPrivacy) {
      setError('Para continuar, aceptá los términos y el tratamiento de datos.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await completeGoogleSignup(baseUrl, {
        signupToken: token,
        companyName: companyName.trim(),
        acceptTerms,
        acceptPrivacy,
      })
      storeGoogleSignupToken(null)
      onCreated(res.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!profile) return null

  return (
    <div className="public-shell public-auth google-signup">
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
        <aside className="public-auth__visual">
          <BrandMark size="md" showTagline />
          <div>
            <h2>Tu cuenta de Google es nueva en {BRAND_NAME}</h2>
            <p>
              Antes de crear el espacio, confirmamos tu identidad y el tratamiento de los datos
              de tu negocio. Esto queda registrado para operar de forma segura y conforme a la ley.
            </p>
          </div>
          <ul className="public-auth__bullets">
            <li>Datos aislados por empresa</li>
            <li>Tratamiento según Ley 1581 de 2012</li>
            <li>Sin vender información a terceros</li>
            <li>Podés pedir corrección o eliminación</li>
          </ul>
        </aside>

        <div className="public-auth__form-wrap">
          <form className="public-auth__form google-signup__form" onSubmit={handleSubmit}>
            <header className="public-auth__head">
              <p className="google-signup__kicker">Registro con Google</p>
              <h1 className="public-auth__title">Crear tu espacio</h1>
              <p className="public-auth__subtitle">
                Revisá los acuerdos y nombrá tu empresa para activar el panel.
              </p>
            </header>

            <div className="google-signup__identity" aria-label="Cuenta de Google">
              <span className="google-signup__avatar" aria-hidden>
                {profile.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <strong>{profile.name}</strong>
                <span>{profile.email}</span>
              </div>
            </div>

            <Label>
              <span>Nombre de la empresa</span>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                autoComplete="organization"
                required
                autoFocus
                disabled={submitting}
                placeholder="Ej. Café Central"
              />
            </Label>

            <PublicLegalConsent
              identity="google"
              acceptTerms={acceptTerms}
              acceptPrivacy={acceptPrivacy}
              disabled={submitting}
              onAcceptTerms={setAcceptTerms}
              onAcceptPrivacy={setAcceptPrivacy}
            />

            {error ? (
              <div className="vos-alert vos-alert--error" role="alert">
                {error}
              </div>
            ) : null}

            <Button type="submit" size="lg" block disabled={submitting}>
              {submitting ? 'Creando cuenta…' : 'Crear mi cuenta'}
            </Button>

            <p className="public-auth__footer-link">
              ¿Ya tenés acceso? <a href={getLoginUrl()}>Iniciar sesión</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
