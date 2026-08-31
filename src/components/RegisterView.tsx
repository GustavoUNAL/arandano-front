import { useEffect, useState, type FormEvent } from 'react'
import { fetchMe, register, setAccessToken, type AuthUser } from '../api'
import { BRAND_NAME } from '../lib/brand'
import {
  getLandingUrl,
  getLoginUrl,
  navigateToGoogleSignup,
  storeGoogleSignupToken,
} from '../lib/authRoutes'
import { BrandMark } from './BrandMark'
import { GoogleSignInButton } from './GoogleSignInButton'
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

export function RegisterView({ baseUrl, onCreated }: Props) {
  const [companyName, setCompanyName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { theme, toggleTheme } = usePublicTheme()

  useEffect(() => {
    document.title = `Crear cuenta · ${BRAND_NAME}`
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (!companyName.trim() || !name.trim() || !email.trim() || !password) {
      setError('Complete empresa, nombre, email y contraseña.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (!acceptTerms || !acceptPrivacy) {
      setError('Para continuar, acepte los términos y el tratamiento de datos.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await register(baseUrl, {
        name: name.trim(),
        email: email.trim(),
        password,
        companyName: companyName.trim(),
        acceptTerms,
        acceptPrivacy,
      })
      onCreated(res.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.')
    } finally {
      setSubmitting(false)
    }
  }

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
            <h2>Cree su espacio en {BRAND_NAME}</h2>
            <p>
              Regístrese con Google o con el formulario. En ambos casos acepta el tratamiento
              de datos de su negocio antes de activar el panel.
            </p>
          </div>
          <ul className="public-auth__bullets">
            <li>Ingrese al panel en el momento</li>
            <li>Datos aislados por empresa</li>
            <li>Tratamiento según Ley 1581 de 2012</li>
            <li>Sin vender información a terceros</li>
          </ul>
        </aside>

        <div className="public-auth__form-wrap">
          <form className="public-auth__form google-signup__form" onSubmit={handleSubmit}>
            <header className="public-auth__head">
              <p className="google-signup__kicker">Registro</p>
              <h1 className="public-auth__title">Crear su cuenta</h1>
              <p className="public-auth__subtitle">
                Use Google o complete sus datos. El espacio queda listo para operar.
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

            <p className="public-auth__or">o con tu email</p>

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

            <Label>
              <span>Tu nombre</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                disabled={submitting}
                placeholder="María García"
              />
            </Label>

            <Label>
              <span>Email</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                disabled={submitting}
                placeholder="tu@empresa.com"
              />
            </Label>

            <Label>
              <span>Contraseña</span>
              <div className="public-auth__password">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  disabled={submitting}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  className="public-auth__password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </Label>

            <PublicLegalConsent
              identity="email"
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
