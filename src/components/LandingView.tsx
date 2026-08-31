import { useEffect, useState, type MouseEvent } from 'react'
import { useLandingScrollReveal } from '../hooks/useLandingScrollReveal'
import { BRAND_NAME, BRAND_TAGLINE } from '../lib/brand'
import { DEFAULT_LIGHT, setThemeColor } from '../lib/themeColor'
import { SiteFooter } from './SiteFooter'
import { getLoginUrl, getRegisterUrl } from '../lib/authRoutes'
import { BrandMark } from './BrandMark'
import { LandingSolutionDemo } from './landing/LandingSolutionDemo'
import { LandingSalesChat } from './landing/LandingSalesChat'
import {
  LandingAgentsSection,
  LandingAutomationsSection,
  LandingCompareSection,
  LandingFaqSection,
  LandingFinalCtaSection,
  LandingIndustriesSection,
  LandingModulesSection,
  LandingPricingSection,
  LandingProductsSection,
  LandingResultsSection,
  LandingTestimonialsSection,
  LandingWhySection,
} from './landing/sections'
import './landing/sections/landing-premium.css'
import '../public-shell.css'
import './landing/attio-home.css'

const VALIDATION_STEPS = [
  {
    title: 'Conecta',
    text: 'Tus datos, procesos y aplicaciones se integran para que los agentes entiendan el contexto real de tu trabajo.',
  },
  {
    title: 'Define',
    text: 'Creas agentes especializados con las reglas, herramientas y límites que tu negocio necesita.',
  },
  {
    title: 'Delega',
    text: 'Los agentes reciben información, toman decisiones dentro de esas reglas y ejecutan tareas de principio a fin.',
  },
  {
    title: 'Escala',
    text: 'Un agente para cada necesidad: agenda, documentos, ventas, operaciones, administración o análisis.',
  },
] as const

const MODULE_LOGOS = [
  'Agenda',
  'Atención',
  'Documentos',
  'Ventas',
  'Operaciones',
  'Administración',
  'Análisis',
  'Cotizaciones',
  'Informes',
  'Citas',
  'Proyectos',
  'IA',
] as const

const NAV_LINKS = [
  { href: '#agentes', label: 'Agentes' },
  { href: '#features', label: 'Capacidades' },
  { href: '#planes', label: 'Precios' },
] as const

type Props = {
  onLoginClick?: () => void
  onAccessRequestClick?: () => void
  onHealthLoginClick?: () => void
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.1"
        d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5"
      />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
        d="M15 6H3M15 12H3"
      />
    </svg>
  )
}

