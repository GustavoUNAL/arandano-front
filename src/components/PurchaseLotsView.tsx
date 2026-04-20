import { useCallback, useEffect, useState } from 'react'
import {
  deleteInventoryItem,
  displayPurchaseLotSupplier,
  fetchInventoryItems,
  fetchPurchaseLot,
  fetchPurchaseLots,
  formatPurchaseLotDate,
  patchPurchaseLot,
  purchaseLotDateToInputValue,
  updateInventoryItem,
  type InventoryRow,
  type PurchaseLotRow,
} from '../api'

const LIMIT = 18

function getPurchaseLotIdFromHash(): string | null {
  const raw = (window.location.hash ?? '').replace(/^#/, '')
  const [path] = raw.split('?')
  const parts = (path ?? '').split('/').filter(Boolean)
  if (parts[0] !== 'purchases') return null
  return parts[1] ?? null
}

function pushRouteToPurchaseLot(id: string): void {
  window.history.pushState({}, '', `#/purchases/${id}`)
}

function replaceRouteToPurchasesList(): void {
  window.history.replaceState({}, '', '#/purchases')
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

function num(v: string | number | null | undefined): number {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

function formatCOP(value: string | number | null | undefined): string {
  const n = num(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

function lotItemsTotal(rows: InventoryRow[]): number {
  let sum = 0
  for (const r of rows) {
    const q = num(r.quantity)
    const c = num(r.unitCost)
    if (Number.isFinite(q) && Number.isFinite(c)) sum += q * c
  }
  return sum
}

function looksLikeUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s.trim(),
  )
}

/** Nombre legible: `name` del API; si no, `code` salvo que parezca UUID (no usarlo como título). */
function purchaseLotDisplayName(row: { code: string; name?: string | null }): string {
  const n = row.name?.trim()
  if (n) return n
  const c = row.code?.trim()
  if (!c) return '—'
  if (looksLikeUuid(c)) return 'Sin nombre de lote'
  return c
}

/** Línea secundaria bajo el nombre: código distinto al título, o código UUID si no hay nombre. */
function purchaseLotSecondaryLine(row: {
  code: string
  name?: string | null
}): string | null {
  const n = row.name?.trim()
  const c = row.code?.trim()
  if (!c) return null
  if (n && n !== c) return c
  if (!n && looksLikeUuid(c)) return `Código: ${c}`
  return null
}

export function PurchaseLotsView({ baseUrl }: { baseUrl: string }) {
  const [list, setList] = useState<PurchaseLotRow[]>([])
  const [meta, setMeta] = useState<{
    page: number
    limit: number
    total: number
    hasNextPage: boolean
  } | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  /** Fila de lista al abrir el panel (nombre/código para el encabezado). */
  const [selectedLotRow, setSelectedLotRow] = useState<PurchaseLotRow | null>(
    null,
  )
  const [lotInventory, setLotInventory] = useState<InventoryRow[]>([])
  const [lotInventoryLoading, setLotInventoryLoading] = useState(false)
  const [lotInventoryError, setLotInventoryError] = useState<string | null>(
    null,
  )
  const [lotItemError, setLotItemError] = useState<string | null>(null)
  const [lotItemSavingId, setLotItemSavingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{
    purchaseDate: string
    supplier: string
    notes: string
    totalValue: string
  } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search), 320)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [searchDebounced, filterDateFrom, filterDateTo])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setListError(null)
    fetchPurchaseLots(baseUrl, {
      page,
      limit: LIMIT,
      search: searchDebounced.trim() || undefined,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
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
  }, [baseUrl, page, searchDebounced, filterDateFrom, filterDateTo])

  const openLot = useCallback(
    async (id: string, row?: PurchaseLotRow, updateHash = false) => {
      if (updateHash) pushRouteToPurchaseLot(id)
      if (row) setSelectedLotRow(row)
      setLotInventory([])
      setLotInventoryError(null)
      setLotItemError(null)
      setSelectedId(id)
      setSaveError(null)
      setDetailLoading(true)
      try {
        const d = await fetchPurchaseLot(baseUrl, id)
        setSelectedLotRow(d)
        setDraft({
          purchaseDate: purchaseLotDateToInputValue(d.purchaseDate),
          supplier: d.supplier ?? '',
          notes: d.notes ?? '',
          totalValue:
            d.totalValue != null ? String(num(d.totalValue)) : '',
        })
      } catch (e) {
        setSaveError((e as Error).message)
        setDraft(null)
        setSelectedId(null)
        setSelectedLotRow(null)
      } finally {
        setDetailLoading(false)
      }
    },
    [baseUrl],
  )

  const closePanelState = useCallback(() => {
    setSelectedId(null)
    setSelectedLotRow(null)
    setLotInventory([])
    setLotInventoryError(null)
    setLotItemError(null)
    setLotItemSavingId(null)
    setDraft(null)
    setSaveError(null)
  }, [])

  const closePanel = useCallback(() => {
    closePanelState()
    replaceRouteToPurchasesList()
  }, [closePanelState])

  useEffect(() => {
    const hashId = getPurchaseLotIdFromHash()
    if (hashId) void openLot(hashId)
    const onHash = () => {
      const id = getPurchaseLotIdFromHash()
      if (id) {
        if (id !== selectedId) void openLot(id)
      } else if (selectedId) {
        closePanelState()
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [closePanelState, openLot, selectedId])

  useEffect(() => {
    const code = selectedLotRow?.code?.trim()
    if (!selectedId || !code) {
      setLotInventory([])
      setLotInventoryLoading(false)
      return
    }
    let cancelled = false
    setLotInventoryLoading(true)
    setLotInventoryError(null)
    fetchInventoryItems(baseUrl, {
      page: 1,
      limit: 100,
      lot: code,
      includeStats: false,
    })
      .then((res) => {
        if (!cancelled) setLotInventory(res.data)
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setLotInventory([])
          setLotInventoryError(e.message)
        }
      })
      .finally(() => {
        if (!cancelled) setLotInventoryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [baseUrl, selectedId, selectedLotRow?.code])

  useEffect(() => {
    const t = String(lotItemsTotal(lotInventory))
    setDraft((prev) => {
      if (!prev) return prev
      if (prev.totalValue === t) return prev
      return { ...prev, totalValue: t }
    })
  }, [lotInventory])

  const updateLotItemField = useCallback(
    async (inv: InventoryRow, patch: { quantity?: string; unitCost?: string }) => {
      const payload: { quantity?: number; unitCost?: number } = {}
      if (patch.quantity != null) {
        const q = parseFloat(patch.quantity.replace(',', '.'))
        if (!Number.isFinite(q) || q < 0) {
          setLotItemError('Cantidad inválida.')
          return
        }
        payload.quantity = q
      }
      if (patch.unitCost != null) {
        const c = parseFloat(patch.unitCost.replace(',', '.'))
        if (!Number.isFinite(c) || c < 0) {
          setLotItemError('Costo unitario inválido.')
          return
        }
        payload.unitCost = c
      }
      if (payload.quantity == null && payload.unitCost == null) return
      setLotItemSavingId(inv.id)
      setLotItemError(null)
      try {
        const updated = await updateInventoryItem(baseUrl, inv.id, payload)
        setLotInventory((prev) => prev.map((x) => (x.id === inv.id ? updated : x)))
      } catch (e) {
        setLotItemError((e as Error).message)
      } finally {
        setLotItemSavingId(null)
      }
    },
    [baseUrl],
  )

  const deleteLotItem = useCallback(
    async (inv: InventoryRow) => {
      if (!window.confirm(`¿Eliminar el ítem "${inv.name}" de este lote?`)) return
      setLotItemSavingId(inv.id)
      setLotItemError(null)
      try {
        await deleteInventoryItem(baseUrl, inv.id)
        setLotInventory((prev) => prev.filter((x) => x.id !== inv.id))
      } catch (e) {
        setLotItemError((e as Error).message)
      } finally {
        setLotItemSavingId(null)
      }
    },
    [baseUrl],
  )

  const save = useCallback(async () => {
    if (!selectedId || !draft) return
    const dateStr = draft.purchaseDate.trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      setSaveError('Fecha inválida.')
      return
    }
    const [y, mo, da] = dateStr.split('-').map(Number)
    const check = new Date(y, mo - 1, da)
    if (
      Number.isNaN(check.getTime()) ||
      check.getFullYear() !== y ||
      check.getMonth() !== mo - 1 ||
      check.getDate() !== da
    ) {
      setSaveError('Fecha inválida.')
      return
    }

    for (const inv of lotInventory) {
      const q = num(inv.quantity)
      const c = num(inv.unitCost)
      if (!Number.isFinite(q) || q < 0 || !Number.isFinite(c) || c < 0) {
        setSaveError(
          'Hay ítems con cantidad o costo inválido. Corrige los valores del lote.',
        )
        return
      }
    }

    const totalValue = lotItemsTotal(lotInventory)

    setSaving(true)
    setSaveError(null)
    try {
      await patchPurchaseLot(baseUrl, selectedId, {
        purchaseDate: dateStr,
        supplier: draft.supplier.trim() || undefined,
        notes: draft.notes.trim() || undefined,
        totalValue,
      })
      const res = await fetchPurchaseLots(baseUrl, {
        page,
        limit: LIMIT,
        search: searchDebounced.trim() || undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
      })
      setList(res.data)
      setMeta(res.meta)
      closePanel()
    } catch (e) {
      setSaveError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }, [
    baseUrl,
    closePanel,
    draft,
    filterDateFrom,
    filterDateTo,
    page,
    searchDebounced,
    selectedId,
    lotInventory,
  ])

  const panelLotSecondary = selectedLotRow
    ? purchaseLotSecondaryLine(selectedLotRow)
    : null
  const totalPages =
    meta && meta.limit > 0 ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1
  const pageDots = paginationDots(page, totalPages)

  if (selectedId) {
    return (
      <div className="products-layout">
        <div className="products-list-pane products-list-pane--purchases">
          <div className="page-intro page-intro--tight">
            <h2 className="page-title">Lote de compra</h2>
            <p className="muted page-subtitle">
              Inicio / Compras /{' '}
              {selectedLotRow ? purchaseLotDisplayName(selectedLotRow) : selectedId}
            </p>
            {panelLotSecondary ? (
              <p className="muted small mono">{panelLotSecondary}</p>
            ) : null}
          </div>

          <div className="inventory-filter-bar app-toolbar-zone">
            <div className="inventory-filter-bar__controls">
              <label className="inventory-filter">
                <span className="inventory-filter__label">Ruta</span>
                <input
                  className="inventory-filter__input mono"
                  readOnly
                  value={window.location.hash || `#/purchases/${selectedId}`}
                />
              </label>
            </div>
            <div className="inventory-filter-bar__actions">
              <button
                type="button"
                className="btn-secondary btn-compact"
                onClick={closePanel}
              >
                Volver a compras
              </button>
            </div>
          </div>

          {detailLoading && <p className="muted">Cargando…</p>}
          {saveError && !draft && (
            <p className="error" role="alert">
              {saveError}
            </p>
          )}
          {!detailLoading && draft && selectedLotRow && (
            <>
              <div className="purchases-lot-inventory-block">
                <h3 className="purchases-lot-inventory-block__title">
                  Ítems en este lote (inventario)
                </h3>
                {lotInventoryLoading && (
                  <p className="muted small">Cargando ítems…</p>
                )}
                {lotInventoryError && (
                  <p className="error small" role="alert">
                    {lotInventoryError}
                  </p>
                )}
                {lotItemError && (
                  <p className="error small" role="alert">
                    {lotItemError}
                  </p>
                )}
                {!lotInventoryLoading &&
                  !lotInventoryError &&
                  lotInventory.length === 0 && (
                    <p className="muted small">
                      No hay filas de inventario con este código de lote, o el API no
                      filtra por <code className="mono">lot</code>.
                    </p>
                  )}
                {!lotInventoryLoading &&
                  !lotInventoryError &&
                  lotInventory.length > 0 && (
                    <div className="data-table-wrap data-table-compact">
                      <table className="data-table data-table-striped">
                        <thead>
                          <tr>
                            <th>Ítem</th>
                            <th>Categoría</th>
                            <th className="num">Cantidad</th>
                            <th>Unidad</th>
                            <th className="num">Costo u.</th>
                            <th className="num">Subtotal</th>
                            <th aria-label="Acciones" />
                          </tr>
                        </thead>
                        <tbody>
                          {lotInventory.map((inv) => (
                            <tr key={inv.id}>
                              <td>{inv.name}</td>
                              <td className="muted small">{inv.category?.name ?? '—'}</td>
                              <td className="num mono">
                                <input
                                  className="input-cell"
                                  inputMode="decimal"
                                  value={String(inv.quantity)}
                                  onChange={(e) =>
                                    setLotInventory((prev) =>
                                      prev.map((x) =>
                                        x.id === inv.id
                                          ? { ...x, quantity: e.target.value }
                                          : x,
                                      ),
                                    )
                                  }
                                  onBlur={() =>
                                    void updateLotItemField(inv, {
                                      quantity:
                                        String(
                                          lotInventory.find((x) => x.id === inv.id)
                                            ?.quantity ?? inv.quantity,
                                        ),
                                    })
                                  }
                                  disabled={lotItemSavingId === inv.id}
                                />
                              </td>
                              <td className="small">{inv.unit}</td>
                              <td className="num mono">
                                <input
                                  className="input-cell"
                                  inputMode="decimal"
                                  value={String(inv.unitCost)}
                                  onChange={(e) =>
                                    setLotInventory((prev) =>
                                      prev.map((x) =>
                                        x.id === inv.id
                                          ? { ...x, unitCost: e.target.value }
                                          : x,
                                      ),
                                    )
                                  }
                                  onBlur={() =>
                                    void updateLotItemField(inv, {
                                      unitCost:
                                        String(
                                          lotInventory.find((x) => x.id === inv.id)
                                            ?.unitCost ?? inv.unitCost,
                                        ),
                                    })
                                  }
                                  disabled={lotItemSavingId === inv.id}
                                />
                              </td>
                              <td className="num mono">
                                {formatCOP(num(inv.quantity) * num(inv.unitCost))}
                              </td>
                              <td className="num">
                                <button
                                  type="button"
                                  className="btn-icon-remove"
                                  onClick={() => void deleteLotItem(inv)}
                                  disabled={lotItemSavingId === inv.id}
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
              <label className="field">
                <span>Fecha de compra</span>
                <input
                  type="date"
                  value={draft.purchaseDate}
                  onChange={(e) =>
                    setDraft({ ...draft, purchaseDate: e.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Proveedor</span>
                <input
                  value={draft.supplier}
                  onChange={(e) => setDraft({ ...draft, supplier: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Notas</span>
                <textarea
                  rows={4}
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Valor total (COP)</span>
                <input
                  value={formatCOP(lotItemsTotal(lotInventory))}
                  readOnly
                />
              </label>
              {saveError && (
                <p className="error" role="alert">
                  {saveError}
                </p>
              )}
              <div className="editor-actions">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={saving}
                  onClick={() => void save()}
                >
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="products-layout">
      <div className="products-list-pane products-list-pane--purchases">
        <div className="page-intro page-intro--tight">
          <h2 className="page-title">Compras</h2>
        </div>

        <div className="inventory-filter-bar app-toolbar-zone">
          <div className="inventory-filter-bar__controls" role="search">
            <label className="inventory-filter">
              <span className="inventory-filter__label">Buscar</span>
              <input
                className="inventory-filter__input"
                type="search"
                placeholder="Lote, proveedor, notas…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar compras"
              />
            </label>
            <label className="inventory-filter">
              <span className="inventory-filter__label">Desde</span>
              <input
                className="inventory-filter__input"
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </label>
            <label className="inventory-filter">
              <span className="inventory-filter__label">Hasta</span>
              <input
                className="inventory-filter__input"
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </label>
          </div>
          <div className="inventory-filter-bar__actions">
            <button
              type="button"
              className="btn-secondary btn-compact"
              onClick={() => {
                setSearch('')
                setFilterDateFrom('')
                setFilterDateTo('')
              }}
            >
              Limpiar
            </button>
          </div>
        </div>

        {listError && (
          <p className="error" role="alert">
            {listError}
          </p>
        )}
        {loading && <p className="muted">Cargando compras…</p>}

        {!loading && list.length > 0 && (
          <div className="data-table-wrap data-table-elevated">
            <table className="data-table data-table-striped">
              <thead>
                <tr>
                  <th>Nombre del lote</th>
                  <th>Fecha de compra</th>
                  <th>Proveedor</th>
                  <th className="num">Ítems</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => {
                  const secondary = purchaseLotSecondaryLine(row)
                  return (
                    <tr
                    key={row.id}
                    className={selectedId === row.id ? 'row-active' : ''}
                  >
                    <td>
                      <button
                        type="button"
                        className="table-link purchases-lot-cell"
                        title={row.code ? `Código: ${row.code}` : undefined}
                        onClick={() => void openLot(row.id, row, true)}
                      >
                        <span className="purchases-lot-cell__name">
                          {purchaseLotDisplayName(row)}
                        </span>
                        {secondary ? (
                          <span className="purchases-lot-cell__code muted small mono">
                            {secondary}
                          </span>
                        ) : null}
                      </button>
                    </td>
                    <td className="purchases-date-cell">
                      {formatPurchaseLotDate(row.purchaseDate, 'long')}
                    </td>
                    <td className="muted">
                      {displayPurchaseLotSupplier(row) || '—'}
                    </td>
                    <td className="num">{row.itemCount}</td>
                    <td className="num mono">{formatCOP(row.totalValue)}</td>
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
              {meta.total} registro{meta.total !== 1 ? 's' : ''}
            </span>
            {pageDots.length > 1 && (
              <div className="pager-dots" aria-hidden>
                {pageDots.map((p) => (
                  <span
                    key={p}
                    className={`pager-dot${p === page ? ' is-active' : ''}`}
                  />
                ))}
              </div>
            )}
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
          <p className="empty-hint">
            No hay compras registradas o no coinciden con los filtros.
          </p>
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
            aria-label="Detalle de lote de compra"
          >
            <header className="modal-head">
              <div className="modal-head-title">
                <h2>Lote de compra</h2>
                <p className="muted small modal-subtitle">
                  Inicio / Compras /{' '}
                  {selectedLotRow ? purchaseLotDisplayName(selectedLotRow) : selectedId}
                </p>
                {panelLotSecondary ? (
                  <p className="muted small mono" style={{ margin: '0.2rem 0 0' }}>
                    {panelLotSecondary}
                  </p>
                ) : null}
              </div>
              <div className="modal-head-actions">
                <button
                  type="button"
                  className="btn-secondary btn-compact"
                  onClick={closePanel}
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
              {detailLoading && <p className="muted">Cargando…</p>}
              {saveError && !draft && (
                <p className="error" role="alert">
                  {saveError}
                </p>
              )}
              {!detailLoading && draft && selectedLotRow && (
                <>
                <div className="purchases-lot-inventory-block">
                  <h3 className="purchases-lot-inventory-block__title">
                    Ítems en este lote (inventario)
                  </h3>
                  {lotInventoryLoading && (
                    <p className="muted small">Cargando ítems…</p>
                  )}
                  {lotInventoryError && (
                    <p className="error small" role="alert">
                      {lotInventoryError}
                    </p>
                  )}
                  {!lotInventoryLoading &&
                    !lotInventoryError &&
                    lotInventory.length === 0 && (
                      <p className="muted small">
                        No hay filas de inventario con este código de lote, o
                        el API no filtra por <code className="mono">lot</code>.
                      </p>
                    )}
                  {!lotInventoryLoading &&
                    !lotInventoryError &&
                    lotInventory.length > 0 && (
                      <div className="data-table-wrap data-table-compact">
                        <table className="data-table data-table-striped">
                          <thead>
                            <tr>
                              <th>Ítem</th>
                              <th>Categoría</th>
                              <th className="num">Cantidad</th>
                              <th>Unidad</th>
                              <th className="num">Costo u.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lotInventory.map((inv) => (
                              <tr key={inv.id}>
                                <td>{inv.name}</td>
                                <td className="muted small">
                                  {inv.category?.name ?? '—'}
                                </td>
                                <td className="num mono">{inv.quantity}</td>
                                <td className="small">{inv.unit}</td>
                                <td className="num mono">
                                  {formatCOP(inv.unitCost)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                </div>
                <label className="field">
                  <span>Fecha de compra</span>
                  <input
                    type="date"
                    value={draft.purchaseDate}
                    onChange={(e) =>
                      setDraft({ ...draft, purchaseDate: e.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Proveedor</span>
                  <input
                    value={draft.supplier}
                    onChange={(e) =>
                      setDraft({ ...draft, supplier: e.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Notas</span>
                  <textarea
                    rows={4}
                    value={draft.notes}
                    onChange={(e) =>
                      setDraft({ ...draft, notes: e.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Valor total (COP)</span>
                  <input
                    inputMode="decimal"
                    placeholder="Opcional"
                    value={draft.totalValue}
                    onChange={(e) =>
                      setDraft({ ...draft, totalValue: e.target.value })
                    }
                  />
                </label>
                {saveError && (
                  <p className="error" role="alert">
                    {saveError}
                  </p>
                )}
                <div className="editor-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={saving}
                    onClick={() => void save()}
                  >
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              </>
            )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
