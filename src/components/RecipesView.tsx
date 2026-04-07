import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchInventoryOptions,
  fetchProduct,
  fetchProductCategories,
  fetchRecipeCatalog,
  parseProductRecipeFull,
  type CategoryRef,
  type InventoryOption,
  type ProductRecipeFull,
  type RecipeCatalogEntry,
} from '../api'
import { RecipeEditor } from './RecipeEditor'
import { SectionSummaryBar } from './SectionSummaryBar'

function getRecipeIdFromHash(): string | null {
  const raw = (window.location.hash ?? '').replace(/^#/, '') // "recipes/..."
  const parts = raw.split('/').filter(Boolean)
  if (parts[0] !== 'recipes') return null
  return parts[1] ?? null
}

function pushRouteToRecipe(productId: string): void {
  window.history.pushState({}, '', `#/recipes/${productId}`)
}

function replaceRouteToRecipesList(): void {
  window.history.replaceState({}, '', '#/recipes')
}

export function RecipesView({ baseUrl }: { baseUrl: string }) {
  const [categories, setCategories] = useState<CategoryRef[]>([])
  const [catalog, setCatalog] = useState<RecipeCatalogEntry[]>([])
  const [inventory, setInventory] = useState<InventoryOption[]>([])
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingList, setLoadingList] = useState(true)

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try {
      return getRecipeIdFromHash()
    } catch {
      return null
    }
  })
  const [selectedName, setSelectedName] = useState('')
  const [detailRecipe, setDetailRecipe] = useState<ProductRecipeFull | null>(
    null,
  )
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const refreshCatalog = useCallback(async () => {
    const list = await fetchRecipeCatalog(
      baseUrl,
      filterCategoryId || undefined,
    )
    setCatalog(list)
  }, [baseUrl, filterCategoryId])

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search), 320)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false
    fetchProductCategories(baseUrl)
      .then((c) => {
        if (!cancelled) {
          setCategories(c.sort((a, b) => a.name.localeCompare(b.name, 'es')))
        }
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
    fetchInventoryOptions(baseUrl)
      .then((inv) => {
        if (!cancelled) setInventory(inv)
      })
      .catch(() => {
        if (!cancelled) setInventory([])
      })
    return () => {
      cancelled = true
    }
  }, [baseUrl])

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return
      setLoadingList(true)
      setLoadError(null)
    })
    fetchRecipeCatalog(baseUrl, filterCategoryId || undefined)
      .then((cat) => {
        if (!cancelled) {
          setCatalog(cat)
          setLoadError(null)
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false)
      })
    return () => {
      cancelled = true
    }
  }, [baseUrl, filterCategoryId])

  const filteredCatalog = useMemo(() => {
    const q = searchDebounced.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter((r) => r.productName.toLowerCase().includes(q))
  }, [catalog, searchDebounced])

  const openRow = useCallback(
    (row: RecipeCatalogEntry) => {
      setSelectedId(row.productId)
      setSelectedName(row.productName)
      setDetailError(null)
      setDetailLoading(true)
      setDetailRecipe(null)
      pushRouteToRecipe(row.productId)
    },
    [],
  )

  const closePanel = useCallback(() => {
    replaceRouteToRecipesList()
    setSelectedId(null)
    setSelectedName('')
    setDetailRecipe(null)
    setDetailError(null)
    setDetailLoading(false)
  }, [])

  // Sync selection with URL hash (back/forward).
  useEffect(() => {
    const onHash = () => {
      const id = getRecipeIdFromHash()
      setSelectedId(id)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Load recipe detail when selectedId comes from deep link or navigation.
  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return
      setDetailLoading(true)
      setDetailError(null)
      setDetailRecipe(null)
    })
    fetchProduct(baseUrl, selectedId)
      .then((p) => {
        if (cancelled) return
        setSelectedName(p.name)
        setDetailRecipe(parseProductRecipeFull(p.recipe) ?? null)
      })
      .catch((e: Error) => {
        if (cancelled) return
        setDetailError(e.message)
      })
      .finally(() => {
        if (cancelled) return
        setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [baseUrl, selectedId])

  const handleBack = useCallback(() => {
    if (window.history.length <= 1) {
      closePanel()
      return
    }
    window.history.back()
  }, [closePanel])

  useEffect(() => {
    if (!selectedId) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closePanel, selectedId])

  useEffect(() => {
    if (!selectedId) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [selectedId])

  const recipeSummaryItems = useMemo(
    () => [
      {
        label: 'Recetas',
        value: catalog.length,
        title: 'Productos con receta en la categoría seleccionada',
      },
      {
        label: 'Visibles',
        value: filteredCatalog.length,
        title: 'Tras filtrar por búsqueda',
      },
      {
        label: 'Insumos',
        value: inventory.length,
        title: 'Ítems de inventario disponibles para enlazar',
      },
    ],
    [catalog.length, filteredCatalog.length, inventory.length],
  )

  return (
    <div className="recipes-layout">
      <div className="recipes-catalog-pane">
        <div className="recipes-catalog-head">
          <div>
            <h2 className="pane-title">Recetas</h2>
            <p className="muted">
              Productos con ficha técnica. Elige uno para ver y editar insumos.
            </p>
          </div>
        </div>

        <div className="data-toolbar data-toolbar--compact">
          <div className="search-field">
            <span className="search-icon" aria-hidden />
            <input
              type="search"
              placeholder="Buscar receta por producto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar recetas"
            />
          </div>
          <div className="toolbar-filters toolbar-filters--wrap">
            <label className="filter-field">
              <span>Categoría de producto</span>
              <select
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
              >
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn-secondary btn-compact"
              onClick={() => {
                setFilterCategoryId('')
                setSearch('')
              }}
            >
              Limpiar
            </button>
          </div>
        </div>

        {!loadingList && (
          <SectionSummaryBar section="recipes" items={recipeSummaryItems} />
        )}

        {loadError && (
          <p className="error" role="alert">
            {loadError}
          </p>
        )}
        {loadingList && <p className="muted">Cargando…</p>}

        {!loadingList && catalog.length === 0 && !loadError && (
          <p className="empty-hint">
            No hay recetas en la base. Puedes crearlas al editar un producto.
          </p>
        )}

        {!loadingList && filteredCatalog.length > 0 && (
          <div className="data-table-wrap data-table-elevated">
            <table className="data-table data-table-striped">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th className="num">Rendimiento</th>
                  <th className="num">Insumos</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalog.map((row) => (
                  <tr
                    key={row.productId}
                    className={
                      selectedId === row.productId ? 'row-active' : ''
                    }
                  >
                    <td>
                      <button
                        type="button"
                        className="table-link"
                        onClick={() => void openRow(row)}
                      >
                        {row.productName}
                      </button>
                    </td>
                    <td className="muted">{row.categoryName ?? '—'}</td>
                    <td>
                      <span className="pill">{row.productType}</span>
                    </td>
                    <td className="num mono">{row.recipeYield}</td>
                    <td className="num">{row.ingredientCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closePanel()
          }}
        >
          <section
            className="modal modal--fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label="Editor de receta"
          >
            <header className="modal-head">
              <div className="modal-head-title">
                <h2>Receta</h2>
                <p className="muted small modal-subtitle">{selectedName}</p>
              </div>
              <div className="modal-head-actions">
                <button
                  type="button"
                  className="btn-secondary btn-compact"
                  onClick={handleBack}
                >
                  Volver
                </button>
                <button
                  type="button"
                  className="btn-ghost icon-close"
                  onClick={closePanel}
                  aria-label="Cerrar"
                />
              </div>
            </header>

            <div className="modal-body">
              {detailLoading && <p className="muted">Cargando receta…</p>}
              {detailError && (
                <p className="error" role="alert">
                  {detailError}
                </p>
              )}
              {!detailLoading && !detailError && (
                <RecipeEditor
                  baseUrl={baseUrl}
                  productId={selectedId}
                  recipe={detailRecipe}
                  inventory={inventory}
                  onRecipeUpdated={(r) => {
                    setDetailRecipe(r)
                    void refreshCatalog()
                  }}
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
