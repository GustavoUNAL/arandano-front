import { useEffect, useState, type MouseEvent } from 'react'
import { BRAND_NAME, BRAND_TAGLINE } from '../lib/brand'
import { DEFAULT_LIGHT, setThemeColor } from '../lib/themeColor'
import { SiteFooter } from './SiteFooter'
import { getLoginUrl, getRegisterUrl } from '../lib/authRoutes'
import { BrandMark } from './BrandMark'
import { LandingProductPreview } from './landing/LandingProductPreview'
import {
  LandingCapabilityCards,
  LandingDataSection,
  LandingEvolutionSection,
  LandingFinalCtaSection,
  LandingIntelligenceSection,
  LandingModularSection,
  LandingSectorsSection,
  LandingValidationCafe,
} from './landing/sections'
import '../public-shell.css'
import './landing/attio-home.css'
import './landing/sections/landing-platform.css'

const NAV_LINKS = [
  { href: '#producto', label: 'Producto' },
  { href: '#modulos', label: 'Módulos' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#evolucion', label: 'Evolución' },
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
}: Props) {
  const loginUrl = getLoginUrl()
  const knowUrl = getRegisterUrl()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.title = `${BRAND_NAME} — Todo su negocio. Una sola plataforma.`
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

  function handleKnow(e: MouseEvent<HTMLAnchorElement>) {
    if (!onAccessRequestClick) return
    e.preventDefault()
    onAccessRequestClick()
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className="public-shell landing-v2 attio-home lp-platform">
      <header className="attio-header">
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
              <a className="attio-btn attio-btn--ghost attio-nav__login" href={loginUrl} onClick={handleLogin}>
                Acceder
              </a>
              <a className="attio-btn attio-btn--ghost attio-nav__know" href={knowUrl} onClick={handleKnow}>
                Conocer VOS-AI
              </a>
            </div>
          </nav>
          <div className={menuOpen ? 'attio-nav__drawer is-open' : 'attio-nav__drawer'}>
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={closeMenu}>
                {link.label}
              </a>
            ))}
            <a
              href={loginUrl}
              onClick={(e) => {
                closeMenu()
                handleLogin(e)
              }}
            >
              Acceder
            </a>
            <a
              className="attio-btn attio-btn--primary attio-nav__drawer-access"
              href={knowUrl}
              onClick={(e) => {
                closeMenu()
                handleKnow(e)
              }}
            >
              Conocer VOS-AI
            </a>
          </div>
        </div>
      </header>

      <div id="top" className="public-wrap landing-v2__wrap landing-v2__wrap--scroll">
        <div className="attio-container">
          <div className="attio-frame">
            <header className="attio-hero attio-hero--split" aria-labelledby="landing-hero-title">
              <div className="attio-hero__copy">
                <div className="attio-badge">Gestión · Datos · Automatización · Inteligencia</div>
                <h1 id="landing-hero-title">
                  Todo tu negocio.
                  <br />
                  Una sola plataforma.
                </h1>
                <p className="attio-hero__lead">
                  VOS-AI reúne las herramientas que necesitas para gestionar ventas,
                  inventario, clientes, citas y procesos de tu negocio desde un solo lugar.
                </p>
                <div className="attio-hero__cta">
                  <a
                    className="attio-btn attio-btn--primary attio-btn--hero"
                    href={knowUrl}
                    onClick={handleKnow}
                  >
                    Conocer VOS-AI
                    <ArrowIcon />
                  </a>
                  <a className="attio-btn attio-btn--outline attio-btn--hero" href="#modulos">
                    Ver módulos
                  </a>
                </div>
              </div>
              <LandingProductPreview />
            </header>
          </div>
        </div>

        <hr className="attio-hairline" />

        <div className="attio-container">
          <div className="attio-frame">
            <LandingModularSection />
            <LandingCapabilityCards />
            <LandingDataSection />
            <LandingIntelligenceSection />
            <LandingValidationCafe />
            <LandingSectorsSection />
            <LandingEvolutionSection />
          </div>
        </div>

        <LandingFinalCtaSection accessUrl={knowUrl} onAccess={handleKnow} />
        <SiteFooter tagline={BRAND_TAGLINE} />
      </div>
    </div>
  )
}
