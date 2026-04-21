/**
 * Cálculos puros para líneas de comprobante / lote (sin I/O).
 * El servicio Nest debe usar estos helpers para purchaseTotals y validaciones.
 */

const COP_TOLERANCE = 1

export function roundMoneyCOP(n: number): number {
  if (!Number.isFinite(n)) return NaN
  return Math.round(n)
}

/** line_total_cop coherente con cantidad × costo unitario de compra (COP). */
export function lineTotalFromPurchaseParts(
  quantityPurchased: number,
  purchaseUnitCostCOP: number,
): number {
  return roundMoneyCOP(quantityPurchased * purchaseUnitCostCOP)
}

/** Unidades ya consumidas del total comprado (misma unidad de medida). */
export function quantityConsumed(
  quantityPurchased: number,
  quantityRemaining: number,
): number {
  const p = Number.isFinite(quantityPurchased) ? quantityPurchased : 0
  const r = Number.isFinite(quantityRemaining) ? quantityRemaining : 0
  return Math.max(0, p - r)
}

/** Suma de line_total_cop (COP). */
export function sumLineTotalsCOP(lineTotals: readonly number[]): number {
  let s = 0
  for (const t of lineTotals) {
    if (!Number.isFinite(t)) return NaN
    s += t
  }
  return roundMoneyCOP(s)
}

/** true si |lotTotalValueCOP − Σ líneas| ≤ tolerancia (1 COP por defecto). */
export function purchaseTotalMatchesLines(
  lotTotalValueCOP: number,
  linesPurchaseTotalCOP: number,
  toleranceCOP: number = COP_TOLERANCE,
): boolean {
  if (!Number.isFinite(lotTotalValueCOP) || !Number.isFinite(linesPurchaseTotalCOP))
    return false
  return (
    Math.abs(roundMoneyCOP(lotTotalValueCOP) - roundMoneyCOP(linesPurchaseTotalCOP)) <=
    toleranceCOP
  )
}

export type TotalValueMismatch = {
  lotTotalValueCOP: number
  linesPurchaseTotalCOP: number
  deltaCOP: number
}

export function totalValueVsLinesPurchaseMismatch(
  lotTotalValueCOP: number,
  linesPurchaseTotalCOP: number,
): TotalValueMismatch {
  const a = roundMoneyCOP(lotTotalValueCOP)
  const b = roundMoneyCOP(linesPurchaseTotalCOP)
  return {
    lotTotalValueCOP: a,
    linesPurchaseTotalCOP: b,
    deltaCOP: roundMoneyCOP(a - b),
  }
}

/**
 * Para PATCH /purchase-lots/:id cuando ya hay líneas: rechazar total incoherente.
 * @throws Error con mensaje para mapear a BadRequestException en Nest.
 */
export function assertPatchTotalValueCoherentWithLines(
  hasPurchaseLines: boolean,
  patchTotalValueCOP: number | undefined | null,
  linesPurchaseTotalCOP: number,
  toleranceCOP: number = COP_TOLERANCE,
): void {
  if (!hasPurchaseLines || patchTotalValueCOP == null) return
  if (purchaseTotalMatchesLines(patchTotalValueCOP, linesPurchaseTotalCOP, toleranceCOP))
    return
  const { deltaCOP } = totalValueVsLinesPurchaseMismatch(
    patchTotalValueCOP,
    linesPurchaseTotalCOP,
  )
  throw new Error(
    `totalValue (${patchTotalValueCOP} COP) no cuadra con la suma de líneas de compra (${linesPurchaseTotalCOP} COP); Δ=${deltaCOP} COP. No se puede borrar costo por consumo.`,
  )
}
