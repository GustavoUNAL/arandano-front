import { useCallback, useMemo, useState } from 'react'
import {
  createPurchaseLot,
  type CreatePurchaseLotPayload,
} from '../api'
import { invalidateCalendarNamespace } from '../lib/calendarCache'
import { formatPurchaseCOP } from '../lib/purchaseLotUi'
import { PurchaseReceiptCapture } from './PurchaseReceiptCapture'

type LineDraft = {
  key: string
  lineName: string
  quantity: string
  unit: string
  unitCost: string
  lineTotal: string
  lineTotalManual: boolean
}

function newLineKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function emptyLine(): LineDraft {
  return {
    key: newLineKey(),
    lineName: '',
    quantity: '1',
    unit: 'und',
    unitCost: '',
    lineTotal: '',
    lineTotalManual: false,
  }
}

function todayInputValue(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
  }).format(new Date())
}

function parseNum(v: string): number {
  const n = parseFloat(v.replace(',', '.').trim())
  return Number.isFinite(n) ? n : NaN
}

function lineImporte(row: LineDraft): number {
  if (row.lineTotalManual) {
    const manual = parseNum(row.lineTotal)
    if (Number.isFinite(manual) && manual >= 0) return Math.round(manual)
  }
  const q = parseNum(row.quantity)
  const c = parseNum(row.unitCost)
  if (!Number.isFinite(q) || !Number.isFinite(c) || q <= 0 || c < 0) return 0
  return Math.round(q * c)
}

type Props = {
  baseUrl: string
  initialDate?: string
  onClose: () => void
  onCreated: (lotId: string) => void
}

