import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PLATFORM_MODE } from '../appScope'
import type { AuthUser } from '../api'
import { buildDesktopNavGroups } from '../lib/desktopNav'
import { navigateToSelectCompany } from '../lib/authRoutes'
import { userNeedsCompanyPicker } from '../lib/companySelect'
import {
  findNavContext,
  isOdooHomeView,
  odooHomeTargetView,
} from '../lib/odooNav'
import type { NavGroupId } from '../navTypes'
import { AppLauncherIcon } from './AppLauncherIcon'
import { AppMenuOverlay } from './AppMenuOverlay'
import { HeaderSystray } from './HeaderSystray'
import { BrandMark } from './BrandMark'
import { CompanyBrand } from './CompanyBrand'

type DesktopAppHeaderProps = {
  view: string
  user: AuthUser
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onNavigate: (view: string) => void
  onLogout: () => void
  onSwitchCompany?: (user: AuthUser) => void
  onOpenAssistant?: () => void
  assistantOpen?: boolean
  canViewFinance?: boolean
  canViewTasks?: boolean
  backendDown?: boolean
  onRetryApi?: () => void
  baseUrl?: string
}

function groupIconView(
  _group: NavGroupId,
  itemView: string,
): Parameters<typeof AppLauncherIcon>[0]['view'] {
  return itemView as Parameters<typeof AppLauncherIcon>[0]['view']
}

function AppMenuGlyph() {
  return (
    <svg className="odoo-navbar__app-menu-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="5" r="1.6" />
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="19" cy="5" r="1.6" />
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
      <circle cx="5" cy="19" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
      <circle cx="19" cy="19" r="1.6" />
    </svg>
  )
}

export function DesktopAppHeader({
  view,
  user,
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  onSwitchCompany,
  onOpenAssistant,
  assistantOpen = false,
  canViewFinance = false,
  canViewTasks = false,
  backendDown = false,
  onRetryApi,
  baseUrl,
}: DesktopAppHeaderProps) {
  const groups = useMemo(
    () => buildDesktopNavGroups({ canViewFinance, canViewTasks }),
    [canViewFinance, canViewTasks],
  )
  const homeScreen = isOdooHomeView(view)
  const navContext = findNavContext(view, groups)
  const [appMenuOpen, setAppMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  const closeAppMenu = useCallback(() => setAppMenuOpen(false), [])

  useEffect(() => {
    closeAppMenu()
  }, [view, closeAppMenu])

  const goHome = () => {
    closeAppMenu()
    onNavigate(odooHomeTargetView())
  }

  const go = (next: string) => {
    closeAppMenu()
    onNavigate(next)
    if (next === 'recipes') {
      window.history.replaceState({}, '', '#/recipes')
    }
  }

  const activeGroup = navContext?.group
  const subItems = activeGroup?.items ?? []

  return (
    <>
      <header
        ref={headerRef}
        className={`odoo-navbar${homeScreen ? ' odoo-navbar--home' : ' odoo-navbar--app'}${activeGroup ? ` odoo-navbar--${activeGroup.id}` : ''}`}
        aria-label="Navegación principal"
      >
        <div className="odoo-navbar__inner">
          <div className="odoo-navbar__start">
            <button
              type="button"
              className="odoo-navbar__app-menu-btn"
              title="Menú de aplicaciones"
              aria-label="Abrir menú de aplicaciones"
              aria-expanded={appMenuOpen}
              onClick={() => setAppMenuOpen(true)}
            >
              <AppMenuGlyph />
            </button>

            <button
              type="button"
              className="odoo-navbar__brand"
              onClick={goHome}
              title="Inicio"
              aria-label="Ir al inicio"
            >
              {PLATFORM_MODE ? (
                <BrandMark size="sm" className="odoo-navbar__brand-mark" />
              ) : user.companyName ? (
                <CompanyBrand
                  name={user.companyName}
                  size="sm"
                  className="odoo-navbar__company"
                />
              ) : (
                <BrandMark size="sm" className="odoo-navbar__brand-mark" />
              )}
            </button>

            {userNeedsCompanyPicker(user) ? (
              <button
                type="button"
                className="odoo-navbar__company-switch"
                title="Cambiar de empresa"
                aria-label="Cambiar de empresa"
                onClick={() => navigateToSelectCompany(false)}
              >
                <span className="odoo-navbar__company-switch-name">{user.companyName}</span>
                <ChevronDown className="odoo-navbar__company-switch-icon" strokeWidth={2} aria-hidden />
              </button>
            ) : null}

            {!homeScreen && navContext ? (
              <div className="odoo-navbar__app-title">
                <span className="odoo-navbar__app-title-icon" aria-hidden>
                  <AppLauncherIcon
                    view={groupIconView(navContext.group.id, navContext.item.view)}
                  />
                </span>
                <span className="odoo-navbar__app-title-text">{navContext.group.label}</span>
                {subItems.length > 1 ? (
                  <>
                    <span className="odoo-navbar__breadcrumb-sep" aria-hidden>
                      /
                    </span>
                    <span className="odoo-navbar__breadcrumb-current">
                      {navContext.item.label}
                    </span>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          {!homeScreen && subItems.length > 1 ? (
            <nav className="odoo-navbar__subnav" aria-label="Menú del módulo">
              <ul className="odoo-navbar__subnav-list">
                {subItems.map((item) => (
                  <li key={item.view}>
                    <button
                      type="button"
                      className={`odoo-navbar__subnav-link${view === item.view ? ' odoo-navbar__subnav-link--active' : ''}`}
                      aria-current={view === item.view ? 'page' : undefined}
                      onClick={() => go(item.view)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <div className="odoo-navbar__end">
            <HeaderSystray
              user={user}
              theme={theme}
              onToggleTheme={onToggleTheme}
              onLogout={onLogout}
              onSwitchCompany={onSwitchCompany}
              baseUrl={baseUrl}
              onOpenAssistant={onOpenAssistant}
              assistantOpen={assistantOpen}
              backendDown={backendDown}
              onRetryApi={onRetryApi}
            />
          </div>
        </div>
      </header>

      <AppMenuOverlay
        open={appMenuOpen}
        onClose={closeAppMenu}
        onOpenApp={go}
        canViewFinance={canViewFinance}
        canViewTasks={canViewTasks}
      />
    </>
  )
}
