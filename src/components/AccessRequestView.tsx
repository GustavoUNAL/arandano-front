import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { submitAccessRequest } from '../api'
import { BRAND_NAME, BRAND_TAGLINE } from '../lib/brand'
import { getLandingUrl, getLoginUrl, getRegisterUrl } from '../lib/authRoutes'
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
}

type PlanInterest = 'TRIAL' | 'PRO' | 'BUSINESS'

function planFromHash(): PlanInterest {
  const hash = typeof window === 'undefined' ? '' : window.location.hash
  const q = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  const plan = new URLSearchParams(q).get('plan')
  if (plan === 'pro') return 'PRO'
  if (plan === 'empresa') return 'BUSINESS'
  return 'TRIAL'
}

export function AccessRequestView({ baseUrl }: Props) {
  const plan = useMemo(() => planFromHash(), [])
  const planTitle =
    plan === 'PRO' ? 'Registrarme · Plan Pro' : plan === 'BUSINESS' ? 'Registrarme · Plan Empresa' : 'Registrarme'
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const { theme, toggleTheme } = usePublicTheme()

  useEffect(() => {
    document.title = `${planTitle} · ${BRAND_NAME}`
  }, [planTitle])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (!companyName.trim() || !contactName.trim() || !email.trim()) {
      setError('Complete empresa, nombre y email.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await submitAccessRequest(baseUrl, {
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        message: message.trim() || undefined,
        plan,
      })
      setSubmittedEmail(email.trim())
      setSuccess(res.message)
      setCompanyName('')
      setContactName('')
      setEmail('')
      setPhone('')
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.')
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

      <PublicAuthMobileIntro chips={['Sin costo inicial', 'Punto de venta incluido', 'Tienda web', 'Datos aislados']} />

      <div className="public-auth__layout">
        <aside className="public-auth__visual">
          <BrandMark size="md" showTagline />
          <div>
            <h2>{plan === 'TRIAL' ? 'Registre su empresa' : `Plan ${plan === 'PRO' ? 'Pro' : 'Empresa'}`}</h2>
            <p>
              {plan === 'TRIAL'
                ? `Complete el formulario y activamos su espacio en ${BRAND_NAME} para empezar a operar.`
                : 'Déjenos sus datos. Gustavo recibe la alerta en el panel de administración y le contacta para activar el plan.'}
            </p>
          </div>
          <ul className="public-auth__bullets">
            <li>Activación guiada en pocos días</li>
            <li>URL y datos aislados por empresa</li>
            <li>Punto de venta, tienda web y panel incluidos</li>
            <li>Soporte durante el onboarding</li>
          </ul>
        </aside>

        <div className="public-auth__form-wrap">
          {success ? (
            <div className="public-auth__form vos-card">
              <header className="public-auth__head">
                <h1 className="public-auth__title">¡Solicitud enviada!</h1>
              </header>
              <div className="vos-alert vos-alert--info" role="status">
                {success}
              </div>
              <p className="public-auth__subtitle">
                Te escribiremos a <strong>{submittedEmail}</strong> con usuario y contraseña.
              </p>
              <a className="public-btn public-btn--ghost" href={getLandingUrl()}>
                Volver al inicio
              </a>
            </div>
          ) : (
            <form className="public-auth__form vos-card" onSubmit={handleSubmit}>
              <header className="public-auth__head">
                <h1 className="public-auth__title">{planTitle}</h1>
                <p className="public-auth__subtitle">{BRAND_TAGLINE}</p>
              </header>

              <Label>
                <span>Nombre de tu empresa</span>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  disabled={submitting}
                  placeholder="Mi Restaurante SAS"
                />
              </Label>

              <Label>
                <span>Tu nombre</span>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                  disabled={submitting}
                  placeholder="María García"
                />
              </Label>

              <Label>
                <span>Email de contacto</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                  placeholder="tu@empresa.com"
                />
              </Label>

              <Label className="public-auth__field--optional">
                <span>WhatsApp (opcional)</span>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={submitting}
                  placeholder="+57 300 000 0000"
                />
              </Label>

              <Label className="public-auth__field--optional">
                <span>Mensaje (opcional)</span>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={submitting}
                  placeholder="Ej. bar con 4 mesas y pedidos web"
                />
              </Label>

              {error ? (
                <div className="vos-alert vos-alert--error" role="alert">
                  {error}
                </div>
              ) : null}

              <Button type="submit" size="lg" block disabled={submitting}>
                {submitting ? 'Enviando…' : 'Registrarme'}
              </Button>

              <div className="public-auth__alt-action">
                {plan === 'TRIAL' ? (
                  <a className="public-btn public-btn--ghost" href={getRegisterUrl()}>
                    Crear cuenta ahora · Google
                  </a>
                ) : null}
                <a className="public-btn public-btn--ghost" href={getLoginUrl()}>
                  Ya tengo cuenta · Iniciar sesión
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
      <LandingSalesChat />
    </div>
  )
}