export function CreateDailyPurchaseModal({
  baseUrl,
  initialDate,
  onClose,
  onCreated,
}: Props) {
  const [purchaseDate, setPurchaseDate] = useState(
    initialDate?.trim() || todayInputValue(),
  )
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [receiptImageDataUrl, setReceiptImageDataUrl] = useState<string | null>(null)
  const [lines, setLines] = useState<LineDraft[]>(() => [emptyLine()])
  const [totalValue, setTotalValue] = useState('')
  const [totalManual, setTotalManual] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const linesSubtotal = useMemo(
    () => lines.reduce((acc, row) => acc + lineImporte(row), 0),
    [lines],
  )

  const displayTotal = useMemo(() => {
    if (totalManual) {
      const manual = parseNum(totalValue)
      if (Number.isFinite(manual) && manual >= 0) return Math.round(manual)
    }
    return linesSubtotal
  }, [linesSubtotal, totalManual, totalValue])

  const updateLine = useCallback(
    (key: string, patch: Partial<LineDraft>) => {
      setLines((prev) =>
        prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
      )
    },
    [],
  )

  const submit = useCallback(async () => {
    setError(null)
    const validLines: NonNullable<CreatePurchaseLotPayload['lines']> = []

    for (const row of lines) {
      const lineName = row.lineName.trim()
      const quantityPurchased = parseNum(row.quantity)
      const unit = row.unit.trim() || 'und'
      const importe = lineImporte(row)

      if (!lineName) continue
      if (!Number.isFinite(quantityPurchased) || quantityPurchased <= 0) continue
      if (importe <= 0) continue

      const purchaseUnitCostCOP = Math.round(
        parseNum(row.unitCost) >= 0
          ? parseNum(row.unitCost)
          : Math.round(importe / quantityPurchased),
      )

      const payload: NonNullable<CreatePurchaseLotPayload['lines']>[number] = {
        lineName,
        quantityPurchased,
        unit,
        purchaseUnitCostCOP,
      }
      if (row.lineTotalManual || importe !== Math.round(quantityPurchased * purchaseUnitCostCOP)) {
        payload.lineTotalCOP = importe
      }
      validLines.push(payload)
    }

    if (validLines.length === 0) {
      setError('Agregá al menos una línea con nombre, cantidad y valor de compra.')
      return
    }

    if (displayTotal <= 0) {
      setError('Indicá el valor total de la compra (por línea o en el total).')
      return
    }

    setSaving(true)
    try {
      const lot = await createPurchaseLot(baseUrl, {
        purchaseDate,
        supplier: supplier.trim() || undefined,
        notes: notes.trim() || undefined,
        lines: validLines,
        totalValue: displayTotal,
        receiptImageDataUrl: receiptImageDataUrl?.trim() || undefined,
      })
      invalidateCalendarNamespace('purchases')
      onCreated(lot.id)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }, [
    baseUrl,
    displayTotal,
    lines,
    notes,
    onClose,
    onCreated,
    purchaseDate,
    receiptImageDataUrl,
    supplier,
  ])

  return (
    <div
      className="modal-backdrop modal-backdrop--product-submodal modal-backdrop--config"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section
        className="modal modal--config modal--config-xl modal--product-submodal modal--daily-purchase"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-purchase-title"
      >
        <header className="modal-head modal-head--config modal-head--product-submodal">
          <div className="modal-head-title product-submodal-head__copy">
            <h2 id="daily-purchase-title">Registrar compra del día</h2>
            <p className="product-submodal-head__product muted small">
              Comprobante con proveedor, fecha, líneas y valor pagado.
            </p>
          </div>
          <button
            type="button"
            className="product-editor-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <span aria-hidden>×</span>
          </button>
        </header>

        <div className="modal-body modal-body--config modal-body--product-submodal">
          <div className="daily-purchase-form">
            <div className="product-editor-grid-2">
              <label className="inventory-filter">
                <span className="inventory-filter__label">Fecha de compra</span>
                <input
                  className="inventory-filter__input"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </label>
              <label className="inventory-filter">
                <span className="inventory-filter__label">Proveedor</span>
                <input
                  className="inventory-filter__input"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Opcional"
                />
              </label>
            </div>
            <label className="inventory-filter">
              <span className="inventory-filter__label">Notas</span>
              <textarea
                className="input-cell product-editor-description-input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Referencia de factura, observaciones…"
              />
            </label>

            <PurchaseReceiptCapture
              receiptDataUrl={receiptImageDataUrl}
              onReceiptChange={setReceiptImageDataUrl}
            />

            <div className="daily-purchase-lines">
              <div className="daily-purchase-lines__head">
                <h3 className="daily-purchase-lines__title">Líneas de compra</h3>
                <button
                  type="button"
                  className="btn-secondary btn-compact"
                  onClick={() => setLines((prev) => [...prev, emptyLine()])}
                >
                  + Línea
                </button>
              </div>
              <div className="daily-purchase-line daily-purchase-line--head" aria-hidden>
                <span>Producto</span>
                <span>Cant.</span>
                <span>Unidad</span>
                <span>Costo u.</span>
                <span>Importe</span>
                <span />
              </div>
              {lines.map((row) => (
                <div key={row.key} className="daily-purchase-line">
                  <input
                    className="input-cell"
                    value={row.lineName}
                    onChange={(e) => updateLine(row.key, { lineName: e.target.value })}
                    placeholder="Producto / concepto"
                    aria-label="Nombre de línea"
                  />
                  <input
                    className="input-cell mono"
                    inputMode="decimal"
                    value={row.quantity}
                    onChange={(e) => {
                      const quantity = e.target.value
                      const patch: Partial<LineDraft> = { quantity }
                      if (!row.lineTotalManual) {
                        const q = parseNum(quantity)
                        const c = parseNum(row.unitCost)
                        if (Number.isFinite(q) && Number.isFinite(c) && q > 0 && c >= 0) {
                          patch.lineTotal = String(Math.round(q * c))
                        }
                      }
                      updateLine(row.key, patch)
                    }}
                    placeholder="Cant."
                    aria-label="Cantidad"
                  />
                  <input
                    className="input-cell"
                    value={row.unit}
                    onChange={(e) => updateLine(row.key, { unit: e.target.value })}
                    placeholder="und"
                    aria-label="Unidad"
                  />
                  <input
                    className="input-cell mono"
                    inputMode="decimal"
                    value={row.unitCost}
                    onChange={(e) => {
                      const unitCost = e.target.value
                      const patch: Partial<LineDraft> = { unitCost }
                      if (!row.lineTotalManual) {
                        const q = parseNum(row.quantity)
                        const c = parseNum(unitCost)
                        if (Number.isFinite(q) && Number.isFinite(c) && q > 0 && c >= 0) {
                          patch.lineTotal = String(Math.round(q * c))
                        }
                      }
                      updateLine(row.key, patch)
                    }}
                    placeholder="COP"
                    aria-label="Costo unitario COP"
                  />
                  <input
                    className="input-cell mono"
                    inputMode="decimal"
                    value={row.lineTotal}
                    onChange={(e) =>
                      updateLine(row.key, {
                        lineTotal: e.target.value,
                        lineTotalManual: true,
                      })
                    }
                    placeholder={String(lineImporte({ ...row, lineTotalManual: false }))}
                    aria-label="Importe de línea COP"
                  />
                  {lines.length > 1 ? (
                    <button
                      type="button"
                      className="btn-secondary btn-compact daily-purchase-line__remove"
                      onClick={() =>
                        setLines((prev) => prev.filter((r) => r.key !== row.key))
                      }
                      aria-label="Quitar línea"
                    >
                      ×
                    </button>
                  ) : (
                    <span className="daily-purchase-line__remove-spacer" aria-hidden />
                  )}
                </div>
              ))}
            </div>

            <div className="daily-purchase-total-block">
              <div className="daily-purchase-total-block__row">
                <span className="muted small">Subtotal líneas</span>
                <strong className="mono">{formatPurchaseCOP(linesSubtotal)}</strong>
              </div>
              <label className="daily-purchase-total-block__field">
                <span className="inventory-filter__label">Valor total de la compra (COP)</span>
                <input
                  className="input-cell mono daily-purchase-total-block__input"
                  inputMode="decimal"
                  value={totalManual ? totalValue : String(displayTotal)}
                  onChange={(e) => {
                    setTotalManual(true)
                    setTotalValue(e.target.value)
                  }}
                  onFocus={() => {
                    if (!totalManual) {
                      setTotalManual(true)
                      setTotalValue(String(displayTotal))
                    }
                  }}
                  aria-label="Valor total de la compra"
                />
              </label>
              <p className="muted small daily-purchase-total-block__hint">
                Podés ajustar el total si el comprobante no coincide exactamente con la suma de
                líneas.
              </p>
            </div>

            {error ? (
              <p className="error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <footer className="product-editor-footer modal-footer--config product-submodal-footer product-submodal-footer--advanced">
          <button
            type="button"
            className="product-editor-btn product-editor-btn--secondary"
            disabled={saving}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="product-editor-btn product-editor-btn--primary"
            disabled={saving}
            onClick={() => void submit()}
          >
            {saving ? 'Guardando…' : 'Registrar compra'}
          </button>
        </footer>
      </section>
    </div>
  )
}
