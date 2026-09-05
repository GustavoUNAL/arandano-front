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
    <div className="public-shell public-auth public-auth--register google-signup">
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
            <h2>Su negocio, en un solo espacio</h2>
            <p>
              Cree la cuenta con Google o con su email. El panel queda listo para
              ventas, inventario, citas y el resto de su operación.
            </p>
          </div>
          <ul className="public-auth__bullets">
            <li>Acceso inmediato al panel</li>
            <li>Datos aislados por empresa</li>
            <li>Tratamiento según Ley 1581 de 2012</li>
          </ul>
        </aside>

        <div className="public-auth__form-wrap">
          <form className="public-auth__form google-signup__form" onSubmit={handleSubmit}>
            <header className="public-auth__head">
              <BrandMark size="sm" className="public-auth__form-brand" />
              <p className="google-signup__kicker">Registro</p>
              <h1 className="public-auth__title">Crear su cuenta</h1>
              <p className="public-auth__subtitle">
                Google o el formulario. Acepta el tratamiento de datos al continuar.
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

            <p className="public-auth__or">o con su email</p>

            <div className="public-auth__fields">
              <Label>
                <span>Empresa</span>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  autoComplete="organization"
                  required
                  autoFocus
                  disabled={submitting}
                  placeholder="Café Central"
                />
              </Label>

              <Label>
                <span>Su nombre</span>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  disabled={submitting}
                  placeholder="María García"
                />
              </Label>
            </div>

            <Label>
              <span>Email</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                disabled={submitting}
                placeholder="usted@empresa.com"
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
              ¿Ya tiene acceso? <a href={getLoginUrl()}>Iniciar sesión</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
