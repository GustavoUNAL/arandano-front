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

function paginationDots(current: number, total: number): number[] {
  if (total <= 1) return []
  const out: number[] = []
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let p = start; p <= end; p++) out.push(p)
  if (!out.includes(1)) out.unshift(1)
  if (!out.includes(total)) out.push(total)
  return out
}

export function RecipesView({ baseUrl }: { baseUrl: string }) {
  const PAGE_SIZE = 24
  const [categories, setCategories] = useState<CategoryRef[]>([])
  const [catalog, setCatalog] = useState<RecipeCatalogEntry[]>([])
  const [inventory, setInventory] = useState<InventoryOption[]>([])
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [page, setPage] = useState(1)
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

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search), 320)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [searchDebounced])

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
    fetchRecipeCatalog(baseUrl)
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
  }, [baseUrl])

  const filteredCatalog = useMemo(() => {
    const q = searchDebounced.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter((r) => r.productName.toLowerCase().includes(q))
  }, [catalog, searchDebounced])

  const totalPages = Math.max(1, Math.ceil(filteredCatalog.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const pageDots = paginationDots(pageSafe, totalPages)
  const pageRows = useMemo(
    () =>
      filteredCatalog.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [filteredCatalog, pageSafe, PAGE_SIZE],
  )

  const recipeSections = useMemo(() => {
    const known = new Set(categories.map((c) => c.id))
    const buckets = new Map<string, RecipeCatalogEntry[]>()
    for (const c of categories) buckets.set(c.id, [])
    const orphans: RecipeCatalogEntry[] = []
    for (const r of pageRows) {
      const cid = r.categoryId ?? ''
      if (cid && known.has(cid)) {
        buckets.get(cid)!.push(r)
      } else {
        orphans.push(r)
      }
    }
    const sortRows = (rows: RecipeCatalogEntry[]) =>
      [...rows].sort((a, b) =>
        a.productName.localeCompare(b.productName, 'es'),
      )
    const sections = categories.map((c) => ({
      id: c.id,
      name: c.name,
      rows: sortRows(buckets.get(c.id) ?? []),
    }))
    if (orphans.length > 0) {
      sections.push({
        id: '_other',
        name: 'Otras categorías',
        rows: sortRows(orphans),
      })
    }
    return sections
  }, [categories, pageRows])

  const reloadCatalog = useCallback(async () => {
    try {
      const list = await fetchRecipeCatalog(baseUrl)
      setCatalog(list)
      setLoadError(null)
    } catch (e) {
      setLoadError((e as Error).message)
    }
  }, [baseUrl])

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
        title: 'Productos con ficha técnica en el catálogo',
      },
      {
        label: 'Visibles',
        value: filteredCatalog.length,
        title: 'Tras filtrar por búsqueda (todas las páginas)',
      },
      {
        label: 'En página',
        value: pageRows.length,
        title: `Página ${pageSafe} de ${totalPages}`,
      },
      {
        label: 'Insumos',
        value: inventory.length,
        title: 'Ítems de inventario disponibles para enlazar',
      },
    ],
    [catalog.length, filteredCatalog.length, inventory.length, pageRows.length, pageSafe, totalPages],
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

        <div className="inventory-filter-bar app-toolbar-zone">
          <div className="inventory-filter-bar__controls" role="search">
            <label className="inventory-filter">
              <span className="inventory-filter__label">Buscar</span>
              <input
                className="inventory-filter__input"
                type="search"
                placeholder="Receta por producto…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar recetas"
              />
            </label>
          </div>
          <div className="inventory-filter-bar__actions">
            <button
              type="button"
              className="btn-secondary btn-compact"
              onClick={() => {
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
          <div className="catalog-by-category" aria-label="Recetas por categoría">
            <div className="pagination-bar">
              <span className="muted">
                Página {pageSafe} de {totalPages} · {filteredCatalog.length} receta
                {filteredCatalog.length !== 1 ? 's' : ''}
              </span>
              {pageDots.length > 1 && (
                <div className="pager-dots" aria-hidden>
                  {pageDots.map((p) => (
                    <span
                      key={p}
                      className={`pager-dot${p === pageSafe ? ' is-active' : ''}`}
                    />
                  ))}
                </div>
              )}
              <div className="pager">
                <button
                  type="button"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                </button>
              </div>
            </div>
            {recipeSections.map((section) =>
              section.rows.length === 0 ? null : (
                <details key={section.id} className="catalog-category-block">
                  <summary className="catalog-category-block__summary">
                    <span className="catalog-category-block__summary-main">
                      <span className="catalog-category-block__chevron" aria-hidden />
                      <h3 className="catalog-category-block__title">{section.name}</h3>
                    </span>
                    <span className="muted small">
                      {section.rows.length} receta
                      {section.rows.length !== 1 ? 's' : ''}
                    </span>
                  </summary>
                  <div className="catalog-category-block__body">
                    <div className="data-table-wrap data-table-elevated">
                    <table className="data-table data-table-striped">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Tipo</th>
                          <th className="num">Rendimiento</th>
                          <th className="num">Insumos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.map((row) => (
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
                  </div>
                </details>
              ),
            )}
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
                    void reloadCatalog()
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
