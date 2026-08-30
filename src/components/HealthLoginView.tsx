import { useEffect, useState, type FormEvent } from 'react'
import { fetchMe, login, setAccessToken, type AuthUser } from '../api'
import { getAccessRequestUrl, getLandingUrl, getLoginUrl } from '../lib/authRoutes'
import { PublicAuthMobileIntro } from './PublicAuthMobileIntro'
import { GoogleSignInButton } from './GoogleSignInButton'
import { PublicThemeSwitch } from './PublicThemeSwitch'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { usePublicTheme } from '../hooks/usePublicTheme'
import '../public-shell.css'
import './HealthLoginView.css'

type Props = {
  baseUrl: string
  onLogin: (user: AuthUser) => void
  initialMessage?: string | null
}

export function HealthLoginView({ baseUrl, onLogin, initialMessage }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { theme, toggleTheme } = usePublicTheme()

  useEffect(() => {
    document.title = 'Iniciar sesión · VOS IA HEALTH'
    try {
      window.sessionStorage.setItem('vos_portal', 'health')
    } catch {
      /* ignore */
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Ingresá email y contraseña de tu clínica.')
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
    <div className="public-shell public-auth health-login">
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

      <PublicAuthMobileIntro chips={['Pacientes', 'Agenda', 'HC', 'Odontograma']} />

      <div className="public-auth__layout health-login__card">
        <aside className="public-auth__visual health-login__visual">
          <p className="health-login__eyebrow">Producto VOS IA</p>
          <h1 className="health-login__brand">VOS IA HEALTH</h1>
          <p className="health-login__lead">
            Plataforma clínica para odontología y salud: pacientes, agenda, historia
            clínica y costos en un solo lugar.
          </p>
          <ul className="public-auth__bullets">
            <li>Historia clínica y odontograma</li>
            <li>Agenda e ingresos del consultorio</li>
            <li>Inventario y bioseguridad</li>
            <li>Asistente IA para tu clínica</li>
          </ul>
          <div className="public-auth__visual-stats" aria-hidden>
            <div>
              <strong>12</strong>
              <span>citas hoy</span>
            </div>
            <div>
              <strong>HC</strong>
              <span>digital</span>
            </div>
            <div>
              <strong>1</strong>
              <span>consultorio</span>
            </div>
          </div>
          <p className="public-auth__aside-note">
            ¿Negocio, no clínica?{' '}
            <a href={getLoginUrl()}>Entrar a VOS IA</a>
          </p>
        </aside>

        <div className="public-auth__form-wrap">
          <form className="public-auth__form" onSubmit={handleSubmit}>
            <header className="public-auth__head">
              <h2 className="public-auth__title">Acceso a tu clínica</h2>
              <p className="public-auth__subtitle">
                Credenciales del consultorio en VOS IA HEALTH.
              </p>
            </header>

            {initialMessage ? (
              <div className="vos-alert vos-alert--error" role="alert">
                {initialMessage}
              </div>
            ) : null}

            <GoogleSignInButton
              returnTo="health"
              label="Continuar con Google"
              disabled={submitting}
              onSuccess={handleGoogleSuccess}
              onError={(msg) => setError(msg)}
            />

            <p className="public-auth__or">o con tu email profesional</p>

            <Label>
              <span>Email profesional</span>
              <Input
                type="email"
                inputMode="email"
                enterKeyHint="next"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                disabled={submitting}
                placeholder="dra@clinic.com"
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
              </div>
            ) : null}

            <Button type="submit" size="lg" block disabled={submitting}>
              {submitting ? 'Ingresando…' : 'Entrar a VOS IA HEALTH'}
            </Button>

            <p className="public-auth__footer-link">
              ¿Aún no tenés acceso?{' '}
              <a href={getAccessRequestUrl()}>Solicitá VOS IA HEALTH</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
