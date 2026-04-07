import { useEffect, useMemo, useState } from 'react'
import {
  fetchActiveProductsCount,
  fetchInventoryInStockCount,
  fetchMe,
  getAccessToken,
  getApiBase,
  login,
  setAccessToken,
  type AuthUser,
} from './api'
import { InventoryManager } from './components/InventoryManager'
import { ProductsManager } from './components/ProductsManager'
import { CostsView } from './components/CostsView'
import { PurchaseLotsView } from './components/PurchaseLotsView'
import { RecipesView } from './components/RecipesView'
import { SalesManager } from './components/SalesManager'
import { TableExplorer } from './components/TableExplorer'
import './App.css'

type View =
  | 'products'
  | 'recipes'
  | 'inventory'
  | 'sales'
  | 'purchases'
  | 'costs'
  | 'explorer'

const VIEW_HASH: Record<View, string> = {
  products: '#/products',
  recipes: '#/recipes',
  inventory: '#/inventory',
  sales: '#/sales',
  purchases: '#/purchases',
  costs: '#/costs',
  explorer: '#/explorer',
}

function getViewFromHash(): View | null {
  const raw = (window.location.hash ?? '').replace(/^#/, '') // "recipes/..."
  const parts = raw.split('/').filter(Boolean)
  const first = parts[0]
  if (first === 'products') return 'products'
  if (first === 'recipes') return 'recipes'
  if (first === 'inventory') return 'inventory'
  if (first === 'sales') return 'sales'
  if (first === 'purchases') return 'purchases'
  if (first === 'costs') return 'costs'
  if (first === 'explorer') return 'explorer'
  return null
}

export default function App() {
  const [baseUrl] = useState(() => getApiBase())
  const [view, setView] = useState<View>(() => {
    try {
      return getViewFromHash() ?? 'products'
    } catch {
      return 'products'
    }
  })
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const t = window.localStorage.getItem('arandano_theme')
      return t === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })

  const [activeProducts, setActiveProducts] = useState<number | null>(null)
  const [inStockInventory, setInStockInventory] = useState<number | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      window.localStorage.setItem('arandano_theme', theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  useEffect(() => {
    if (!getAccessToken()) return
    let cancelled = false
    fetchMe(baseUrl)
      .then((u) => {
        if (!cancelled) {
          setUser(u)
          setAuthError(null)
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setUser(null)
          setAuthError(e.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [baseUrl])

  const showCounts = useMemo(() => view === 'products' || view === 'inventory', [view])

  useEffect(() => {
    if (!showCounts) return
    let cancelled = false
    ;(async () => {
      try {
        const [p, inv] = await Promise.all([
          fetchActiveProductsCount(baseUrl),
          fetchInventoryInStockCount(baseUrl),
        ])
        if (!cancelled) {
          setActiveProducts(p)
          setInStockInventory(inv)
        }
      } catch {
        if (!cancelled) {
          setActiveProducts(null)
          setInStockInventory(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [baseUrl, showCounts])

  // Sync view from URL hash.
  useEffect(() => {
    const onHash = () => {
      const v = getViewFromHash()
      if (v) setView(v)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Sync URL hash from view (without clobbering the recipeId deep link).
  useEffect(() => {
    const desired = VIEW_HASH[view]
    const current = window.location.hash ?? ''
    if (view === 'recipes' && current.startsWith('#/recipes')) return
    if (current === desired) return
    window.history.replaceState({}, '', desired)
  }, [view])

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-brand">
          <img
            className="app-logo"
            src="/logo.png"
            width={56}
            height={56}
            alt=""
            decoding="async"
          />
          <h1 className="app-title">Arándano Café Bar</h1>
        </div>

        <div className="app-header-tools">
          <div className="header-auth">
            {user ? (
              <>
                <span className="muted small" title={user.email}>
                  {user.name} · {user.role}
                </span>
                <button
                  type="button"
                  className="btn-secondary btn-compact"
                  onClick={() => {
                    setAccessToken(null)
                    setUser(null)
                    setAuthError(null)
                  }}
                >
                  Salir
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn-secondary btn-compact"
                onClick={() => {
                  const email = window.prompt('Email')
                  if (!email) return
                  const password = window.prompt('Password')
                  if (!password) return
                  setAuthError(null)
                  ;(async () => {
                    try {
                      await login(baseUrl, { email, password })
                      const me = await fetchMe(baseUrl)
                      setUser(me)
                    } catch (e) {
                      setAuthError((e as Error).message)
                    }
                  })()
                }}
              >
                Iniciar sesión
              </button>
            )}
          </div>

          <label className="theme-switch" title="Cambiar tema">
            <span className="muted small">Tema</span>
            <button
              type="button"
              className="theme-switch-btn"
              aria-pressed={theme === 'light'}
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? 'Oscuro' : 'Claro'}
            </button>
          </label>

          <div className="header-metrics" aria-label="Indicadores">
            <span className="metric-pill" title="Productos activos (products.active=true)">
              <span className="muted small">Productos activos</span>
              <strong>{activeProducts ?? '—'}</strong>
            </span>
            <span
              className="metric-pill"
              title="Ítems de inventario con cantidad > 0"
            >
              <span className="muted small">En stock</span>
              <strong>{inStockInventory ?? '—'}</strong>
            </span>
          </div>
        </div>
      </header>

      {authError && (
        <div className="app-banner" role="status">
          <span className="banner-warn">Auth: {authError}</span>
        </div>
      )}

      <nav className="app-nav" aria-label="Secciones">
        <button
          type="button"
          className={view === 'products' ? 'active' : ''}
          onClick={() => setView('products')}
        >
          Productos
        </button>
        <button
          type="button"
          className={view === 'recipes' ? 'active' : ''}
          onClick={() => {
            setView('recipes')
            window.history.replaceState({}, '', '#/recipes')
          }}
        >
          Recetas
        </button>
        <button
          type="button"
          className={view === 'inventory' ? 'active' : ''}
          onClick={() => setView('inventory')}
        >
          Inventario
        </button>
        <button
          type="button"
          className={view === 'sales' ? 'active' : ''}
          onClick={() => setView('sales')}
        >
          Ventas
        </button>
        <button
          type="button"
          className={view === 'purchases' ? 'active' : ''}
          onClick={() => setView('purchases')}
        >
          Compras
        </button>
        <button
          type="button"
          className={view === 'costs' ? 'active' : ''}
          onClick={() => setView('costs')}
        >
          Costos
        </button>
        <button
          type="button"
          className={view === 'explorer' ? 'active' : ''}
          onClick={() => setView('explorer')}
        >
          Explorador
        </button>
      </nav>

      <main className="app-main">
        {view === 'products' && <ProductsManager baseUrl={baseUrl} />}
        {view === 'recipes' && <RecipesView baseUrl={baseUrl} />}
        {view === 'inventory' && <InventoryManager baseUrl={baseUrl} />}
        {view === 'sales' && <SalesManager baseUrl={baseUrl} />}
        {view === 'purchases' && <PurchaseLotsView baseUrl={baseUrl} />}
        {view === 'costs' && <CostsView baseUrl={baseUrl} />}
        {view === 'explorer' && <TableExplorer baseUrl={baseUrl} />}
      </main>
    </div>
  )
}
