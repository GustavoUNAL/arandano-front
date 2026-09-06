import { useEffect, useState, type FormEvent } from 'react'
import { fetchMe, login, setAccessToken, type AuthUser } from '../api'
import { getLandingUrl, getRegisterUrl, navigateToGoogleSignup, storeGoogleSignupToken } from '../lib/authRoutes'
import { BrandMark } from './BrandMark'
import { BRAND_LOGIN_TITLE } from '../lib/brand'
import { readRememberedFirstName } from '../lib/userIdentity'
import { GoogleSignInButton } from './GoogleSignInButton'
import { LandingSalesChat } from './landing/LandingSalesChat'
import { PublicThemeSwitch } from './PublicThemeSwitch'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { usePublicTheme } from '../hooks/usePublicTheme'
import '../public-shell.css'

type Props = {
  baseUrl: string
  onLogin: (user: AuthUser) => void
  initialMessage?: string | null
}

export function LoginView({ baseUrl, onLogin, initialMessage }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rememberedName = readRememberedFirstName()
  const { theme, toggleTheme } = usePublicTheme()

  useEffect(() => {
    document.title = BRAND_LOGIN_TITLE
    try {
      window.sessionStorage.removeItem('vos_portal')
    } catch {
      /* ignore */
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Ingresá email y contraseña.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await login(baseUrl, { email: trimmedEmail, password })
      onLogin(res.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
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
      onLogin(user)
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
          <form className="public-auth__form" onSubmit={handleSubmit}>
            <header className="public-auth__head">
              <BrandMark size="sm" />
              <h1 className="public-auth__title">
                {rememberedName ? `Hola de nuevo, ${rememberedName}` : 'Iniciar sesión'}
              </h1>
              <p className="public-auth__subtitle">
                {rememberedName
                  ? 'Ingrese de nuevo al panel de su negocio.'
                  : 'Ingrese al panel de su negocio.'}
              </p>
            </header>

            {initialMessage ? (
              <div className="vos-alert vos-alert--error" role="alert">
                {initialMessage}
              </div>
            ) : null}

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
              Si es la primera vez con Google, te vamos a pedir el nombre de tu empresa y la
              autorización del tratamiento de datos.
            </p>

            <p className="public-auth__or">o con tu email</p>

            <Label>
              <span>Email</span>
              <Input
                type="email"
                inputMode="email"
                enterKeyHint="next"
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
                  autoComplete="current-password"
                  required
                  disabled={submitting}
                  placeholder="••••••••"
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

            {error ? (
              <div className="vos-alert vos-alert--error" role="alert">
                {error}
                {error.includes('no está configurado') ? null : (
                  <p className="public-auth__error-hint">
                    Si aún no tiene cuenta, <a href={getRegisterUrl()}>regístrese aquí</a>.
                  </p>
                )}
              </div>
            ) : null}

            <Button type="submit" size="lg" block disabled={submitting}>
              {submitting ? 'Ingresando…' : 'Iniciar sesión'}
            </Button>

            <p className="public-auth__footer-link">
              ¿Todavía no tenés acceso?{' '}
              <a href={getRegisterUrl()}>Registrarme</a>
            </p>
          </form>
        </div>
      </div>
      <LandingSalesChat />
    </div>
  )
}