export function LandingView({
  onLoginClick,
  onAccessRequestClick,
  onHealthLoginClick,
}: Props) {
  const loginUrl = getLoginUrl()
  const registerUrl = getRegisterUrl()
  const scrollWrapRef = useLandingScrollReveal()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.title = `${BRAND_NAME} — Plataforma de agentes inteligentes`
    const root = document.documentElement
    const prevTheme = root.dataset.theme
    const prevShell = root.dataset.shell
    const prevThemeColor =
      document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null
    root.dataset.shell = 'public'
    root.dataset.theme = 'light'
    setThemeColor('#f6f6f4')
    return () => {
      if (prevShell) root.dataset.shell = prevShell
      else delete root.dataset.shell
      if (prevTheme) root.dataset.theme = prevTheme
      else delete root.dataset.theme
      setThemeColor(prevThemeColor ?? DEFAULT_LIGHT)
    }
  }, [])

  function handleLogin(e: MouseEvent<HTMLAnchorElement>) {
    if (!onLoginClick) return
    e.preventDefault()
    onLoginClick()
  }

  function handleAccess(e: MouseEvent<HTMLAnchorElement>) {
    if (!onAccessRequestClick) return
    e.preventDefault()
    onAccessRequestClick()
  }

  function scrollToDemo() {
    document.getElementById('solution-title')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className="public-shell landing-v2 attio-home">
      <header className="attio-header">
        <div className="attio-banner">
          <a href="#features">
            <span>De la IA que responde a la IA que trabaja</span>
            <ArrowIcon />
          </a>
        </div>
        <div className="attio-container">
          <nav className="attio-nav" aria-label="Principal">
            <a className="attio-nav__brand" href="#top" aria-label={`${BRAND_NAME} inicio`}>
              <BrandMark size="sm" />
            </a>
            <ul className="attio-nav__links">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="attio-nav__menu"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MenuIcon />
            </button>
            <div className="attio-nav__cta">
              <a className="attio-btn attio-btn--outline" href={loginUrl} onClick={handleLogin}>
                Iniciar sesión
              </a>
              <a className="attio-btn attio-btn--primary" href={registerUrl} onClick={handleAccess}>
                Registrarse
              </a>
            </div>
          </nav>
          <div className={menuOpen ? 'attio-nav__drawer is-open' : 'attio-nav__drawer'}>
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={closeMenu}>
                {link.label}
              </a>
            ))}
            <a href={loginUrl} onClick={(e) => { closeMenu(); handleLogin(e) }}>
              Iniciar sesión
            </a>
            <a href={registerUrl} onClick={(e) => { closeMenu(); handleAccess(e) }}>
              Registrarse
            </a>
          </div>
        </div>
      </header>

      <div
        ref={scrollWrapRef}
        id="top"
        className="public-wrap landing-v2__wrap landing-v2__wrap--scroll"
      >
        <div className="attio-container">
          <div className="attio-frame">
            <header className="attio-hero" aria-labelledby="landing-hero-title">
              <div className="attio-badge">
                Plataforma de agentes inteligentes
              </div>
              <h1 id="landing-hero-title">La inteligencia que trabaja contigo.</h1>
              <p className="attio-hero__lead">
                {BRAND_NAME} es una plataforma de agentes inteligentes para empresas y
                profesionales. Conecta tus herramientas, entiende tu contexto y
                automatiza tareas reales para que puedas dedicar tu tiempo a lo que
                realmente importa.
              </p>
              <div className="attio-hero__cta">
                <a className="attio-btn attio-btn--primary" href={registerUrl} onClick={handleAccess}>
                  Registrarse
                </a>
                <a className="attio-btn attio-btn--outline" href={loginUrl} onClick={handleLogin}>
                  Iniciar sesión
                </a>
              </div>
            </header>
            <LandingTestimonialsSection />
          </div>
        </div>

        <div className="attio-container">
          <div className="attio-frame">
            <div className="attio-logos" aria-label="Capacidades de los agentes">
              {MODULE_LOGOS.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </div>
        </div>

        <hr className="attio-hairline" />

        <div className="attio-container">
          <div className="attio-frame attio-trust">
            <div className="attio-trust__copy">
              <h2>No necesitas cambiar la forma en que trabajas. </h2>
              <p>
                {BRAND_NAME} funciona como una capa inteligente sobre las herramientas
                que ya utilizas. Tus datos, procesos y aplicaciones se conectan para
                que tus agentes entiendan el contexto y ejecuten tareas de principio a
                fin.
              </p>
            </div>
            <div className="attio-trust__certs">
              <div className="attio-trust__cert">
                <span className="attio-trust__mark">CONECTA</span>
                <span>Tus herramientas</span>
              </div>
              <div className="attio-trust__cert">
                <span className="attio-trust__mark">ACTÚA</span>
                <span>Tareas reales</span>
              </div>
              <div className="attio-trust__cert">
                <span className="attio-trust__mark">ESCALA</span>
                <span>Cualquier negocio</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="attio-hairline" />

        <div className="attio-container">
          <div className="attio-frame">
            <LandingWhySection />
          </div>
        </div>

        <hr className="attio-hairline" />

        <div className="attio-container" id="features">
          <div className="attio-frame">
            <LandingAgentsSection />
            <LandingModulesSection accessUrl={registerUrl} onAccess={handleAccess} />

            <section
              className="public-section landing-section landing-validation"
              aria-labelledby="validation-title"
            >
              <div className="public-section__head">
                <p className="landing-section__kicker">Empezar</p>
                <h2 id="validation-title">De conversar con una IA a darle trabajo</h2>
              </div>
              <div className="landing-validation-grid">
                {VALIDATION_STEPS.map((step, i) => (
                  <article key={step.title} className="landing-validation-step">
                    <span className="landing-validation-step__num" aria-hidden>
                      {i + 1}
                    </span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </article>
                ))}
              </div>
              <div className="landing-validation-cta">
                <a className="attio-btn attio-btn--primary" href={registerUrl} onClick={handleAccess}>
                  Empieza gratis
                </a>
              </div>
            </section>

            <section className="public-section landing-section" aria-labelledby="problem-title">
              <div className="public-section__head">
                <p className="landing-section__kicker">De la IA que responde a la IA que trabaja</p>
                <h2 id="problem-title">No se trata solamente de conversar con una inteligencia artificial.</h2>
                <p>
                  Se trata de darle trabajo. Tus agentes pueden recibir información, tomar
                  decisiones dentro de las reglas que definas, utilizar tus herramientas y
                  completar tareas.
                </p>
                <p>
                  Dejas de preguntar una y otra vez. Empiezas a delegar el trabajo que hoy
                  consume tu tiempo.
                </p>
                <p className="landing-section__after">
                  {BRAND_NAME} conecta el contexto de tu negocio para que la inteligencia
                  ejecute, no solo responda.
                </p>
              </div>
            </section>

            <section
              className="public-section landing-section landing-section--solution"
              aria-labelledby="solution-title"
            >
              <div className="public-section__head landing-section--solution__head">
                <p className="landing-section__kicker">La solución</p>
                <h2 id="solution-title">
                  Una plataforma. Cualquier negocio.
                </h2>
                <p>
                  Desde un profesional independiente hasta una empresa con equipos completos,{' '}
                  {BRAND_NAME} adapta sus agentes a la forma en que cada negocio trabaja.
                </p>
              </div>
              <LandingSolutionDemo />
            </section>

            <section className="public-section landing-section" aria-labelledby="how-title">
              <div className="public-section__head">
                <p className="landing-section__kicker">Cómo funciona</p>
                <h2 id="how-title">Conecta. Automatiza. Escala.</h2>
              </div>
              <div className="public-steps landing-how-steps">
                <article className="public-step">
                  <h3>Conecta</h3>
                  <p>
                    Tus herramientas y datos se unen para que los agentes entiendan el
                    contexto de tu trabajo.
                  </p>
                </article>
                <article className="public-step">
                  <h3>Automatiza</h3>
                  <p>
                    Los agentes ejecutan tareas reales: agenda, documentos, ventas,
                    operaciones y más.
                  </p>
                </article>
                <article className="public-step">
                  <h3>Decide</h3>
                  <p>
                    Trabajan dentro de las reglas que definas: reciben información y
                    actúan con criterio.
                  </p>
                </article>
                <article className="public-step">
                  <h3>Escala</h3>
                  <p>
                    Un agente para cada necesidad, en un solo lugar para construir la
                    inteligencia que tu negocio necesita.
                  </p>
                </article>
              </div>
            </section>

            <LandingCompareSection />
            <LandingAutomationsSection />
            <LandingPricingSection accessUrl={registerUrl} onAccess={handleAccess} />
            <LandingProductsSection
              onBusinessLogin={onLoginClick}
              onHealthLogin={onHealthLoginClick}
            />
            <LandingIndustriesSection />
            <LandingResultsSection />
            <LandingFaqSection />
          </div>
        </div>

        <LandingFinalCtaSection
          accessUrl={registerUrl}
          onAccess={handleAccess}
          onDemo={scrollToDemo}
        />

        <SiteFooter tagline={BRAND_TAGLINE} />
      </div>

      <div className="landing-mobile-cta" role="region" aria-label="Acciones rápidas">
        <a
          className="attio-btn attio-btn--primary landing-mobile-cta__primary"
          href={registerUrl}
          onClick={handleAccess}
        >
          Registrarse
        </a>
        <a className="landing-mobile-cta__ghost" href={loginUrl} onClick={handleLogin}>
          Iniciar sesión
        </a>
      </div>

      <LandingSalesChat />
    </div>
  )
}
