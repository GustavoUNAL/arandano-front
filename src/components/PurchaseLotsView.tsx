import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchPurchaseLot,
  fetchPurchaseLots,
  patchPurchaseLot,
  type PurchaseLotRow,
} from '../api'

const LIMIT = 18

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

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
  }).format(d)
}

function toDateInput(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
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

  const listQuery = useMemo(
    () => ({
      search: searchDebounced,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
    }),
    [searchDebounced, filterDateFrom, filterDateTo],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setListError(null)
    fetchPurchaseLots(baseUrl, { page, limit: LIMIT, ...listQuery })
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
  }, [baseUrl, page, listQuery])

  const openRow = useCallback(
    async (row: PurchaseLotRow) => {
      setSelectedId(row.id)
      setSaveError(null)
      setDetailLoading(true)
      try {
        const d = await fetchPurchaseLot(baseUrl, row.id)
        setDraft({
          purchaseDate: toDateInput(d.purchaseDate),
          supplier: d.supplier ?? '',
          notes: d.notes ?? '',
          totalValue:
            d.totalValue != null ? String(num(d.totalValue)) : '',
        })
      } catch (e) {
        setSaveError((e as Error).message)
        setDraft(null)
        setSelectedId(null)
      } finally {
        setDetailLoading(false)
      }
    },
    [baseUrl],
  )

  const closePanel = useCallback(() => {
    setSelectedId(null)
    setDraft(null)
    setSaveError(null)
  }, [])

  const save = useCallback(async () => {
    if (!selectedId || !draft) return
    const parts = draft.purchaseDate.split('-')
    if (parts.length !== 3) {
      setSaveError('Fecha inválida.')
      return
    }
    const iso = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2]),
    )
    if (Number.isNaN(iso.getTime())) {
      setSaveError('Fecha inválida.')
      return
    }

    const tvRaw = draft.totalValue.trim()
    let totalValue: number | undefined
    if (tvRaw !== '') {
      const v = parseFloat(tvRaw.replace(',', '.'))
      if (!Number.isFinite(v) || v < 0) {
        setSaveError('Valor total inválido.')
        return
      }
      totalValue = v
    }

    setSaving(true)
    setSaveError(null)
    try {
      await patchPurchaseLot(baseUrl, selectedId, {
        purchaseDate: iso.toISOString(),
        supplier: draft.supplier.trim() || undefined,
        notes: draft.notes.trim() || undefined,
        totalValue,
      })
      const res = await fetchPurchaseLots(baseUrl, {
        page,
        limit: LIMIT,
        ...listQuery,
      })
      setList(res.data)
      setMeta(res.meta)
      closePanel()
    } catch (e) {
      setSaveError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }, [baseUrl, closePanel, draft, listQuery, page, selectedId])

  return (
    <div className="products-layout">
      <div className="products-list-pane">
        <div className="page-intro">
          <h2 className="page-title">Compras</h2>
          <p className="muted page-subtitle">
            Lotes de compra registrados (facturas o visitas a proveedor).
          </p>
        </div>

        <div className="data-toolbar data-toolbar--stack">
          <div className="search-field">
            <span className="search-icon" aria-hidden />
            <input
              type="search"
              placeholder="Buscar por código, proveedor o notas…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar compras"
            />
          </div>
          <div className="toolbar-filters toolbar-filters--wrap">
            <label className="filter-field">
              <span>Desde</span>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </label>
            <label className="filter-field">
              <span>Hasta</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn-secondary btn-compact"
              onClick={() => {
                setSearch('')
                setFilterDateFrom('')
                setFilterDateTo('')
              }}
            >
              Limpiar filtros
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
                  <th>Código</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th className="num">Ítems</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr
                    key={row.id}
                    className={selectedId === row.id ? 'row-active' : ''}
                  >
                    <td>
                      <button
                        type="button"
                        className="table-link"
                        onClick={() => void openRow(row)}
                      >
                        {row.code}
                      </button>
                    </td>
                    <td>{formatDate(row.purchaseDate)}</td>
                    <td className="muted">{row.supplier ?? '—'}</td>
                    <td className="num">{row.itemCount}</td>
                    <td className="num mono">{formatCOP(row.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.total > 0 && (
          <div className="pagination-bar">
            <span className="muted">
              {meta.total} registro{meta.total !== 1 ? 's' : ''}
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
          <p className="empty-hint">
            No hay compras registradas o no coinciden con los filtros.
          </p>
        )}
      </div>

      {selectedId && draft && (
        <aside className="editor-panel" aria-label="Detalle de compra">
          <div className="editor-panel-head">
            <h2>Editar compra</h2>
            <button
              type="button"
              className="btn-ghost icon-close"
              onClick={closePanel}
              aria-label="Cerrar"
            />
          </div>
          <div className="editor-panel-body">
            {detailLoading && <p className="muted">Cargando…</p>}
            {!detailLoading && (
              <>
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
        </aside>
      )}
    </div>
  )
}
