import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createProduct,
  deleteProduct,
  fetchInventoryOptions,
  fetchProduct,
  fetchProductCategories,
  fetchProducts,
  fetchProductsCatalogSummary,
  parseProductRecipeFull,
  updateProduct,
  type CategoryRef,
  type InventoryOption,
  type ProductListSort,
  type ProductRow,
} from '../api'
import { ProductSummaryCard } from './ProductSummaryCard'
import { RecipeEditor } from './RecipeEditor'

const PRODUCT_TYPES = ['bebida', 'comida', 'combo'] as const
const FETCH_PAGE_SIZE = 40
const MAX_PRODUCT_PAGES = 25

function priceToNumber(p: string | number): number {
  if (typeof p === 'number') return p
  const n = parseFloat(String(p).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function formatCOP(value: string | number): string {
  const n = priceToNumber(value)
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

type Draft = {
  name: string
  price: string
  categoryId: string
  type: string
  description: string
  size: string
  imageUrl: string
  active: boolean
}

function emptyDraft(categories: CategoryRef[]): Draft {
  return {
    name: '',
    price: '',
    categoryId: categories[0]?.id ?? '',
    type: PRODUCT_TYPES[0],
    description: '',
    size: '',
    imageUrl: '',
    active: true,
  }
}

function sortProductRows(rows: ProductRow[], sort: ProductListSort): ProductRow[] {
  const copy = [...rows]
  if (sort === 'name') {
    copy.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  } else if (sort === 'price_asc') {
    copy.sort((a, b) => priceToNumber(a.price) - priceToNumber(b.price))
  } else {
    copy.sort((a, b) => priceToNumber(b.price) - priceToNumber(a.price))
  }
  return copy
}

function rowToDraft(p: ProductRow): Draft {
  return {
    name: p.name,
    price: String(priceToNumber(p.price)),
    categoryId: p.categoryId,
    type: p.type,
    description: p.description ?? '',
    size: p.size ?? '',
    imageUrl: p.imageUrl ?? '',
    active: p.active,
  }
}

export function ProductsManager({ baseUrl }: { baseUrl: string }) {
  const [categories, setCategories] = useState<CategoryRef[]>([])
  const [catError, setCatError] = useState<string | null>(null)

  const [allProducts, setAllProducts] = useState<ProductRow[]>([])
  const [catalogTruncated, setCatalogTruncated] = useState(false)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [filterActive, setFilterActive] = useState<
    'all' | 'active' | 'inactive'
  >('all')
  const [filterType, setFilterType] = useState('')
  const [sortBy, setSortBy] = useState<ProductListSort>('name')
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [catalogSummary, setCatalogSummary] = useState<Awaited<
    ReturnType<typeof fetchProductsCatalogSummary>
  > | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [detailRecipe, setDetailRecipe] = useState<unknown>(null)
  const [inventoryOptions, setInventoryOptions] = useState<InventoryOption[]>(
    [],
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const prefetchedProductIds = useRef<Set<string>>(new Set())

  const openRecipePage = useCallback((productId: string) => {
    window.location.hash = `#/recipes/${productId}`
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search), 320)
    return () => window.clearTimeout(t)
  }, [search])

  const productListQuery = useMemo(
    () => ({
      search: searchDebounced,
      active:
        filterActive === 'all'
          ? undefined
          : filterActive === 'active'
            ? true
            : false,
      type: filterType || undefined,
      sort: sortBy,
    }),
    [searchDebounced, filterActive, filterType, sortBy],
  )

  const loadAllProducts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setListError(null)
    setCatalogTruncated(false)
    try {
      const acc: ProductRow[] = []
      let p = 1
      let truncated = false
      while (p <= MAX_PRODUCT_PAGES) {
        const res = await fetchProducts(baseUrl, {
          page: p,
          limit: FETCH_PAGE_SIZE,
          signal,
          ...productListQuery,
        })
        acc.push(...res.data)
        if (!res.meta.hasNextPage) break
        if (p === MAX_PRODUCT_PAGES) {
          truncated = true
          break
        }
        p++
      }
      if (!signal?.aborted) {
        setAllProducts(acc)
        setCatalogTruncated(truncated)
      }
    } catch (e) {
      if (signal?.aborted) return
      setListError((e as Error).message)
      setAllProducts([])
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [baseUrl, productListQuery])

  const productSections = useMemo(() => {
    const buckets = new Map<string, ProductRow[]>()
    for (const c of categories) buckets.set(c.id, [])
    const orphans: ProductRow[] = []
    const known = new Set(categories.map((c) => c.id))
    for (const row of allProducts) {
      if (known.has(row.categoryId)) {
        buckets.get(row.categoryId)!.push(row)
      } else {
        orphans.push(row)
      }
    }
    const sections = categories.map((c) => ({
      id: c.id,
      name: c.name,
      products: sortProductRows(buckets.get(c.id) ?? [], sortBy),
    }))
    if (orphans.length > 0) {
      sections.push({
        id: '_other',
        name: 'Otras categorías',
        products: sortProductRows(orphans, sortBy),
      })
    }
    return sections
  }, [allProducts, categories, sortBy])

  useEffect(() => {
    let cancelled = false
    fetchProductCategories(baseUrl)
      .then((c) => {
        if (!cancelled) {
          setCategories(c.sort((a, b) => a.name.localeCompare(b.name, 'es')))
          setCatError(null)
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setCatError(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [baseUrl])

  useEffect(() => {
    let cancelled = false
    // Cargar insumos solo cuando se abre edición de un producto con receta.
    if (!selectedId) {
      setInventoryOptions([])
      return () => {
        cancelled = true
      }
    }
    fetchInventoryOptions(baseUrl)
      .then((inv) => {
        if (!cancelled) setInventoryOptions(inv)
      })
      .catch(() => {
        if (!cancelled) setInventoryOptions([])
      })
    return () => {
      cancelled = true
    }
  }, [baseUrl, selectedId])

  const refreshCatalogSummary = useCallback(() => {
    setSummaryLoading(true)
    fetchProductsCatalogSummary(baseUrl)
      .then((s) => {
        setCatalogSummary(s)
      })
      .catch(() => {
        setCatalogSummary(null)
      })
      .finally(() => {
        setSummaryLoading(false)
      })
  }, [baseUrl])

  useEffect(() => {
    refreshCatalogSummary()
  }, [refreshCatalogSummary])

  useEffect(() => {
    const controller = new AbortController()
    void loadAllProducts(controller.signal)
    return () => controller.abort()
  }, [loadAllProducts])

  const prefetchProductDetail = useCallback(
    (id: string) => {
      if (prefetchedProductIds.current.has(id)) return
      prefetchedProductIds.current.add(id)
      fetchProduct(baseUrl, id).catch(() => {
        prefetchedProductIds.current.delete(id)
      })
    },
    [baseUrl],
  )

  const openCreate = useCallback(() => {
    setCreating(true)
    setSelectedId(null)
    setDetailRecipe(null)
    setDraft(emptyDraft(categories))
    setSaveError(null)
  }, [categories])

  const openEdit = useCallback(
    async (id: string) => {
      setCreating(false)
      setSelectedId(id)
      setSaveError(null)
      setDetailRecipe(null)
      try {
        const p = await fetchProduct(baseUrl, id)
        setDraft(rowToDraft(p))
        setDetailRecipe('recipe' in p ? p.recipe : null)
      } catch (e) {
        setSaveError((e as Error).message)
        setDraft(null)
      }
    },
    [baseUrl],
  )

  const closePanel = useCallback(() => {
    setSelectedId(null)
    setCreating(false)
    setDraft(null)
    setDetailRecipe(null)
    setSaveError(null)
  }, [])

  const panelOpen = creating || selectedId !== null

  useEffect(() => {
    if (!panelOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closePanel, panelOpen])

  useEffect(() => {
    if (!panelOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [panelOpen])

  const save = useCallback(async () => {
    if (!draft) return
    const price = parseFloat(draft.price.replace(',', '.'))
    if (!draft.name.trim()) {
      setSaveError('El nombre es obligatorio.')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setSaveError('Precio inválido.')
      return
    }
    if (!draft.categoryId) {
      setSaveError('Elige una categoría.')
      return
    }
    if (!draft.type.trim()) {
      setSaveError('El tipo de producto es obligatorio.')
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      let savedRow: ProductRow | null = null
      if (creating) {
        savedRow = await createProduct(baseUrl, {
          name: draft.name.trim(),
          price,
          categoryId: draft.categoryId,
          type: draft.type.trim(),
          description: draft.description.trim() || undefined,
          size: draft.size.trim() || undefined,
          imageUrl: draft.imageUrl.trim() || undefined,
          active: draft.active,
        })
      } else if (selectedId) {
        savedRow = await updateProduct(baseUrl, selectedId, {
          name: draft.name.trim(),
          price,
          categoryId: draft.categoryId,
          type: draft.type.trim(),
          description: draft.description,
          size: draft.size.trim() || undefined,
          imageUrl: draft.imageUrl.trim() || undefined,
          active: draft.active,
        })
      }
      if (savedRow) {
        setAllProducts((prev) => {
          if (creating) return [savedRow!, ...prev]
          return prev.map((p) => (p.id === savedRow!.id ? savedRow! : p))
        })
      }
      closePanel()
      refreshCatalogSummary()
    } catch (e) {
      setSaveError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }, [
    baseUrl,
    creating,
    closePanel,
    draft,
    refreshCatalogSummary,
    selectedId,
  ])

  const remove = useCallback(async () => {
    if (!selectedId) return
    if (!window.confirm('¿Archivar este producto? Dejará de mostrarse en listados.'))
      return
    setSaving(true)
    setSaveError(null)
    try {
      await deleteProduct(baseUrl, selectedId)
      setAllProducts((prev) => prev.filter((p) => p.id !== selectedId))
      closePanel()
      refreshCatalogSummary()
    } catch (e) {
      setSaveError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }, [baseUrl, closePanel, refreshCatalogSummary, selectedId])

  const parsedRecipe = useMemo(
    () => parseProductRecipeFull(detailRecipe),
    [detailRecipe],
  )

  return (
    <div className="products-layout">
      <div className="products-list-pane">
        <div className="products-page-head">
          <div className="page-intro products-page-intro">
            <h2 className="page-title">Productos</h2>
            <p className="muted page-subtitle">
              Catálogo para carta y ventas. Activa o desactiva ítems sin borrarlos.
            </p>
          </div>
          <div className="products-toolbar-actions products-toolbar-actions--top">
            <button type="button" className="btn-primary" onClick={openCreate}>
              Nuevo producto
            </button>
          </div>
        </div>

        <ProductSummaryCard
          summary={catalogSummary}
          categories={categories}
          loading={summaryLoading}
        />

        <div className="products-toolbar-row app-toolbar-zone">
          <div className="inventory-filter-bar">
            <div className="inventory-filter-bar__controls" role="search">
              <label className="inventory-filter">
                <span className="inventory-filter__label">Buscar</span>
                <input
                  className="inventory-filter__input"
                  type="search"
                  placeholder="Nombre…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Buscar productos"
                />
              </label>
              <label className="inventory-filter">
                <span className="inventory-filter__label">Estado</span>
                <select
                  className="inventory-filter__input"
                  value={filterActive}
                  onChange={(e) =>
                    setFilterActive(
                      e.target.value as 'all' | 'active' | 'inactive',
                    )
                  }
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </label>
              <label className="inventory-filter">
                <span className="inventory-filter__label">Tipo</span>
                <select
                  className="inventory-filter__input"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Todos</option>
                  {PRODUCT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="inventory-filter">
                <span className="inventory-filter__label">Orden</span>
                <select
                  className="inventory-filter__input"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as ProductListSort)
                  }
                >
                  <option value="name">Nombre (A-Z)</option>
                  <option value="price_asc">Precio ↑</option>
                  <option value="price_desc">Precio ↓</option>
                </select>
              </label>
            </div>
            <div className="inventory-filter-bar__actions">
              <button
                type="button"
                className="btn-secondary btn-compact"
                onClick={() => {
                  setSearch('')
                  setFilterActive('all')
                  setFilterType('')
                  setSortBy('name')
                }}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {catError && (
          <p className="banner-warn" role="status">
            No se pudieron cargar categorías: {catError}
          </p>
        )}
        {listError && (
          <p className="error" role="alert">
            {listError}
          </p>
        )}
        {loading && <p className="muted">Cargando productos…</p>}

        {catalogTruncated && !listError && (
          <p className="banner-warn" role="status">
            Se alcanzó el límite de carga ({MAX_PRODUCT_PAGES * FETCH_PAGE_SIZE} ítems). Afina
            búsqueda o filtros para ver el resto.
          </p>
        )}

        <div className="catalog-by-category" aria-label="Productos por categoría">
          {productSections.map((section) =>
            section.products.length === 0 ? null : (
              <details key={section.id} className="catalog-category-block">
                <summary className="catalog-category-block__summary">
                  <span className="catalog-category-block__summary-main">
                    <span className="catalog-category-block__chevron" aria-hidden />
                    <h3 className="catalog-category-block__title">{section.name}</h3>
                  </span>
                  <span className="muted small">
                    {section.products.length} producto
                    {section.products.length !== 1 ? 's' : ''}
                  </span>
                </summary>
                <div className="catalog-category-block__body">
                  <div className="data-table-wrap data-table-elevated">
                  <table className="data-table data-table-striped">
                    <thead>
                      <tr>
                        <th className="col-thumb" aria-hidden />
                        <th>Producto</th>
                        <th>Tipo</th>
                        <th className="num">Precio</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.products.map((p) => (
                        <tr
                          key={p.id}
                          className={selectedId === p.id ? 'row-active' : ''}
                        >
                          <td className="col-thumb">
                            {p.imageUrl ? (
                              <div className="product-table-thumb">
                                <img src={p.imageUrl} alt="" loading="lazy" />
                              </div>
                            ) : null}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="table-link"
                              onMouseEnter={() => prefetchProductDetail(p.id)}
                              onFocus={() => prefetchProductDetail(p.id)}
                              onClick={() => void openEdit(p.id)}
                            >
                              {p.name}
                            </button>
                          </td>
                          <td>
                            <span className="pill">{p.type}</span>
                          </td>
                          <td className="num mono">{formatCOP(p.price)}</td>
                          <td>
                            {p.active ? (
                              <span className="badge badge-ok">Activo</span>
                            ) : (
                              <span className="badge badge-muted">Inactivo</span>
                            )}
                          </td>
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

        {!loading && allProducts.length === 0 && !listError && (
          <p className="empty-hint">No hay productos. Crea uno o ajusta la búsqueda.</p>
        )}
      </div>

      {panelOpen && draft && (
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
            aria-label="Editor de producto"
          >
            <header className="modal-head">
              <div className="modal-head-title">
                <h2>{creating ? 'Nuevo producto' : 'Editar producto'}</h2>
                {!creating && (
                  <p className="muted small modal-subtitle">
                    {draft.name?.trim() ? draft.name.trim() : '—'}
                  </p>
                )}
              </div>
              <div className="modal-head-actions">
                <button
                  type="button"
                  className="btn-ghost icon-close"
                  onClick={closePanel}
                  aria-label="Cerrar"
                />
              </div>
            </header>

            <div className="modal-body">
            {draft.imageUrl ? (
              <div className="editor-preview-img">
                <img src={draft.imageUrl} alt="Vista previa" />
              </div>
            ) : null}

            <label className="field">
              <span>Nombre</span>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Precio (COP)</span>
              <input
                inputMode="decimal"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Categoría</span>
              <select
                value={draft.categoryId}
                onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
              >
                {categories.length === 0 && <option value="">— Sin categorías —</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Tipo</span>
              <input
                list="product-type-suggestions"
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                placeholder="bebida, comida, combo…"
              />
              <datalist id="product-type-suggestions">
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </label>

            <label className="field">
              <span>Descripción</span>
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Tamaño / presentación</span>
              <input
                value={draft.size}
                onChange={(e) => setDraft({ ...draft, size: e.target.value })}
                placeholder="Opcional"
              />
            </label>

            <label className="field">
              <span>URL de imagen</span>
              <input
                type="url"
                value={draft.imageUrl}
                onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                placeholder="https://…"
              />
            </label>

            <label className="field checkbox-field">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              <span>Producto activo (visible en ventas)</span>
            </label>

            {!creating && selectedId && (
              <div className="recipe-embed">
                <div className="recipe-embed-tools">
                  <button
                    type="button"
                    className="btn-secondary btn-compact recipe-embed-open-recipe"
                    onClick={() => openRecipePage(selectedId)}
                    title="Abrir la receta en una ruta dedicada"
                  >
                    <span>Abrir receta</span>
                    <span className="table-link-icon-external" aria-hidden />
                  </button>
                </div>
                <RecipeEditor
                  baseUrl={baseUrl}
                  productId={selectedId}
                  recipe={parsedRecipe}
                  inventory={inventoryOptions}
                  onRecipeUpdated={(r) => setDetailRecipe(r)}
                />
              </div>
            )}

            {saveError && (
              <p className="error" role="alert">
                {saveError}
              </p>
            )}

            <div className="editor-actions">
              {!creating && (
                <button
                  type="button"
                  className="btn-danger"
                  disabled={saving}
                  onClick={() => void remove()}
                >
                  Archivar
                </button>
              )}
              <button
                type="button"
                className="btn-primary"
                disabled={saving || categories.length === 0}
                onClick={() => void save()}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
