import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createProduct,
  deleteProduct,
  fetchInventoryOptions,
  fetchProduct,
  fetchProductCategories,
  fetchProducts,
  fetchProductsCatalogStats,
  parseProductRecipeFull,
  updateProduct,
  type CategoryRef,
  type InventoryOption,
  type ProductListSort,
  type ProductRow,
} from '../api'
import { RecipeEditor } from './RecipeEditor'
import { SectionSummaryBar, type SectionSummaryItem } from './SectionSummaryBar'

const PRODUCT_TYPES = ['bebida', 'comida', 'combo'] as const
const LIMIT = 20
const VIEW_STORAGE_KEY = 'arandano_products_view'

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

  const [list, setList] = useState<ProductRow[]>([])
  const [meta, setMeta] = useState<{
    page: number
    limit: number
    total: number
    hasNextPage: boolean
  } | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [filterActive, setFilterActive] = useState<
    'all' | 'active' | 'inactive'
  >('all')
  const [filterType, setFilterType] = useState('')
  const [sortBy, setSortBy] = useState<ProductListSort>('name')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    try {
      const v = localStorage.getItem(VIEW_STORAGE_KEY)
      if (v === 'table' || v === 'cards') return v
    } catch {
      /* ignore */
    }
    return 'cards'
  })
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [catalogStats, setCatalogStats] = useState<{
    active: number
    inactive: number
    total: number
  } | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [detailRecipe, setDetailRecipe] = useState<unknown>(null)
  const [inventoryOptions, setInventoryOptions] = useState<InventoryOption[]>(
    [],
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const openRecipePage = useCallback((productId: string) => {
    window.location.hash = `#/recipes/${productId}`
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search), 320)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [searchDebounced, filterCategoryId, filterActive, filterType, sortBy])

  const setViewModePersist = useCallback((mode: 'cards' | 'table') => {
    setViewMode(mode)
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, mode)
    } catch {
      /* ignore */
    }
  }, [])

  const productListQuery = useMemo(
    () => ({
      search: searchDebounced,
      categoryId: filterCategoryId || undefined,
      active:
        filterActive === 'all'
          ? undefined
          : filterActive === 'active'
            ? true
            : false,
      type: filterType || undefined,
      sort: sortBy,
    }),
    [
      searchDebounced,
      filterCategoryId,
      filterActive,
      filterType,
      sortBy,
    ],
  )

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
  }, [baseUrl])

  useEffect(() => {
    let cancelled = false
    fetchProductsCatalogStats(baseUrl)
      .then((s) => {
        if (!cancelled) setCatalogStats(s)
      })
      .catch(() => {
        if (!cancelled) setCatalogStats(null)
      })
    return () => {
      cancelled = true
    }
  }, [baseUrl])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setListError(null)
    fetchProducts(baseUrl, {
      page,
      limit: LIMIT,
      ...productListQuery,
    })
      .then((res) => {
        if (!cancelled) {
          setList(res.data)
          setMeta(res.meta)
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setListError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [baseUrl, page, productListQuery])

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

  const refreshCatalogStats = useCallback(() => {
    fetchProductsCatalogStats(baseUrl)
      .then(setCatalogStats)
      .catch(() => setCatalogStats(null))
  }, [baseUrl])

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
      if (creating) {
        await createProduct(baseUrl, {
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
        await updateProduct(baseUrl, selectedId, {
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
      closePanel()
      setPage(1)
      const res = await fetchProducts(baseUrl, {
        page: 1,
        limit: LIMIT,
        ...productListQuery,
      })
      setList(res.data)
      setMeta(res.meta)
      refreshCatalogStats()
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
    productListQuery,
    refreshCatalogStats,
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
      closePanel()
      const res = await fetchProducts(baseUrl, {
        page,
        limit: LIMIT,
        ...productListQuery,
      })
      setList(res.data)
      setMeta(res.meta)
      refreshCatalogStats()
    } catch (e) {
      setSaveError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }, [baseUrl, closePanel, page, productListQuery, refreshCatalogStats, selectedId])

  const parsedRecipe = useMemo(
    () => parseProductRecipeFull(detailRecipe),
    [detailRecipe],
  )

  const hasProductFilters = useMemo(
    () =>
      searchDebounced.trim() !== '' ||
      filterCategoryId !== '' ||
      filterActive !== 'all' ||
      filterType !== '',
    [searchDebounced, filterCategoryId, filterActive, filterType],
  )

  const pageBreakdown = useMemo(() => {
    let active = 0
    let inactive = 0
    for (const p of list) {
      if (p.active) active++
      else inactive++
    }
    return { active, inactive, inPage: list.length }
  }, [list])

  const productSummaryItems = useMemo((): SectionSummaryItem[] => {
    const items: SectionSummaryItem[] = []
    if (catalogStats) {
      items.push(
        { label: 'Catálogo', value: catalogStats.total, title: 'Total productos' },
        {
          label: 'Activos',
          value: catalogStats.active,
          title: 'Productos activos en el sistema',
        },
        {
          label: 'Inactivos',
          value: catalogStats.inactive,
          title: 'Productos inactivos',
        },
      )
    }
    if (meta) {
      items.push({
        label: hasProductFilters ? 'Coinciden' : 'Listados',
        value: meta.total,
        title: hasProductFilters
          ? 'Resultados con el filtro actual'
          : 'Mismo criterio que la tabla',
      })
    }
    items.push(
      {
        label: 'Página',
        value: pageBreakdown.inPage,
        title: 'Filas en esta página',
      },
      { label: 'Act. pág.', value: pageBreakdown.active },
      { label: 'Inact. pág.', value: pageBreakdown.inactive },
    )
    return items
  }, [catalogStats, meta, hasProductFilters, pageBreakdown])

  return (
    <div className="products-layout">
      <div className="products-list-pane">
        <div className="page-intro">
          <h2 className="page-title">Productos</h2>
          <p className="muted page-subtitle">
            Catálogo para carta y ventas. Activa o desactiva ítems sin borrarlos.
          </p>
        </div>

        <div className="data-toolbar">
          <div className="search-field">
            <span className="search-icon" aria-hidden />
            <input
              type="search"
              placeholder="Buscar por nombre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar productos"
            />
          </div>
          <div className="toolbar-filters">
            <label className="filter-field">
              <span>Categoría</span>
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
            <label className="filter-field">
              <span>Estado</span>
              <select
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
            <label className="filter-field">
              <span>Tipo</span>
              <select
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
            <label className="filter-field">
              <span>Orden</span>
              <select
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
            <button
              type="button"
              className="btn-secondary btn-compact"
              onClick={() => {
                setSearch('')
                setFilterCategoryId('')
                setFilterActive('all')
                setFilterType('')
                setSortBy('name')
              }}
            >
              Limpiar filtros
            </button>
          </div>
          <div className="toolbar-actions">
            <div className="view-toggle" role="group" aria-label="Vista">
              <button
                type="button"
                className={viewMode === 'cards' ? 'active' : ''}
                onClick={() => setViewModePersist('cards')}
              >
                Tarjetas
              </button>
              <button
                type="button"
                className={viewMode === 'table' ? 'active' : ''}
                onClick={() => setViewModePersist('table')}
              >
                Tabla
              </button>
            </div>
            <button type="button" className="btn-primary" onClick={openCreate}>
              Nuevo producto
            </button>
          </div>
        </div>

        <SectionSummaryBar
          section="products"
          items={productSummaryItems}
        />

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

        {viewMode === 'cards' ? (
          <ul className="product-cards">
            {list.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`product-card ${selectedId === p.id ? 'active' : ''}`}
                  onClick={() => void openEdit(p.id)}
                >
                  {p.imageUrl ? (
                    <div className="product-card-thumb">
                      <img src={p.imageUrl} alt="" loading="lazy" />
                    </div>
                  ) : null}
                  <div className="product-card-body">
                    <span className="product-card-name">{p.name}</span>
                    <span className="product-card-meta">
                      {p.category?.name ?? '—'} · {formatCOP(p.price)}
                    </span>
                    {!p.active && (
                      <span className="badge badge-muted">Inactivo</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="data-table-wrap data-table-elevated">
            <table className="data-table data-table-striped">
              <thead>
                <tr>
                  <th className="col-thumb" aria-hidden />
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th className="num">Precio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
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
                        onClick={() => void openEdit(p.id)}
                      >
                        {p.name}
                      </button>
                    </td>
                    <td className="muted">{p.category?.name ?? '—'}</td>
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
        )}

        {meta && meta.total > 0 && (
          <div className="pagination-bar">
            <span className="muted">
              {meta.total} producto{meta.total !== 1 ? 's' : ''}
            </span>
            <div className="pager">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={!meta.hasNextPage || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {!loading && list.length === 0 && !listError && (
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
