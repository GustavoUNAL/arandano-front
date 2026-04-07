import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createInventoryItem,
  deleteInventoryItem,
  fetchInventoryCategories,
  fetchInventoryItems,
  fetchPurchaseLotsCodeIndex,
  formatPurchaseLotDate,
  updateInventoryItem,
  type CategoryRef,
  type InventoryRow,
  type PurchaseLotRow,
} from '../api'
import { SectionSummaryBar, type SectionSummaryItem } from './SectionSummaryBar'

const LIMIT = 18

function num(v: string | number | null | undefined): number {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

function formatCOP(value: string | number): string {
  const n = num(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

function isAvailable(qty: string | number | null | undefined): boolean {
  const q = num(qty)
  return Number.isFinite(q) && q > 0
}

type Draft = {
  name: string
  categoryId: string
  quantity: string
  unit: string
  unitCost: string
  supplier: string
  lot: string
  minStock: string
}

function emptyDraft(cats: CategoryRef[]): Draft {
  return {
    name: '',
    categoryId: cats[0]?.id ?? '',
    quantity: '0',
    unit: '',
    unitCost: '0',
    supplier: '',
    lot: '',
    minStock: '',
  }
}

function rowToDraft(r: InventoryRow): Draft {
  return {
    name: r.name,
    categoryId: r.categoryId,
    quantity: String(r.quantity),
    unit: r.unit,
    unitCost: String(r.unitCost),
    supplier: r.supplier ?? '',
    lot: r.lot ?? '',
    minStock: r.minStock != null ? String(r.minStock) : '',
  }
}

export function InventoryManager({ baseUrl }: { baseUrl: string }) {
  const [categories, setCategories] = useState<CategoryRef[]>([])
  const [catError, setCatError] = useState<string | null>(null)

  const [list, setList] = useState<InventoryRow[]>([])
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
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [lotByCode, setLotByCode] = useState<Map<string, PurchaseLotRow> | null>(
    null,
  )
  const [lotIndexError, setLotIndexError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLotIndexError(null)
    fetchPurchaseLotsCodeIndex(baseUrl)
      .then((m) => {
        if (!cancelled) {
          setLotByCode(m)
          setLotIndexError(null)
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setLotByCode(null)
          setLotIndexError(e.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [baseUrl])

  const refreshLotIndex = useCallback(() => {
    fetchPurchaseLotsCodeIndex(baseUrl)
      .then((m) => {
        setLotByCode(m)
        setLotIndexError(null)
      })
      .catch((e: Error) => {
        setLotIndexError(e.message)
      })
  }, [baseUrl])

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search), 320)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [searchDebounced, filterCategoryId])

  const inventoryListQuery = useMemo(
    () => ({
      search: searchDebounced,
      categoryId: filterCategoryId || undefined,
    }),
    [searchDebounced, filterCategoryId],
  )

  useEffect(() => {
    let cancelled = false
    fetchInventoryCategories(baseUrl)
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
    setLoading(true)
    setListError(null)
    fetchInventoryItems(baseUrl, {
      page,
      limit: LIMIT,
      ...inventoryListQuery,
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
  }, [baseUrl, page, inventoryListQuery])

  const openCreate = useCallback(() => {
    setCreating(true)
    setSelectedId(null)
    setDraft(emptyDraft(categories))
    setSaveError(null)
  }, [categories])

  const openEdit = useCallback((row: InventoryRow) => {
    setCreating(false)
    setSelectedId(row.id)
    setDraft(rowToDraft(row))
    setSaveError(null)
  }, [])

  const closePanel = useCallback(() => {
    setSelectedId(null)
    setCreating(false)
    setDraft(null)
    setSaveError(null)
  }, [])

  const save = useCallback(async () => {
    if (!draft) return
    const quantity = parseFloat(draft.quantity.replace(',', '.'))
    const unitCost = parseFloat(draft.unitCost.replace(',', '.'))
    const minStockRaw = draft.minStock.trim()
    const minStock =
      minStockRaw === '' ? undefined : parseFloat(minStockRaw.replace(',', '.'))

    if (!draft.name.trim()) {
      setSaveError('El nombre es obligatorio.')
      return
    }
    if (!draft.categoryId) {
      setSaveError('Elige una categoría.')
      return
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      setSaveError('Cantidad inválida.')
      return
    }
    if (!draft.unit.trim()) {
      setSaveError('La unidad es obligatoria.')
      return
    }
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      setSaveError('Costo unitario inválido.')
      return
    }
    if (
      minStockRaw !== '' &&
      (!Number.isFinite(minStock) || (minStock as number) < 0)
    ) {
      setSaveError('Stock mínimo inválido.')
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      if (creating) {
        await createInventoryItem(baseUrl, {
          name: draft.name.trim(),
          categoryId: draft.categoryId,
          quantity,
          unit: draft.unit.trim(),
          unitCost,
          supplier: draft.supplier.trim() || undefined,
          lot: draft.lot.trim() || undefined,
          minStock,
        })
      } else if (selectedId) {
        await updateInventoryItem(baseUrl, selectedId, {
          name: draft.name.trim(),
          categoryId: draft.categoryId,
          quantity,
          unit: draft.unit.trim(),
          unitCost,
          supplier: draft.supplier.trim() || undefined,
          lot: draft.lot.trim() || undefined,
          minStock,
        })
      }
      closePanel()
      setPage(1)
      const res = await fetchInventoryItems(baseUrl, {
        page: 1,
        limit: LIMIT,
        ...inventoryListQuery,
      })
      setList(res.data)
      setMeta(res.meta)
      refreshLotIndex()
    } catch (e) {
      setSaveError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }, [
    baseUrl,
    closePanel,
    creating,
    draft,
    inventoryListQuery,
    refreshLotIndex,
    selectedId,
  ])

  const remove = useCallback(async () => {
    if (!selectedId) return
    if (
      !window.confirm(
        '¿Archivar este ítem de inventario? No podrá usarse en recetas nuevas.',
      )
    )
      return
    setSaving(true)
    setSaveError(null)
    try {
      await deleteInventoryItem(baseUrl, selectedId)
      closePanel()
      const res = await fetchInventoryItems(baseUrl, {
        page,
        limit: LIMIT,
        ...inventoryListQuery,
      })
      setList(res.data)
      setMeta(res.meta)
    } catch (e) {
      setSaveError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }, [baseUrl, closePanel, inventoryListQuery, page, selectedId])

  const panelOpen = creating || selectedId !== null

  const draftMatchedLot = useMemo(() => {
    if (!draft) return undefined
    const code = draft.lot.trim()
    if (!code || !lotByCode) return undefined
    return lotByCode.get(code)
  }, [draft, lotByCode])

  const lowStockIds = useMemo(() => {
    const s = new Set<string>()
    for (const r of list) {
      const q = num(r.quantity)
      const m = num(r.minStock)
      if (Number.isFinite(q) && Number.isFinite(m) && q <= m) s.add(r.id)
    }
    return s
  }, [list])

  const inventorySummaryItems = useMemo((): SectionSummaryItem[] => {
    let available = 0
    let consumed = 0
    let low = 0
    for (const r of list) {
      if (isAvailable(r.quantity)) available++
      else consumed++
      if (lowStockIds.has(r.id)) low++
    }
    const items: SectionSummaryItem[] = []
    if (meta != null) {
      items.push({
        label: 'Coinciden',
        value: meta.total,
        title: 'Ítems que cumplen búsqueda y categoría',
      })
    }
    items.push(
      {
        label: 'Página',
        value: list.length,
        title: 'Filas en esta página',
      },
      {
        label: 'Disponible',
        value: available,
        title: 'Cantidad mayor que 0 en esta página',
      },
      {
        label: 'Consumido',
        value: consumed,
        title: 'Cantidad 0 en esta página',
      },
      {
        label: 'Bajo mín.',
        value: low,
        title: 'Alerta de stock mínimo en esta página',
      },
    )
    return items
  }, [list, lowStockIds, meta])

  return (
    <div className="products-layout">
      <div className="products-list-pane">
        <div className="page-intro">
          <h2 className="page-title">Inventario</h2>
          <p className="muted page-subtitle">
            Insumos, lotes y costos. Enlaza con compras por código de lote.
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
              aria-label="Buscar inventario"
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
            <button
              type="button"
              className="btn-secondary btn-compact"
              onClick={() => {
                setSearch('')
                setFilterCategoryId('')
              }}
            >
              Limpiar filtros
            </button>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="btn-primary" onClick={openCreate}>
              Nuevo ítem
            </button>
          </div>
        </div>

        <SectionSummaryBar section="inventory" items={inventorySummaryItems} />

        {catError && (
          <p className="banner-warn" role="status">
            Categorías: {catError}
          </p>
        )}
        {lotIndexError && (
          <p className="banner-warn" role="status">
            Lotes de compra: no se pudieron cargar ({lotIndexError}). Fecha y
            proveedor del lote aparecerán vacíos hasta que vuelva a cargar la
            página.
          </p>
        )}
        {listError && (
          <p className="error" role="alert">
            {listError}
          </p>
        )}
        {loading && <p className="muted">Cargando inventario…</p>}

        {!loading && list.length > 0 && (
          <div className="data-table-wrap data-table-elevated inventory-table-wrap">
            <table className="data-table data-table-striped">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Categoría</th>
                  <th>Lote</th>
                  <th>Fecha compra</th>
                  <th>Compra en</th>
                  <th className="num">Cantidad</th>
                  <th>Unidad</th>
                  <th className="num">Costo u.</th>
                  <th className="num">Mín.</th>
                  <th>Estado</th>
                  <th aria-label="Alertas" />
                </tr>
              </thead>
              <tbody>
                {list.map((r) => {
                  const low = lowStockIds.has(r.id)
                  const available = isAvailable(r.quantity)
                  const lotCode = r.lot?.trim() ?? ''
                  const pl = lotCode && lotByCode ? lotByCode.get(lotCode) : undefined
                  const whereBought =
                    pl?.supplier?.trim() ||
                    r.supplier?.trim() ||
                    ''
                  return (
                    <tr
                      key={r.id}
                      className={
                        selectedId === r.id
                          ? 'row-active'
                          : low
                            ? 'row-warn'
                            : ''
                      }
                    >
                      <td>
                        <button
                          type="button"
                          className="table-link"
                          onClick={() => openEdit(r)}
                        >
                          {r.name}
                        </button>
                      </td>
                      <td className="muted">{r.category?.name ?? '—'}</td>
                      <td className="mono muted">
                        {lotCode || '—'}
                      </td>
                      <td className="muted">
                        {pl
                          ? formatPurchaseLotDate(pl.purchaseDate, 'short')
                          : '—'}
                      </td>
                      <td className="muted">
                        {whereBought || '—'}
                      </td>
                      <td className="num mono">{String(r.quantity)}</td>
                      <td>{r.unit}</td>
                      <td className="num mono">{formatCOP(r.unitCost)}</td>
                      <td className="num mono">
                        {r.minStock != null ? String(r.minStock) : '—'}
                      </td>
                      <td>
                        {available ? (
                          <span className="badge badge-ok">Disponible</span>
                        ) : (
                          <span className="badge badge-muted">Consumido</span>
                        )}
                      </td>
                      <td>
                        {low && (
                          <span className="badge badge-warn">Bajo mín.</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.total > 0 && (
          <div className="pagination-bar">
            <span className="muted">
              {meta.total} ítem{meta.total !== 1 ? 's' : ''}
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
          <p className="empty-hint">No hay ítems. Crea uno o ajusta la búsqueda.</p>
        )}
      </div>

      {panelOpen && draft && (
        <aside className="editor-panel" aria-label="Editor de inventario">
          <div className="editor-panel-head">
            <h2>{creating ? 'Nuevo ítem' : 'Editar inventario'}</h2>
            <button
              type="button"
              className="btn-ghost icon-close"
              onClick={closePanel}
              aria-label="Cerrar"
            />
          </div>

          <div className="editor-panel-body">
            <label className="field">
              <span>Nombre</span>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Categoría</span>
              <select
                value={draft.categoryId}
                onChange={(e) =>
                  setDraft({ ...draft, categoryId: e.target.value })
                }
              >
                {categories.length === 0 && (
                  <option value="">— Sin categorías —</option>
                )}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-row-2">
              <label className="field">
                <span>Cantidad en stock</span>
                <input
                  inputMode="decimal"
                  value={draft.quantity}
                  onChange={(e) =>
                    setDraft({ ...draft, quantity: e.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Unidad</span>
                <input
                  value={draft.unit}
                  onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                  placeholder="kg, L, unidad…"
                />
              </label>
            </div>

            <label className="field">
              <span>Costo unitario (COP)</span>
              <input
                inputMode="decimal"
                value={draft.unitCost}
                onChange={(e) =>
                  setDraft({ ...draft, unitCost: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Proveedor / notas</span>
              <input
                value={draft.supplier}
                onChange={(e) =>
                  setDraft({ ...draft, supplier: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Lote (código)</span>
              <input
                value={draft.lot}
                onChange={(e) => setDraft({ ...draft, lot: e.target.value })}
              />
            </label>

            {!creating && draft.lot.trim() && draftMatchedLot && (
              <div className="panel-lot-meta muted">
                <div>
                  <strong>Fecha de compra (lote):</strong>{' '}
                  {formatPurchaseLotDate(draftMatchedLot.purchaseDate, 'short')}
                </div>
                <div>
                  <strong>Compra en (lote):</strong>{' '}
                  {draftMatchedLot.supplier?.trim() || '—'}
                </div>
              </div>
            )}
            {!creating &&
              draft.lot.trim() &&
              lotByCode &&
              !draftMatchedLot && (
                <p className="muted panel-lot-meta">
                  No hay una compra registrada con el código de lote «
                  {draft.lot.trim()}». La fecha y el proveedor del lote salen de
                  Compras cuando el código coincide.
                </p>
              )}

            <label className="field">
              <span>Stock mínimo (alerta)</span>
              <input
                inputMode="decimal"
                value={draft.minStock}
                onChange={(e) =>
                  setDraft({ ...draft, minStock: e.target.value })
                }
                placeholder="Opcional"
              />
            </label>

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
        </aside>
      )}
    </div>
  )
}
