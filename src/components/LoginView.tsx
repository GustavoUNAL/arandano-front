import { useEffect, useState, type FormEvent } from 'react'
import { login, type AuthUser } from '../api'
import { getAccessRequestUrl, getHealthLoginUrl, getLandingUrl } from '../lib/authRoutes'
import { BrandMark } from './BrandMark'
import { PublicAuthMobileIntro } from './PublicAuthMobileIntro'
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
  const { theme, toggleTheme } = usePublicTheme()

  useEffect(() => {
    document.title = 'Iniciar sesión · VOS AI'
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

  return (
    <div className="public-shell public-auth">
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

      <PublicAuthMobileIntro chips={['Ventas', 'Inventario', 'IA 24/7', 'Reportes']} />

      <div className="public-auth__layout">
        <aside className="public-auth__visual">
          <BrandMark size="md" showTagline />
          <div>
            <h2>Tu negocio, en un solo lugar</h2>
            <p>
              Entrá con las credenciales de tu empresa para ver ventas, stock y el
              asistente IA con datos reales.
            </p>
          </div>
          <ul className="public-auth__bullets">
            <li>Ventas, inventario y compras</li>
            <li>Punto de venta y pedidos web</li>
            <li>Asistente IA con tu operación</li>
            <li>Reportes claros, día a día</li>
          </ul>
          <div className="public-auth__visual-stats" aria-hidden>
            <div>
              <strong>+14%</strong>
              <span>ventas hoy</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>asistente</span>
            </div>
            <div>
              <strong>1</strong>
              <span>plataforma</span>
            </div>
          </div>
          <p className="public-auth__aside-note muted">
            ¿Clínica o consultorio?{' '}
            <a href={getHealthLoginUrl()}>Entrar a VOS IA HEALTH</a>
          </p>
        </aside>

        <div className="public-auth__form-wrap">
          <form className="public-auth__form" onSubmit={handleSubmit}>
            <header className="public-auth__head">
              <h1 className="public-auth__title">Iniciar sesión</h1>
              <p className="public-auth__subtitle">
                Acceso al panel de tu negocio en VOS AI.
              </p>
            </header>

            {initialMessage ? (
              <div className="vos-alert vos-alert--info" role="status">
                {initialMessage}
              </div>
            ) : null}

            <Label>
              <span>Email</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                autoFocus
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
                <p className="public-auth__error-hint">
                  Si aún no tenés cuenta,{' '}
                  <a href={getAccessRequestUrl()}>solicitá acceso acá</a>.
                </p>
              </div>
            ) : null}

            <Button type="submit" size="lg" block disabled={submitting}>
              {submitting ? 'Ingresando…' : 'Entrar a mi negocio'}
            </Button>

            <p className="public-auth__footer-link">
              ¿Todavía no tenés acceso?{' '}
              <a href={getAccessRequestUrl()}>Quiero VOS AI en mi negocio</a>
            </p>
          </form>
        </div>
      </div>
      <LandingSalesChat />
    </div>
  )
}
