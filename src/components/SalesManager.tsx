import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createSale,
  fetchProducts,
  fetchSale,
  fetchSales,
  patchSale,
  replaceSaleLines,
  type ProductRow,
  type SaleDetail,
  type SaleLineDetail,
  type SaleListRow,
} from '../api'

const LIMIT = 15
const SALE_SOURCES = ['MANUAL', 'CART', 'AI'] as const

function newLineKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function num(v: string | number): number {
  const n = parseFloat(String(v).replace(',', '.'))
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

function formatSaleDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type LineDraft = {
  key: string
  productId: string
  productName: string
  quantity: string
  unitPrice: string
}

function linesFromDetail(lines: SaleLineDetail[]): LineDraft[] {
  return lines.map((l) => ({
    key: newLineKey(),
    productId: l.productId ?? '',
    productName: l.productName,
    quantity: String(l.quantity),
    unitPrice: String(l.unitPrice),
  }))
}

function emptyLine(): LineDraft {
  return {
    key: newLineKey(),
    productId: '',
    productName: '',
    quantity: '1',
    unitPrice: '0',
  }
}

type HeaderDraft = {
  saleDateLocal: string
  paymentMethod: string
  mesa: string
  notes: string
  source: string
}

function headerFromSale(s: SaleDetail): HeaderDraft {
  return {
    saleDateLocal: toDatetimeLocalValue(s.saleDate),
    paymentMethod: s.paymentMethod ?? '',
    mesa: s.mesa ?? '',
    notes: s.notes ?? '',
    source: s.source,
  }
}

export function SalesManager({ baseUrl }: { baseUrl: string }) {
  const [list, setList] = useState<SaleListRow[]>([])
  const [meta, setMeta] = useState<{
    page: number
    limit: number
    total: number
    hasNextPage: boolean
  } | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [detail, setDetail] = useState<SaleDetail | null>(null)
  const [header, setHeader] = useState<HeaderDraft | null>(null)
  const [lineRows, setLineRows] = useState<LineDraft[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [saveHeaderError, setSaveHeaderError] = useState<string | null>(null)
  const [saveLinesError, setSaveLinesError] = useState<string | null>(null)
  const [savingHeader, setSavingHeader] = useState(false)
  const [savingLines, setSavingLines] = useState(false)

  const [productSearch, setProductSearch] = useState('')
  const [productHits, setProductHits] = useState<ProductRow[]>([])

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search), 320)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [searchDebounced, filterSource, filterDateFrom, filterDateTo])

  const salesListQuery = useMemo(
    () => ({
      search: searchDebounced,
      source: filterSource || undefined,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
    }),
    [searchDebounced, filterSource, filterDateFrom, filterDateTo],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setListError(null)
    fetchSales(baseUrl, { page, limit: LIMIT, ...salesListQuery })
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
  }, [baseUrl, page, salesListQuery])

  useEffect(() => {
    if (!selectedId && !creating) return
    let cancelled = false
    const t = window.setTimeout(() => {
      fetchProducts(baseUrl, {
        page: 1,
        limit: 80,
        search: productSearch,
      })
        .then((r) => {
          if (!cancelled) setProductHits(r.data)
        })
        .catch(() => {
          if (!cancelled) setProductHits([])
        })
    }, 280)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [baseUrl, selectedId, creating, productSearch])

  const loadDetail = useCallback(
    async (id: string) => {
      setDetailLoading(true)
      setDetailError(null)
      setSaveHeaderError(null)
      setSaveLinesError(null)
      try {
        const s = await fetchSale(baseUrl, id)
        setDetail(s)
        setHeader(headerFromSale(s))
        setLineRows(linesFromDetail(s.lines))
      } catch (e) {
        setDetailError((e as Error).message)
        setDetail(null)
        setHeader(null)
        setLineRows([])
      } finally {
        setDetailLoading(false)
      }
    },
    [baseUrl],
  )

  const openSale = useCallback(
    (id: string) => {
      setCreating(false)
      setSelectedId(id)
      setProductSearch('')
      void loadDetail(id)
    },
    [loadDetail],
  )

  const openCreate = useCallback(() => {
    setCreating(true)
    setSelectedId(null)
    setDetail(null)
    setDetailError(null)
    setSaveHeaderError(null)
    setSaveLinesError(null)
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
    setHeader({
      saleDateLocal: local,
      paymentMethod: '',
      mesa: '',
      notes: '',
      source: 'MANUAL',
    })
    setLineRows([emptyLine()])
    setProductSearch('')
  }, [])

  const closePanel = useCallback(() => {
    setSelectedId(null)
    setCreating(false)
    setDetail(null)
    setHeader(null)
    setLineRows([])
    setDetailError(null)
    setSaveHeaderError(null)
    setSaveLinesError(null)
  }, [])

  const saveNewSale = useCallback(async () => {
    if (!header) return
    const d = new Date(header.saleDateLocal)
    if (Number.isNaN(d.getTime())) {
      setSaveLinesError('Fecha u hora inválida.')
      return
    }
    const payloadLines = []
    for (const r of lineRows) {
      if (!r.productName.trim()) {
        setSaveLinesError('Cada línea necesita nombre de producto.')
        return
      }
      const q = num(r.quantity)
      const p = num(r.unitPrice)
      if (!Number.isFinite(q) || q <= 0) {
        setSaveLinesError('Cantidades inválidas.')
        return
      }
      if (!Number.isFinite(p) || p < 0) {
        setSaveLinesError('Precios inválidos.')
        return
      }
      payloadLines.push({
        productId: r.productId.trim() || undefined,
        productName: r.productName.trim(),
        quantity: q,
        unitPrice: p,
      })
    }
    if (!payloadLines.length) {
      setSaveLinesError('Añade al menos una línea.')
      return
    }

    setSavingLines(true)
    setSaveLinesError(null)
    try {
      const created = await createSale(baseUrl, {
        saleDate: d.toISOString(),
        paymentMethod: header.paymentMethod.trim() || undefined,
        source: header.source,
        mesa: header.mesa.trim() || undefined,
        notes: header.notes.trim() || undefined,
        lines: payloadLines,
      })
      setPage(1)
      const res = await fetchSales(baseUrl, {
        page: 1,
        limit: LIMIT,
        ...salesListQuery,
      })
      setList(res.data)
      setMeta(res.meta)
      openSale(created.id)
    } catch (e) {
      setSaveLinesError((e as Error).message)
    } finally {
      setSavingLines(false)
    }
  }, [baseUrl, header, lineRows, openSale, salesListQuery])

  const saveHeader = useCallback(async () => {
    if (!selectedId || !header) return
    const d = new Date(header.saleDateLocal)
    if (Number.isNaN(d.getTime())) {
      setSaveHeaderError('Fecha u hora inválida.')
      return
    }
    setSavingHeader(true)
    setSaveHeaderError(null)
    try {
      const updated = await patchSale(baseUrl, selectedId, {
        saleDate: d.toISOString(),
        paymentMethod: header.paymentMethod.trim() || undefined,
        source: header.source,
        mesa: header.mesa.trim() || undefined,
        notes: header.notes.trim() || undefined,
      })
      setDetail(updated)
      setHeader(headerFromSale(updated))
      const res = await fetchSales(baseUrl, {
        page,
        limit: LIMIT,
        ...salesListQuery,
      })
      setList(res.data)
      setMeta(res.meta)
    } catch (e) {
      setSaveHeaderError((e as Error).message)
    } finally {
      setSavingHeader(false)
    }
  }, [baseUrl, header, page, salesListQuery, selectedId])

  const saveLines = useCallback(async () => {
    if (!selectedId) return
    const payloadLines = []
    for (const r of lineRows) {
      if (!r.productName.trim()) {
        setSaveLinesError('Cada línea necesita nombre de producto.')
        return
      }
      const q = num(r.quantity)
      const p = num(r.unitPrice)
      if (!Number.isFinite(q) || q <= 0) {
        setSaveLinesError('Cantidades inválidas.')
        return
      }
      if (!Number.isFinite(p) || p < 0) {
        setSaveLinesError('Precios inválidos.')
        return
      }
      payloadLines.push({
        productId: r.productId.trim() || undefined,
        productName: r.productName.trim(),
        quantity: q,
        unitPrice: p,
      })
    }
    if (!payloadLines.length) {
      setSaveLinesError('Debe haber al menos una línea.')
      return
    }

    setSavingLines(true)
    setSaveLinesError(null)
    try {
      const updated = await replaceSaleLines(baseUrl, selectedId, payloadLines)
      setDetail(updated)
      setHeader(headerFromSale(updated))
      setLineRows(linesFromDetail(updated.lines))
      const res = await fetchSales(baseUrl, {
        page,
        limit: LIMIT,
        ...salesListQuery,
      })
      setList(res.data)
      setMeta(res.meta)
    } catch (e) {
      setSaveLinesError((e as Error).message)
    } finally {
      setSavingLines(false)
    }
  }, [baseUrl, lineRows, page, salesListQuery, selectedId])

  const updateLine = useCallback(
    (key: string, patch: Partial<LineDraft>) => {
      setLineRows((rows) =>
        rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
      )
    },
    [],
  )

  const addLine = useCallback(() => {
    setLineRows((rows) => [...rows, emptyLine()])
  }, [])

  const removeLine = useCallback((key: string) => {
    setLineRows((rows) => rows.filter((r) => r.key !== key))
  }, [])

  const panelOpen = creating || selectedId !== null
  const linesSubtotal = lineRows.reduce((s, r) => {
    const q = num(r.quantity)
    const p = num(r.unitPrice)
    if (!Number.isFinite(q) || !Number.isFinite(p)) return s
    return s + q * p
  }, 0)

  return (
    <div className="products-layout">
      <div className="products-list-pane">
        <div className="data-toolbar data-toolbar--stack">
          <div className="search-field">
            <span className="search-icon" aria-hidden />
            <input
              type="search"
              placeholder="Buscar por producto, mesa, pago…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar ventas"
            />
          </div>
          <div className="toolbar-filters toolbar-filters--wrap">
            <label className="filter-field">
              <span>Origen</span>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
              >
                <option value="">Todos</option>
                {SALE_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
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
                setFilterSource('')
                setFilterDateFrom('')
                setFilterDateTo('')
              }}
            >
              Limpiar filtros
            </button>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="btn-primary" onClick={openCreate}>
              Nueva venta
            </button>
          </div>
        </div>

        {listError && (
          <p className="error" role="alert">
            {listError}
          </p>
        )}
        {loading && <p className="muted">Cargando ventas…</p>}

        {!loading && list.length > 0 && (
          <div className="data-table-wrap data-table-elevated">
            <table className="data-table data-table-striped">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th className="num">Total</th>
                  <th className="num">Líneas</th>
                  <th>Origen</th>
                  <th>Pago</th>
                  <th>Mesa</th>
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
                        onClick={() => openSale(row.id)}
                      >
                        {formatSaleDate(row.saleDate)}
                      </button>
                    </td>
                    <td className="num mono">{formatCOP(row.total)}</td>
                    <td className="num">{row._count.lines}</td>
                    <td>
                      <span className="pill">{row.source}</span>
                    </td>
                    <td className="muted">{row.paymentMethod ?? '—'}</td>
                    <td className="muted">{row.mesa ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.total > 0 && (
          <div className="pagination-bar">
            <span className="muted">
              {meta.total} venta{meta.total !== 1 ? 's' : ''}
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
          <p className="empty-hint">No hay ventas en esta página.</p>
        )}
      </div>

      {panelOpen && header && (
        <aside className="editor-panel sales-editor-panel" aria-label="Editor de venta">
          <div className="editor-panel-head">
            <h2>{creating ? 'Nueva venta' : 'Editar venta'}</h2>
            <button
              type="button"
              className="btn-ghost icon-close"
              onClick={closePanel}
              aria-label="Cerrar"
            />
          </div>

          <div className="editor-panel-body">
            {detailLoading && (
              <p className="muted">Cargando detalle…</p>
            )}
            {detailError && (
              <p className="error" role="alert">
                {detailError}
              </p>
            )}

            {(!detailLoading || creating) && header && (
              <>
                <div className="sales-header-block">
                  <label className="field">
                    <span>Fecha y hora</span>
                    <input
                      type="datetime-local"
                      value={header.saleDateLocal}
                      onChange={(e) =>
                        setHeader({ ...header, saleDateLocal: e.target.value })
                      }
                    />
                  </label>
                  <div className="field-row-2">
                    <label className="field">
                      <span>Origen</span>
                      <select
                        value={header.source}
                        onChange={(e) =>
                          setHeader({ ...header, source: e.target.value })
                        }
                      >
                        {SALE_SOURCES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Medio de pago</span>
                      <input
                        value={header.paymentMethod}
                        onChange={(e) =>
                          setHeader({
                            ...header,
                            paymentMethod: e.target.value,
                          })
                        }
                        placeholder="Efectivo, Nequi…"
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span>Mesa / referencia</span>
                    <input
                      value={header.mesa}
                      onChange={(e) =>
                        setHeader({ ...header, mesa: e.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Notas</span>
                    <textarea
                      rows={2}
                      value={header.notes}
                      onChange={(e) =>
                        setHeader({ ...header, notes: e.target.value })
                      }
                    />
                  </label>

                  {!creating && selectedId && (
                    <>
                      {saveHeaderError && (
                        <p className="error" role="alert">
                          {saveHeaderError}
                        </p>
                      )}
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={savingHeader}
                        onClick={() => void saveHeader()}
                      >
                        {savingHeader ? 'Guardando…' : 'Guardar cabecera'}
                      </button>
                    </>
                  )}
                </div>

                <div className="sales-lines-block">
                  <div className="sales-lines-head">
                    <h3>Líneas</h3>
                    <p className="muted small">
                      Subtotal editado:{' '}
                      <strong className="mono">{formatCOP(linesSubtotal)}</strong>
                      {!creating && detail && (
                        <>
                          {' '}
                          · Total registrado:{' '}
                          <strong className="mono">
                            {formatCOP(detail.total)}
                          </strong>
                        </>
                      )}
                    </p>
                  </div>

                  <label className="field">
                    <span>Buscar producto para enlazar</span>
                    <input
                      type="search"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Nombre del catálogo…"
                    />
                  </label>

                  <div className="recipe-table-wrap sales-lines-table-wrap">
                    <table className="recipe-table sales-lines-table">
                      <thead>
                        <tr>
                          <th>Enlazar</th>
                          <th>Producto (texto en ticket)</th>
                          <th className="col-qty">Cant.</th>
                          <th className="col-cost">P. unit.</th>
                          <th className="col-cost">Subt.</th>
                          <th className="col-actions" />
                        </tr>
                      </thead>
                      <tbody>
                        {lineRows.map((r) => {
                          const q = num(r.quantity)
                          const p = num(r.unitPrice)
                          const sub =
                            Number.isFinite(q) && Number.isFinite(p)
                              ? formatCOP(q * p)
                              : '—'
                          return (
                            <tr key={r.key}>
                              <td>
                                <select
                                  className="recipe-select"
                                  value={r.productId}
                                  onChange={(e) => {
                                    const id = e.target.value
                                    const hit = productHits.find(
                                      (x) => x.id === id,
                                    )
                                    updateLine(r.key, {
                                      productId: id,
                                      productName: hit?.name ?? r.productName,
                                    })
                                  }}
                                >
                                  <option value="">— Elegir —</option>
                                  {productHits.map((prod) => (
                                    <option key={prod.id} value={prod.id}>
                                      {prod.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  className="input-cell"
                                  value={r.productName}
                                  onChange={(e) =>
                                    updateLine(r.key, {
                                      productName: e.target.value,
                                    })
                                  }
                                />
                              </td>
                              <td className="col-qty">
                                <input
                                  className="input-cell"
                                  inputMode="decimal"
                                  value={r.quantity}
                                  onChange={(e) =>
                                    updateLine(r.key, {
                                      quantity: e.target.value,
                                    })
                                  }
                                />
                              </td>
                              <td className="col-cost">
                                <input
                                  className="input-cell"
                                  inputMode="decimal"
                                  value={r.unitPrice}
                                  onChange={(e) =>
                                    updateLine(r.key, {
                                      unitPrice: e.target.value,
                                    })
                                  }
                                />
                              </td>
                              <td className="col-cost mono">{sub}</td>
                              <td className="col-actions">
                                <button
                                  type="button"
                                  className="btn-icon-remove"
                                  onClick={() => removeLine(r.key)}
                                  disabled={lineRows.length <= 1}
                                >
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="recipe-editor-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={addLine}
                    >
                      + Línea
                    </button>
                    {creating ? (
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={savingLines}
                        onClick={() => void saveNewSale()}
                      >
                        {savingLines ? 'Creando…' : 'Crear venta'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={savingLines || !selectedId}
                        onClick={() => void saveLines()}
                      >
                        {savingLines
                          ? 'Guardando líneas…'
                          : 'Guardar líneas y total'}
                      </button>
                    )}
                  </div>

                  {saveLinesError && (
                    <p className="error" role="alert">
                      {saveLinesError}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}
