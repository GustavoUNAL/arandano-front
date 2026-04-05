import { useCallback, useEffect, useState } from 'react'
import {
  fetchInventoryOptions,
  fetchProduct,
  fetchProductCategories,
  fetchRecipeCatalog,
  parseProductRecipe,
  type CategoryRef,
  type InventoryOption,
  type ProductRecipeDetail,
  type RecipeCatalogEntry,
} from '../api'
import { RecipeEditor } from './RecipeEditor'

export function RecipesView({ baseUrl }: { baseUrl: string }) {
  const [categories, setCategories] = useState<CategoryRef[]>([])
  const [catalog, setCatalog] = useState<RecipeCatalogEntry[]>([])
  const [inventory, setInventory] = useState<InventoryOption[]>([])
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingList, setLoadingList] = useState(true)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState('')
  const [detailRecipe, setDetailRecipe] = useState<ProductRecipeDetail | null>(
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
    setLoadingList(true)
    setLoadError(null)
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

  const openRow = useCallback(
    async (row: RecipeCatalogEntry) => {
      setSelectedId(row.productId)
      setSelectedName(row.productName)
      setDetailError(null)
      setDetailLoading(true)
      setDetailRecipe(null)
      try {
        const p = await fetchProduct(baseUrl, row.productId)
        setDetailRecipe(parseProductRecipe(p.recipe) ?? null)
      } catch (e) {
        setDetailError((e as Error).message)
      } finally {
        setDetailLoading(false)
      }
    },
    [baseUrl],
  )

  const closePanel = useCallback(() => {
    setSelectedId(null)
    setSelectedName('')
    setDetailRecipe(null)
    setDetailError(null)
  }, [])

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
          {!loadingList && (
            <span className="stock-total-badge">
              {catalog.length} receta{catalog.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="data-toolbar data-toolbar--compact">
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
              onClick={() => setFilterCategoryId('')}
            >
              Limpiar
            </button>
          </div>
        </div>

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

        {!loadingList && catalog.length > 0 && (
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
                {catalog.map((row) => (
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
        <aside className="recipe-side-panel" aria-label="Editor de receta">
          <div className="editor-panel-head">
            <div>
              <h2>Receta</h2>
              <p className="muted small recipe-side-sub">{selectedName}</p>
            </div>
            <button
              type="button"
              className="btn-ghost icon-close"
              onClick={closePanel}
              aria-label="Cerrar"
            />
          </div>
          <div className="recipe-side-body">
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
                compact
                onRecipeUpdated={(r) => {
                  setDetailRecipe(r)
                  void refreshCatalog()
                }}
              />
            )}
          </div>
        </aside>
      )}
    </div>
  )
}
