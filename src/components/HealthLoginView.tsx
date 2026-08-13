import { useEffect, useState, type FormEvent } from 'react'
import { login, type AuthUser } from '../api'
import { getAccessRequestUrl, getLandingUrl } from '../lib/authRoutes'
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

  return (
    <div className="public-shell health-login">
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

      <div className="health-login__layout">
        <aside className="health-login__visual">
          <p className="health-login__eyebrow">Producto VOS AI</p>
          <h1 className="health-login__brand">VOS IA HEALTH</h1>
          <p className="health-login__lead">
            La plataforma clínica para odontología y salud: pacientes, agenda, historia
            clínica, costos y bioseguridad en un solo lugar.
          </p>
          <ul className="health-login__bullets">
            <li>Historia clínica y odontograma</li>
            <li>Agenda e ingresos del consultorio</li>
            <li>Inventario y bioseguridad</li>
            <li>Asistente IA para tu clínica</li>
          </ul>
          <p className="health-login__aside-note">
            ¿Aún no tenés acceso?{' '}
            <a href={getAccessRequestUrl()}>Solicitá VOS IA HEALTH</a>
          </p>
        </aside>

        <div className="health-login__form-wrap">
          <form className="health-login__form" onSubmit={handleSubmit}>
            <header className="health-login__head">
              <h2>Acceso a tu clínica</h2>
              <p>Ingresá con las credenciales de tu consultorio en VOS IA HEALTH.</p>
            </header>

            {initialMessage ? (
              <div className="vos-alert vos-alert--info" role="status">
                {initialMessage}
              </div>
            ) : null}

            <Label>
              <span>Email profesional</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                autoFocus
                disabled={submitting}
                placeholder="dra@clinic.com"
              />
            </Label>

            <Label>
              <span>Contraseña</span>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={submitting}
              />
            </Label>

            {error ? (
              <div className="vos-alert vos-alert--error" role="alert">
                {error}
              </div>
            ) : null}

            <Button type="submit" size="lg" block disabled={submitting}>
              {submitting ? 'Ingresando…' : 'Entrar a VOS IA HEALTH'}
            </Button>

          <p className="health-login__footer-hint">
            Acceso clínico para Alexandra Bastidas y centros enlazados a VOS IA HEALTH.
          </p>
          </form>
        </div>
      </div>
    </div>
  )
}
