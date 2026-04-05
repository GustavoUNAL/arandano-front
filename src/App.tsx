import { useState } from 'react'
import { getApiBase } from './api'
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

export default function App() {
  const [baseUrl] = useState(() => getApiBase())
  const [view, setView] = useState<View>('products')

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
      </header>

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
          onClick={() => setView('recipes')}
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
