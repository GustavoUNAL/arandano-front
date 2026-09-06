import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { formatCOP, parseMoney } from '../../lib/money'
import { POS_EXTRA_CHARGE_PRESETS } from '../../lib/extraCharge'

type Props = {
  open: boolean
  busy?: boolean
  error?: string | null
  onClose: () => void
  onConfirm: (payload: { amountCOP: number; reason: string }) => void | Promise<void>
}

export function PosOrderExtraChargeModal({
  open,
  busy = false,
  error = null,
  onClose,
  onConfirm,
}: Props) {
  const titleId = useId()
  const amountRef = useRef<HTMLInputElement>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setAmount('')
    setReason('')
    setLocalError(null)
    const id = window.requestAnimationFrame(() => amountRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open])

  if (!open) return null

  const amountCOP = parseMoney(amount)
  const reasonTrim = reason.trim()
  const canSave = amountCOP > 0 && reasonTrim.length > 0 && !busy

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (amountCOP <= 0) {
      setLocalError('Indique el monto del cargo.')
      return
    }
    if (!reasonTrim) {
      setLocalError('Indique el motivo (ej. copa rota).')
      return
    }
    setLocalError(null)
    await onConfirm({ amountCOP, reason: reasonTrim })
  }

  const displayError = localError || error

  return (
    <div className="pos-modal-backdrop" role="presentation" onClick={busy ? undefined : onClose}>
      <div
        className="pos-modal pos-modal--extra-charge"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="pos-modal__head">
          <h2 id={titleId}>Costo adicional</h2>
          <button
            type="button"
            className="pos-modal__close"
            disabled={busy}
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form className="pos-modal__body pos-extra-charge" onSubmit={(e) => void handleSubmit(e)}>
          <p className="pos-extra-charge__lead muted small">
            Súmalo a la cuenta cuando haya un cargo ocasional: vaso roto, daño, etc.
          </p>

          <label className="pos-extra-charge__field">
            <span className="pos-extra-charge__label">Monto (COP)</span>
            <input
              ref={amountRef}
              type="number"
              className="pos-input pos-extra-charge__amount"
              min={0}
              step={500}
              inputMode="numeric"
              value={amount}
              disabled={busy}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ej. 15000"
              required
            />
            {amountCOP > 0 ? (
              <span className="pos-extra-charge__amount-preview mono muted small">
                {formatCOP(amountCOP)}
              </span>
            ) : null}
          </label>

          <div className="pos-extra-charge__presets" role="group" aria-label="Motivos frecuentes">
            {POS_EXTRA_CHARGE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`pos-extra-charge__preset${reason === preset ? ' pos-extra-charge__preset--active' : ''}`}
                disabled={busy}
                onClick={() => setReason(preset)}
              >
                {preset}
              </button>
            ))}
          </div>

          <label className="pos-extra-charge__field">
            <span className="pos-extra-charge__label">Motivo *</span>
            <textarea
              className="pos-input pos-input--textarea pos-extra-charge__reason"
              value={reason}
              disabled={busy}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Cliente rompió una copa de vino"
              rows={2}
              required
            />
          </label>

          {displayError ? (
            <p className="pos-extra-charge__error" role="alert">
              {displayError}
            </p>
          ) : null}

          <footer className="pos-modal__actions">
            <button
              type="button"
              className="pos-btn pos-btn--ghost"
              disabled={busy}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="pos-btn pos-btn--primary" disabled={!canSave}>
              {busy ? 'Agregando…' : 'Agregar a la cuenta'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
